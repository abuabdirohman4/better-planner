// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawTask {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: string;
  milestone_id: string | null;
}

export interface RawDailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
}

export async function insertSideQuestTask(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<RawTask> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, type: 'SIDE_QUEST', status: 'TODO', milestone_id: null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<RawDailyPlan> {
  const { data, error } = await supabase
    .from('daily_plans')
    .upsert({ user_id: userId, plan_date: date }, { onConflict: 'user_id,plan_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertSideQuestPlanItem(
  supabase: SupabaseClient,
  dailyPlanId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('daily_plan_items').insert({
    daily_plan_id: dailyPlanId,
    item_id: taskId,
    item_type: 'SIDE_QUEST',
    status: 'TODO',
    focus_duration: 25,
  });
  if (error) throw error;
}
