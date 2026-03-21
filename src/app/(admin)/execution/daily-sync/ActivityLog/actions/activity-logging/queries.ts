import type { SupabaseClient } from '@supabase/supabase-js';

export async function checkDuplicateActivityLog(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  startTime: string,
  endTime: string,
) {
  const { data } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .single();
  return data;
}

export async function insertActivityLog(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    task_id: string;
    type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
    start_time: string;
    end_time: string;
    duration_minutes: number;
    local_date: string;
    what_done: string | null;
    what_think: string | null;
  },
) {
  const { data: activity, error } = await supabase
    .from('activity_logs')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return activity;
}

export async function queryActivityLogs(
  supabase: SupabaseClient,
  userId: string,
  date: string,
) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('local_date', date)
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function queryTasksByIds(
  supabase: SupabaseClient,
  taskIds: string[],
) {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, type, milestone_id')
    .in('id', taskIds);
  if (error) throw error;
  return data ?? [];
}

export async function queryMilestonesByIds(
  supabase: SupabaseClient,
  milestoneIds: string[],
) {
  if (milestoneIds.length === 0) return [];
  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, quest_id')
    .in('id', milestoneIds);
  if (error) throw error;
  return data ?? [];
}

export async function queryQuestsByIds(
  supabase: SupabaseClient,
  questIds: string[],
) {
  if (questIds.length === 0) return [];
  const { data, error } = await supabase
    .from('quests')
    .select('id, title')
    .in('id', questIds);
  if (error) throw error;
  return data ?? [];
}
