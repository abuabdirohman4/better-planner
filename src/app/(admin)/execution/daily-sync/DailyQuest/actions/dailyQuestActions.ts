"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getQuarterDates } from '@/lib/quarterUtils';

/**
 * Add a new Daily Quest
 */
export async function addDailyQuest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const title = formData.get('title')?.toString();
  const focusDuration = Number(formData.get('focus_duration')) || 0;

  if (!title) {
    throw new Error('Title is required');
  }

  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title,
        type: 'DAILY_QUEST',
        status: 'TODO',
        focus_duration: focusDuration,
        milestone_id: null
      })
      .select()
      .single();

    if (taskError) throw taskError;

    revalidatePath('/execution/daily-sync');
    revalidatePath('/quests/daily-quests');
    return task;
  } catch (error) {
    console.error('Error adding daily quest:', error);
    throw error;
  }
}

/**
 * Archive a Daily Quest (Permanent)
 */
export async function archiveDailyQuest(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('tasks')
      .update({ is_archived: true })
      .eq('id', taskId);

    if (error) throw error;

    revalidatePath('/execution/daily-sync');
    revalidatePath('/quests/daily-quests');
    return { success: true };
  } catch (error) {
    console.error('Error archiving daily quest:', error);
    throw error;
  }
}

/**
 * Delete a Daily Quest (Permanent)
 */
export async function deleteDailyQuest(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
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
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/execution/daily-sync');
    revalidatePath('/quests/daily-quests');
    return { success: true };
  } catch (error) {
    console.error('Error deleting daily quest:', error);
    throw error;
  }
}

/**
 * Fetch all available (non-archived) Daily Quests
 */
export async function getDailyQuests(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  // Get date range for the quarter
  const { startDate, endDate } = getQuarterDates(year, quarter);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'DAILY_QUEST')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching daily quests:', error);
    throw error;
  }

  return data;
}

/**
 * Update Daily Quest data
 */
export async function updateDailyQuest(taskId: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/execution/daily-sync');
    revalidatePath('/quests/daily-quests');
    return data;
  } catch (error) {
    console.error('Error updating daily quest:', error);
    throw error;
  }
}
