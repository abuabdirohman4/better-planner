// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export async function deleteWeeklyGoal(
  supabase: SupabaseClient,
  goalId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function queryExistingWeeklyGoal(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  weekNumber: number,
  goalSlot: number
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('id')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .eq('goal_slot', goalSlot)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function updateWeeklyGoalQuarter(
  supabase: SupabaseClient,
  goalId: string,
  quarter: number
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .update({ quarter })
    .eq('id', goalId)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function insertWeeklyGoal(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number,
  goalSlot: number
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .insert({ user_id: userId, year, quarter, week_number: weekNumber, goal_slot: goalSlot })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function queryExistingGoalItems(
  supabase: SupabaseClient,
  weeklyGoalId: string
): Promise<{ item_id: string; status: string }[]> {
  const { data } = await supabase
    .from('weekly_goal_items')
    .select('item_id, status')
    .eq('weekly_goal_id', weeklyGoalId);
  return data || [];
}

export async function deleteGoalItems(
  supabase: SupabaseClient,
  weeklyGoalId: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goal_items')
    .delete()
    .eq('weekly_goal_id', weeklyGoalId);
  if (error) throw error;
}

export async function insertGoalItems(
  supabase: SupabaseClient,
  items: { weekly_goal_id: string; item_id: string; status: string }[]
): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from('weekly_goal_items').insert(items);
  if (error && error.code !== '23505') throw error;
}
