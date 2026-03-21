// NO "use server" directive here — this file must be importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export type WorkQuestStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// Raw DB row types (as returned by Supabase, before transformation)
export interface RawTaskRow {
  id: string;
  parent_task_id?: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function queryProjectsByQuarter(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<RawTaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, created_at, updated_at')
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function queryTasksByProjectIds(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<RawTaskRow[]> {
  if (projectIds.length === 0) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('id, parent_task_id, title, description, status, created_at, updated_at')
    .in('parent_task_id', projectIds)
    .eq('type', 'WORK_QUEST')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function queryProjectById(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<RawTaskRow | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, created_at, updated_at')
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null)
    .single();

  if (error) throw error;
  return data;
}

export async function queryTasksByProjectId(
  supabase: SupabaseClient,
  projectId: string
): Promise<RawTaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, parent_task_id, title, description, status, created_at, updated_at')
    .eq('parent_task_id', projectId)
    .eq('type', 'WORK_QUEST')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function insertProject(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<RawTaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, description: null, type: 'WORK_QUEST', status: 'TODO', parent_task_id: null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectTitle(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ title, description: null, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null);

  if (error) throw error;
}

export async function updateProjectStatus(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  status: WorkQuestStatus
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null);

  if (error) throw error;
}

export async function deleteProjectById(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteTasksByProjectId(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('parent_task_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function queryTimerSessionIdsByTaskIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[]
): Promise<string[]> {
  if (taskIds.length === 0) return [];

  const { data } = await supabase
    .from('timer_sessions')
    .select('id')
    .in('task_id', taskIds)
    .eq('user_id', userId);

  return (data || []).map((s: { id: string }) => s.id);
}

export async function deleteTimerEventsBySessionIds(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;

  const { error } = await supabase
    .from('timer_events')
    .delete()
    .in('session_id', sessionIds);

  if (error) throw error;
}

export async function deleteTimerSessionsByTaskIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('timer_sessions')
    .delete()
    .in('task_id', taskIds)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteActivityLogsByTaskIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .in('task_id', taskIds)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteDailyPlanItemsByTaskIds(
  supabase: SupabaseClient,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .in('item_id', taskIds);

  if (error) throw error;
}
