import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Find an existing FOCUS/BREAK activity log for the same task within a ±window of start_time.
 * Timer completion can race across 3 paths (interval, tab-visible sync, background timeout),
 * each inserting with a start_time that differs by sub-seconds — the exact-match unique
 * constraint (user_id, task_id, start_time) lets those slip through as duplicates.
 * A time-window check catches them.
 */
export async function findRecentActivityLog(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  type: string,
  startTime: string,
  windowSeconds = 60,
) {
  const startMs = new Date(startTime).getTime();
  const lo = new Date(startMs - windowSeconds * 1000).toISOString();
  const hi = new Date(startMs + windowSeconds * 1000).toISOString();

  const { data } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('type', type)
    .gte('start_time', lo)
    .lte('start_time', hi)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
