"use server";

import { createClient } from "@/lib/supabase/server";
import {
  verifyPlanItemOwnership,
  insertSchedule,
  updateScheduleById,
  deleteScheduleById,
  querySchedulesByItemId,
  querySchedulesByDateRange,
  queryTaskTitlesByIds,
  RawSchedule,
} from "./queries";
import { wibDateToUtcRange, attachTaskTitles } from "./logic";

export type { RawSchedule as TaskSchedule };

export async function createSchedule(
  taskId: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  sessionCount: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const ownerId = await verifyPlanItemOwnership(supabase, taskId);
  if (!ownerId) throw new Error("Task not found");
  if (ownerId !== user.id) throw new Error("Unauthorized access to task");

  try {
    return await insertSchedule(supabase, {
      daily_plan_item_id: taskId,
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      duration_minutes: durationMinutes,
      session_count: sessionCount,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    throw new Error("Failed to create schedule");
  }
}

export async function updateSchedule(
  scheduleId: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  sessionCount: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  try {
    return await updateScheduleById(supabase, scheduleId, {
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      duration_minutes: durationMinutes,
      session_count: sessionCount,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw new Error("Failed to update schedule");
  }
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  try {
    await deleteScheduleById(supabase, scheduleId);
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw new Error("Failed to delete schedule");
  }
}

export async function getTaskSchedules(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  try {
    return await querySchedulesByItemId(supabase, taskId);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    throw new Error("Failed to fetch schedules");
  }
}

export async function getScheduledTasksByDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { startUTC, endUTC } = wibDateToUtcRange(date);

  try {
    const schedules = await querySchedulesByDateRange(supabase, startUTC, endUTC);
    const itemIds = schedules
      .map(s => s.daily_plan_item?.item_id)
      .filter(Boolean) as string[];
    const taskTitles = await queryTaskTitlesByIds(supabase, itemIds);
    return attachTaskTitles(schedules, taskTitles);
  } catch (error) {
    console.error("Error fetching scheduled tasks:", error);
    throw new Error("Failed to fetch scheduled tasks");
  }
}
