// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawDailyPlanItem {
  item_id: string;
}

export async function queryDailyPlanItem(
  supabase: SupabaseClient,
  dailyPlanItemId: string
): Promise<RawDailyPlanItem> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .select('item_id')
    .eq('id', dailyPlanItemId)
    .single();
  if (error) throw error;
  return data;
}

export async function countFocusSessions(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  date: string
): Promise<number> {
  const { count, error } = await supabase
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('type', 'FOCUS')
    .eq('local_date', date);
  if (error) throw error;
  return count || 0;
}
