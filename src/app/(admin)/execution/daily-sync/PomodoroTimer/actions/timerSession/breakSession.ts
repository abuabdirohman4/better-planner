"use server";

// Break sessions are persisted so the push cron can notify when a break ends
// while the app is closed. Kept separate from saveTimerSession: breaks have no
// task_id and must not disturb the FOCUSING resume/cleanup logic.

import { createClient } from '@/lib/supabase/server';
import { getDeviceId } from './deviceUtils';

const BREAK_TYPE_MAP = {
  SHORT: 'SHORT_BREAK',
  MEDIUM: 'MEDIUM_BREAK',
  LONG: 'LONG_BREAK',
} as const;

// task_title is NOT NULL in timer_sessions, and a break has no task
const BREAK_LABEL = {
  SHORT: 'Istirahat pendek',
  MEDIUM: 'Istirahat sedang',
  LONG: 'Istirahat panjang',
} as const;

export type BreakType = keyof typeof BREAK_TYPE_MAP;

/**
 * Record a running break. Closes any earlier break first so at most one is open.
 * Returns the row id, or null when the write fails — the break must still run
 * locally even if persistence is unavailable.
 */
export async function startBreakSession(
  type: BreakType,
  durationSeconds: number,
  startTime: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    await closeOpenBreaks(supabase, user.id);

    const { data, error } = await supabase
      .from('timer_sessions')
      .insert({
        user_id: user.id,
        task_id: null,
        task_title: BREAK_LABEL[type],
        session_type: BREAK_TYPE_MAP[type],
        start_time: startTime,
        target_duration_seconds: durationSeconds,
        current_duration_seconds: 0,
        status: 'RUNNING',
        device_id: getDeviceId(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[startBreakSession] Error:', error.message);
      return null;
    }
    return data.id;
  } catch (error) {
    console.error('[startBreakSession] Exception:', error);
    return null;
  }
}

/** Mark the user's running break as finished (break ended, skipped, or focus restarted). */
export async function endBreakSession(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await closeOpenBreaks(supabase, user.id);
  } catch (error) {
    console.error('[endBreakSession] Exception:', error);
  }
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function closeOpenBreaks(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from('timer_sessions')
    .update({ status: 'COMPLETED', end_time: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'RUNNING')
    .in('session_type', Object.values(BREAK_TYPE_MAP));

  if (error) console.error('[closeOpenBreaks] Error:', error.message);
}
