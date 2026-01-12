"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getQuarterDates } from "@/lib/quarterUtils";
import { SideQuest } from "../types";

export async function getSideQuests(year: number, quarter: number): Promise<SideQuest[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get date range for the quarter
    const { startDate, endDate } = getQuarterDates(year, quarter);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'SIDE_QUEST')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching side quests:', error);
    return [];
  }
}

export async function updateSideQuestStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath('/quests/side-quests');
  } catch (error) {
    console.error('Error updating side quest status:', error);
    throw error;
  }
}

export async function updateSideQuest(taskId: string, updates: { title?: string; description?: string }): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: { title?: string; description?: string; updated_at: string } = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .eq('type', 'SIDE_QUEST');

    if (error) {
      throw error;
    }

    revalidatePath('/quests/side-quests');
  } catch (error) {
    console.error('Error updating side quest:', error);
    throw error;
  }
}

export async function deleteSideQuest(taskId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // 1. Get all session IDs for this task to delete nested events
    const { data: sessions } = await supabase
      .from('timer_sessions')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', user.id);

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      // 2. Delete timer events first (they block timer_sessions)
      const { error: eventsError } = await supabase
        .from('timer_events')
        .delete()
        .in('session_id', sessionIds);

      if (eventsError) throw eventsError;
    }

    // 3. Delete timer sessions
    const { error: timerError } = await supabase
      .from('timer_sessions')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', user.id);

    if (timerError) throw timerError;

    // 4. Delete activity logs (they might block tasks)
    const { error: activityError } = await supabase
      .from('activity_logs')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', user.id);

    if (activityError) throw activityError;

    // 5. Delete daily_plan_items referencing this task
    const { error: planItemsError } = await supabase
      .from('daily_plan_items')
      .delete()
      .eq('item_id', taskId);

    if (planItemsError) throw planItemsError;

    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id)
      .eq('type', 'SIDE_QUEST');

    if (error) {
      throw error;
    }

    revalidatePath('/quests/side-quests');
  } catch (error) {
    console.error('Error deleting side quest:', error);
    throw error;
  }
}
