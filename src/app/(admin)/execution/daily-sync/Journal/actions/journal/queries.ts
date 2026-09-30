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
  energy?: number | null,
) {
  const { data, error } = await supabase
    .from('activity_logs')
    .update({
      // Teks kosong (null) tidak menimpa jurnal lama; hanya energi yang diperbarui.
      ...(whatDone !== null && { what_done: whatDone }),
      ...(whatThink !== null && { what_think: whatThink }),
      ...(energy !== undefined && { energy }),
    })
    .eq('id', activityId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
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
