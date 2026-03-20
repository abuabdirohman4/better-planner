// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawTask {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  focus_duration: number;
  is_archived: boolean;
  milestone_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawTimerSession {
  id: string;
}

export async function insertDailyQuestTask(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  focusDuration: number
): Promise<RawTask> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      type: 'DAILY_QUEST',
      status: 'TODO',
      focus_duration: focusDuration,
      milestone_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDailyQuestArchive(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', taskId);
  if (error) throw error;
}

export async function queryTimerSessions(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
): Promise<RawTimerSession[]> {
  const { data } = await supabase
    .from('timer_sessions')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', userId);
  return data || [];
}

export async function deleteTimerEvents(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('timer_events')
    .delete()
    .in('session_id', sessionIds);
  if (error) throw error;
}

export async function deleteTimerSessions(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('timer_sessions')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteActivityLogs(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteDailyPlanItems(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('item_id', taskId);
  if (error) throw error;
}

export async function deleteTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function queryDailyQuests(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<RawTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'DAILY_QUEST')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  updates: Record<string, unknown>
): Promise<RawTask> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
