// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';
import type { Habit, HabitFormInput } from '@/types/habit';

export interface RawHabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  frequency: string;
  monthly_goal: number;
  daily_target: number;
  target_days: number[] | null;
  show_in_daily_sync: boolean;
  tracking_type: string;
  target_time: string | null;
  deadline_time: string | null;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function queryHabits(
  supabase: SupabaseClient,
  userId: string,
  includeArchived = false
): Promise<RawHabitRow[]> {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RawHabitRow[];
}

export async function insertHabit(
  supabase: SupabaseClient,
  userId: string,
  data: HabitFormInput
): Promise<RawHabitRow> {
  const { data: row, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      frequency: data.frequency,
      monthly_goal: data.monthly_goal,
      daily_target: data.daily_target ?? 1,
      target_days: normalizeTargetDays(data),
      show_in_daily_sync: data.show_in_daily_sync ?? false,
      tracking_type: data.tracking_type,
      target_time: data.target_time ?? null,
      deadline_time: data.deadline_time ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return row as RawHabitRow;
}

export async function updateHabitById(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  data: Partial<HabitFormInput>
): Promise<RawHabitRow> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description ?? null;
  if (data.category !== undefined) updates.category = data.category;
  if (data.frequency !== undefined) updates.frequency = data.frequency;
  if (data.monthly_goal !== undefined) updates.monthly_goal = data.monthly_goal;
  if (data.daily_target !== undefined) updates.daily_target = data.daily_target;
  if ('target_days' in data || data.frequency !== undefined) updates.target_days = normalizeTargetDays(data);
  if (data.show_in_daily_sync !== undefined) updates.show_in_daily_sync = data.show_in_daily_sync;
  if (data.tracking_type !== undefined) updates.tracking_type = data.tracking_type;
  if ('target_time' in data) updates.target_time = data.target_time ?? null;
  if (data.deadline_time !== undefined) updates.deadline_time = data.deadline_time;

  const { data: row, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return row as RawHabitRow;
}

export async function archiveHabitById(
  supabase: SupabaseClient,
  habitId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteHabitById(
  supabase: SupabaseClient,
  habitId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) throw error;
}

/** Only weekly habits carry target_days; everything else means "every day" (null). */
function normalizeTargetDays(data: Partial<HabitFormInput>): number[] | null {
  if (data.frequency !== undefined && data.frequency !== 'weekly') return null;
  const days = data.target_days;
  return days && days.length > 0 ? days : null;
}

// Re-export Habit type so logic.ts can import from here if needed
export type { Habit };
