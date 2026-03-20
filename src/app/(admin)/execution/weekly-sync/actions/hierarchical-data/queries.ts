// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export async function queryCommittedQuests(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', true)
    .order('priority_score', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function querySelectedTaskIds(
  supabase: SupabaseClient,
  year: number,
  quarter: number
): Promise<string[]> {
  const { data, error } = await supabase
    .from('weekly_goal_items')
    .select('item_id, weekly_goals!inner(year, quarter, week_number)')
    .eq('weekly_goals.year', year)
    .eq('weekly_goals.quarter', quarter);
  if (error) throw error;
  return (data || []).map((st: any) => st.item_id);
}

export async function queryMilestonesByQuestIds(
  supabase: SupabaseClient,
  questIds: string[]
): Promise<{ id: string; title: string; quest_id: string }[]> {
  if (questIds.length === 0) return [];
  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, quest_id')
    .in('quest_id', questIds)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function queryParentTasksByMilestoneIds(
  supabase: SupabaseClient,
  milestoneIds: string[]
): Promise<{ id: string; title: string; status: string; milestone_id: string }[]> {
  if (milestoneIds.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, milestone_id')
    .in('milestone_id', milestoneIds)
    .is('parent_task_id', null)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function querySubtasksByParentIds(
  supabase: SupabaseClient,
  parentTaskIds: string[]
): Promise<{ id: string; title: string; status: string; parent_task_id: string }[]> {
  if (parentTaskIds.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, parent_task_id')
    .in('parent_task_id', parentTaskIds)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}
