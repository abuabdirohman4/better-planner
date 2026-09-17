// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawCompletionRow {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  note: string | null;
  created_at: string;
  done_at: string | null;
}

/** Koreksi jam dikerjakan (app-r02c). `time` "HH:MM", atau null untuk kembali ke created_at. */
export async function updateCompletionDoneAt(
  supabase: SupabaseClient,
  completionId: string,
  userId: string,
  time: string | null
): Promise<RawCompletionRow> {
  const { data, error } = await supabase
    .from('habit_completions')
    .update({ done_at: time })
    .eq('id', completionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as RawCompletionRow;
}

export async function queryCompletionsInRange(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<RawCompletionRow[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RawCompletionRow[];
}

export async function queryCompletionsForMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<RawCompletionRow[]> {
  // month is 1-based (1 = January)
  const paddedMonth = String(month).padStart(2, '0');
  const firstDay = `${year}-${paddedMonth}-01`;
  const lastDay = `${year}-${paddedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  return queryCompletionsInRange(supabase, userId, firstDay, lastDay);
}

export async function queryCompletion(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  date: string
): Promise<RawCompletionRow | null> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('date', date)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as RawCompletionRow;
}

export async function insertCompletion(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  date: string
): Promise<RawCompletionRow> {
  const { data, error } = await supabase
    .from('habit_completions')
    .insert({ habit_id: habitId, user_id: userId, date })
    .select()
    .single();

  if (error) throw error;
  return data as RawCompletionRow;
}

/** Delete only the most recent completion row for that day (multi-completion decrement). */
export async function deleteLastCompletion(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  date: string
): Promise<void> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const { error: delError } = await supabase
    .from('habit_completions')
    .delete()
    .eq('id', data.id)
    .eq('user_id', userId);

  if (delError) throw delError;
}

/** Delete ALL completion rows for that day (binary toggle off). */
export async function deleteCompletion(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  date: string
): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;
}
