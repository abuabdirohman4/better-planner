"use server";

// Break sessions are persisted so the push cron can notify when a break ends
// while the app is closed. Kept separate from saveTimerSession: breaks have no
// task_id and must not disturb the FOCUSING resume/cleanup logic.

import { createClient } from '@/lib/supabase/server';
import { getDeviceId } from './deviceUtils';
import { getLocalDateString } from '@/lib/dateUtils';

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

/**
 * Tutup break yang masih RUNNING lalu catat sebagai activity log BREAK (app-mgsb, 6 Okt 2026), supaya
 * terlihat kapan break dipakai. Update-lalu-catat: baris yang sudah ditutup perangkat lain tidak tercatat dua kali.
 */
async function closeOpenBreaks(supabase: SupabaseClient, userId: string) {
  const now = new Date();
  const { data: closed, error } = await supabase
    .from('timer_sessions')
    .update({ status: 'COMPLETED', end_time: now.toISOString() })
    .eq('user_id', userId)
    .eq('status', 'RUNNING')
    .in('session_type', Object.values(BREAK_TYPE_MAP))
    .select('id, start_time, target_duration_seconds');

  if (error) {
    console.error('[closeOpenBreaks] Error:', error.message);
    return;
  }

  const logs = (closed ?? [])
    .map((b) => {
      const startMs = new Date(b.start_time).getTime();
      const seconds = Math.min(Math.max(0, (now.getTime() - startMs) / 1000), b.target_duration_seconds);
      return { b, seconds, end: new Date(startMs + seconds * 1000) };
    })
    .filter(({ seconds }) => seconds >= 30) // break yang langsung ditimpa perangkat lain tidak dicatat
    .map(({ b, seconds, end }) => ({
      user_id: userId,
      task_id: null,
      type: 'BREAK',
      start_time: b.start_time,
      end_time: end.toISOString(),
      duration_minutes: Math.max(1, Math.round(seconds / 60)),
      local_date: getLocalDateString(end),
    }));
  if (!logs.length) return;
  const { error: logError } = await supabase.from('activity_logs').insert(logs);
  if (logError && logError.code !== '23505') console.error('[closeOpenBreaks] log error:', logError.message);
}
