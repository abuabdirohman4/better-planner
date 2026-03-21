import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryActivityLogById(
  supabase: SupabaseClient,
  userId: string,
  activityId: string,
) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, what_done, what_think, created_at')
    .eq('id', activityId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateActivityLogJournal(
  supabase: SupabaseClient,
  userId: string,
  activityId: string,
  whatDone: string | null,
  whatThink: string | null,
) {
  const { data, error } = await supabase
    .from('activity_logs')
    .update({ what_done: whatDone, what_think: whatThink })
    .eq('id', activityId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function checkDuplicateLog(
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

export async function insertActivityLogWithJournal(
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
