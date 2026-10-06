import type { SupabaseClient } from '@supabase/supabase-js';
import { planServerClosures, type ClosableSessionRow } from '@/lib/timerSessionLogic';
import { findRecentActivityLog } from '@/app/(admin)/execution/daily-sync/ActivityLog/actions/activity-logging/dedup';

/**
 * Safety net for focus sessions (and PAUSED ones left hanging) whose client never reported completion (app closed, phone
 * asleep, crash): write the FOCUS activity log (deduped against any client-written one) and
 * close the row. Needs a service-role client (cron has no user session).
 */
export async function completeDueFocusSessions(supabase: SupabaseClient, now = new Date()): Promise<number> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('id, user_id, task_id, status, session_type, start_time, target_duration_seconds, updated_at, current_duration_seconds')
    .in('status', ['FOCUSING', 'PAUSED'])
    .not('task_id', 'is', null);
  if (error) throw error;

  const byId = new Map(((data ?? []) as ClosableSessionRow[]).map(r => [r.id, r]));
  let completed = 0;
  for (const c of planServerClosures((data ?? []) as ClosableSessionRow[], now)) {
    const s = byId.get(c.id)!;
    let endTime = now.toISOString();
    if (c.log) {
      endTime = c.log.end_time;
      const existing = await findRecentActivityLog(supabase, s.user_id, s.task_id!, s.session_type, s.start_time);
      if (!existing) {
        const { error: logError } = await supabase.from('activity_logs').insert(c.log);
        // 23505 = a client path inserted the same log meanwhile; 23503 = task deleted -> close without log
        if (logError && logError.code !== '23505' && logError.code !== '23503') {
          console.error('[completeDueFocusSessions] log insert failed', s.id, logError.message);
          continue; // leave open so the next tick retries
        }
      }
    }
    const { error: updError } = await supabase
      .from('timer_sessions')
      .update({
        status: 'COMPLETED',
        end_time: endTime,
        current_duration_seconds: c.durationSeconds,
        updated_at: now.toISOString(),
      })
      .eq('id', s.id)
      .in('status', ['FOCUSING', 'PAUSED']);
    if (updError) console.error('[completeDueFocusSessions] close failed', s.id, updError.message);
    else completed++;
  }
  return completed;
}
