import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryWeeklyGoals(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
) {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('id, week_number, quarter')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .gte('week_number', 1)
    .lte('week_number', 13)
    .order('week_number', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function queryGoalItems(
  supabase: SupabaseClient,
  weeklyGoalIds: string[],
) {
  if (weeklyGoalIds.length === 0) return [];

  const { data, error } = await supabase
    .from('weekly_goal_items')
    .select('id, weekly_goal_id, item_id, status')
    .in('weekly_goal_id', weeklyGoalIds);

  if (error) throw error;
  return data ?? [];
}
