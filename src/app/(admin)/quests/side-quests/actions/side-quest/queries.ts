import type { SupabaseClient } from '@supabase/supabase-js';

export async function querySideQuests(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'SIDE_QUEST')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateSideQuestStatusField(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
) {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateSideQuestFields(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  updateData: Record<string, unknown>
) {
  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('type', 'SIDE_QUEST');
  if (error) throw error;
}

export async function queryTimerSessionsByTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
) {
  const { data } = await supabase
    .from('timer_sessions')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', userId);
  return data ?? [];
}

export async function deleteTimerEventsBySessionIds(
  supabase: SupabaseClient,
  sessionIds: string[]
) {
  if (sessionIds.length === 0) return;
  const { error } = await supabase
    .from('timer_events')
    .delete()
    .in('session_id', sessionIds);
  if (error) throw error;
}

export async function deleteTimerSessionsByTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
) {
  const { error } = await supabase
    .from('timer_sessions')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteActivityLogsByTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
) {
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteDailyPlanItemsByTask(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('item_id', taskId);
  if (error) throw error;
}

export async function deleteSideQuestTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('type', 'SIDE_QUEST');
  if (error) throw error;
}
