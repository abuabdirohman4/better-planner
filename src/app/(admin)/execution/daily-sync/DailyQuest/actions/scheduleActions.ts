"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TaskSchedule = {
  id: string;
  daily_plan_item_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
  created_at: string;
  updated_at: string;
};

export async function createSchedule(
  taskId: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  sessionCount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Verify task ownership
  const { data: task, error: taskError } = await supabase
    .from("daily_plan_items")
    .select(`
      id,
      daily_plans (
        user_id
      )
    `)
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    throw new Error("Task not found");
  }

  // Safe access to nested user_id
  const plan = task.daily_plans;
  // @ts-ignore - Supabase types might infer this restrictedly
  const planUserId = Array.isArray(plan) ? plan[0]?.user_id : plan?.user_id;

  if (planUserId !== user.id) {
    throw new Error("Unauthorized access to task");
  }

  const { data, error } = await supabase
    .from("task_schedules")
    .insert({
      daily_plan_item_id: taskId,
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      duration_minutes: durationMinutes,
      session_count: sessionCount,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating schedule:", error);
    throw new Error("Failed to create schedule");
  }

  revalidatePath("/(admin)/execution/daily-sync");
  return data;
}

export async function updateSchedule(
  scheduleId: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  sessionCount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("task_schedules")
    .update({
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      duration_minutes: durationMinutes,
      session_count: sessionCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    console.error("Error updating schedule:", error);
    throw new Error("Failed to update schedule");
  }

  revalidatePath("/(admin)/execution/daily-sync");
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("task_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) {
    console.error("Error deleting schedule:", error);
    throw new Error("Failed to delete schedule");
  }

  revalidatePath("/(admin)/execution/daily-sync");
}

export async function getTaskSchedules(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("task_schedules")
    .select("*")
    .eq("daily_plan_item_id", taskId)
    .order("scheduled_start_time", { ascending: true });

  if (error) {
    console.error("Error fetching schedules:", error);
    throw new Error("Failed to fetch schedules");
  }

  return data as TaskSchedule[];
}

export async function getScheduledTasksByDate(date: string) {
  // Schedule times are stored in UTC. To reliably capture ALL schedules
  // for any local day regardless of timezone, query a wide UTC range.
  const prevDay = new Date(`${date}T00:00:00.000Z`);
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  const startOfDay = prevDay.toISOString();
  const nextDay = new Date(`${date}T23:59:59.999Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const endOfDay = nextDay.toISOString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("task_schedules")
    .select(`
      *,
      daily_plan_item:daily_plan_items (
        id,
        item_id,
        status,
        item_type,
        focus_duration,
        daily_session_target
      )
    `)
    .gte("scheduled_start_time", startOfDay)
    .lte("scheduled_end_time", endOfDay)
    .order("scheduled_start_time", { ascending: true });

  if (error) {
    console.error("Error fetching scheduled tasks:", error);
    throw new Error("Failed to fetch scheduled tasks");
  }

  const schedules = data || [];

  // Manual join to get task titles
  const itemIds = schedules
    .map((s: any) => s.daily_plan_item?.item_id)
    .filter(Boolean);

  if (itemIds.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title')
      .in('id', itemIds);

    const taskMap = new Map((tasks || []).map((t) => [t.id, t.title]));

    return schedules.map((s: any) => ({
      ...s,
      daily_plan_item: {
        ...s.daily_plan_item,
        title: taskMap.get(s.daily_plan_item.item_id) || 'Untitled Task',
      },
    }));
  }

  return schedules;
}
