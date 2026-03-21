// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export async function queryTaskTitlesByIds(
  supabase: SupabaseClient,
  taskIds: string[]
): Promise<{ id: string; title: string }[]> {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase.from('tasks').select('id, title').in('id', taskIds);
  if (error) throw error;
  return data || [];
}

export async function rpcUpdateTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  userId: string,
  goalSlot: number,
  weekDate: string
): Promise<unknown> {
  const { data, error } = await supabase.rpc('update_task_and_daily_plan_status', {
    p_task_id: taskId,
    p_status: status,
    p_user_id: userId,
    p_goal_slot: goalSlot,
    p_date: weekDate,
    p_daily_plan_item_id: null,
  });
  if (error) throw error;
  return data;
}

export async function updateWeeklyGoalItemsStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goal_items')
    .update({ status })
    .eq('item_id', taskId);
  if (error) console.warn('Error updating weekly_goal_items status:', error);
  // Don't throw — task status already updated by RPC
}
