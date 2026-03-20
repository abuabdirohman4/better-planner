// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawWeeklyGoal {
  id: string;
  goal_slot: number;
}

export interface RawWeeklyGoalItem {
  id: string;
  weekly_goal_id: string;
  item_id: string;
}

export interface RawTask {
  id: string;
  title: string;
  status: string;
  milestone_id: string | null;
  type: string;
  parent_task_id: string | null;
}

export interface RawMilestone {
  id: string;
  title: string;
  quest_id: string | null;
}

export interface RawQuest {
  id: string;
  title: string;
}

export interface RawCompletedPlanItem {
  item_id: string;
}

export interface RawTodayPlanItem {
  item_id: string;
}

export async function queryWeeklyGoals(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  weekNumber: number
): Promise<RawWeeklyGoal[]> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('id, goal_slot')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('week_number', weekNumber);
  if (error) throw error;
  return data || [];
}

export async function queryWeeklyGoalItems(
  supabase: SupabaseClient,
  weeklyGoalIds: string[]
): Promise<RawWeeklyGoalItem[]> {
  const { data, error } = await supabase
    .from('weekly_goal_items')
    .select('id, weekly_goal_id, item_id')
    .in('weekly_goal_id', weeklyGoalIds);
  if (error) throw error;
  return data || [];
}

export async function queryTasksByIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<RawTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, milestone_id, type, parent_task_id')
    .in('id', itemIds);
  if (error) throw error;
  return data || [];
}

export async function queryMilestonesByIds(
  supabase: SupabaseClient,
  milestoneIds: string[]
): Promise<RawMilestone[]> {
  if (milestoneIds.length === 0) return [];
  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, quest_id')
    .in('id', milestoneIds);
  if (error) throw error;
  return data || [];
}

export async function queryQuestsByIds(
  supabase: SupabaseClient,
  questIds: string[]
): Promise<RawQuest[]> {
  if (questIds.length === 0) return [];
  const { data, error } = await supabase
    .from('quests')
    .select('id, title')
    .in('id', questIds);
  if (error) throw error;
  return data || [];
}

export async function queryCompletedPreviousDayItems(
  supabase: SupabaseClient,
  userId: string,
  previousDays: string[]
): Promise<RawCompletedPlanItem[]> {
  if (previousDays.length === 0) return [];
  const { data } = await supabase
    .from('daily_plan_items')
    .select('item_id, status, updated_at, daily_plans!inner(plan_date, user_id)')
    .eq('daily_plans.user_id', userId)
    .in('daily_plans.plan_date', previousDays)
    .eq('status', 'DONE');
  return (data || []).map((row: { item_id: string }) => ({ item_id: row.item_id }));
}

export async function queryTodayPlanItems(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<RawTodayPlanItem[]> {
  const { data } = await supabase
    .from('daily_plan_items')
    .select('item_id, status, daily_plans!inner(plan_date, user_id)')
    .eq('daily_plans.user_id', userId)
    .eq('daily_plans.plan_date', date);
  return (data || []).map((row: { item_id: string }) => ({ item_id: row.item_id }));
}
