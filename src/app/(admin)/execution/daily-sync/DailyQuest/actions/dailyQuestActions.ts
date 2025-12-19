"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

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
export async function getDailyQuests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('type', 'DAILY_QUEST')
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
