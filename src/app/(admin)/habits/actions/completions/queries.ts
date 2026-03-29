// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawCompletionRow {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  note: string | null;
  created_at: string;
}

export async function queryCompletionsForMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<RawCompletionRow[]> {
  // month is 1-based (1 = January)
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayDate = new Date(year, month, 0); // last day of month
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RawCompletionRow[];
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
