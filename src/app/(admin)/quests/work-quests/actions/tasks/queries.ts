// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawTaskRow {
  id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function insertTask(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  title: string
): Promise<RawTaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, parent_task_id: projectId, title, description: null, type: 'WORK_QUEST', status: 'TODO' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskTitle(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string
): Promise<RawTaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description: null, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  status: 'TODO' | 'DONE'
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST');

  if (error) throw error;
}

export async function deleteTaskById(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function queryTimerSessionIdsByTaskId(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<string[]> {
  const { data } = await supabase.from('timer_sessions').select('id').eq('task_id', taskId).eq('user_id', userId);
  return (data || []).map((s: { id: string }) => s.id);
}

export async function deleteTimerEventsBySessionIds(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;
  const { error } = await supabase.from('timer_events').delete().in('session_id', sessionIds);
  if (error) throw error;
}

export async function deleteTimerSessionsByTaskId(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('timer_sessions').delete().eq('task_id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteActivityLogsByTaskId(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('activity_logs').delete().eq('task_id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteDailyPlanItemsByTaskId(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('daily_plan_items').delete().eq('item_id', taskId);
  if (error) throw error;
}
