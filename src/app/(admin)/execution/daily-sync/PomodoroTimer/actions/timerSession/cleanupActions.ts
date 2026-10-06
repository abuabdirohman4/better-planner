"use server";

// Cleanup actions for timer sessions

import { createClient } from '@/lib/supabase/server';

// Close abandoned BREAK rows. FOCUSING rows are never closed here: overdue ones are finished
// (with an activity log) by the push-due cron, so closing them silently would lose the session.
export async function cleanupAbandonedSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Breaks last 15 min at most; anything still RUNNING after an hour was abandoned
    const { error: breakError } = await supabase
      .from('timer_sessions')
      .update({ status: 'COMPLETED' })
      .eq('user_id', user.id)
      .eq('status', 'RUNNING')
      .lt('start_time', oneHourAgo);

    if (breakError) {
      console.error('[cleanupAbandonedSessions] Break error:', breakError);
    }
  } catch (error) {
    console.error('[cleanupAbandonedSessions] Exception:', error);
  }
}

/**
 * Tandai sesi fokus yang ditinggalkan (stop di detik 0 / reset) sebagai selesai TANPA log,
 * supaya penyelesai di server (push-due) tidak mencatatnya sebagai sesi penuh.
 */
export async function abandonTimerSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !sessionId) return;

  const { error } = await supabase
    .from('timer_sessions')
    .update({ status: 'COMPLETED', end_time: new Date().toISOString(), current_duration_seconds: 0 })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .in('status', ['FOCUSING', 'PAUSED']);

  if (error) console.error('[abandonTimerSession] Error:', error);
}
