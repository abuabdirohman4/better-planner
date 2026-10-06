import { getLocalDateString } from '@/lib/dateUtils';

type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK';

const MATCH_WINDOW_MS = 120_000;
export const DUE_TOLERANCE_MS = 30_000;

/** Hari (WIB) berganti -> reset, tapi jangan pernah membunuh timer yang sedang berjalan. */
export function shouldDailyReset(lastDay: string | null, todayWIB: string, timerState: TimerState): boolean {
  return !!lastDay && lastDay !== todayWIB && timerState === 'IDLE';
}

interface SessionRow { id: string; task_id: string | null; start_time: string }

/** Baris sesi yang harus diselesaikan klien: by sessionId, atau task sama + start ±120 dtk. Tidak pernah task lain. */
export function pickSessionToComplete<T extends SessionRow>(
  rows: T[], taskId: string, startTime: string, sessionId?: string | null,
): T | null {
  if (sessionId) {
    const hit = rows.find(r => r.id === sessionId);
    if (hit) return hit;
  }
  const startMs = new Date(startTime).getTime();
  let best: T | null = null;
  let bestDiff = Infinity;
  for (const r of rows) {
    if (r.task_id !== taskId) continue;
    const diff = Math.abs(new Date(r.start_time).getTime() - startMs);
    if (diff <= MATCH_WINDOW_MS && diff < bestDiff) { best = r; bestDiff = diff; }
  }
  return best;
}

/**
 * Sesi yang dipulihkan saat app dibuka. Store aktif -> hanya sesi miliknya.
 * Store IDLE -> FOCUSING terbaru yang belum jatuh tempo (resume lintas-device);
 * yang sudah jatuh tempo diserahkan ke server.
 */
export function pickRecoverableSession<T extends SessionRow & { target_duration_seconds: number }>(
  rows: T[], store: { sessionId?: string | null; taskId?: string | null }, nowMs: number,
): T | null {
  const newestFirst = [...rows].sort((a, b) => b.start_time.localeCompare(a.start_time));
  if (store.sessionId) {
    const hit = newestFirst.find(r => r.id === store.sessionId);
    if (hit) return hit;
  }
  if (store.taskId) return newestFirst.find(r => r.task_id === store.taskId) ?? null;
  return newestFirst.find(r => new Date(r.start_time).getTime() + r.target_duration_seconds * 1000 > nowMs) ?? null;
}

export interface DueSessionRow {
  id: string; user_id: string; task_id: string | null; status: string;
  session_type: string; start_time: string; target_duration_seconds: number;
}

/** Sesi FOCUSING yang start + target + toleransi sudah lewat (berapa pun lamanya, 60/90 menit ikut). */
export function selectDueSessions<T extends DueSessionRow>(rows: T[], now: Date): T[] {
  return rows.filter(r =>
    r.status === 'FOCUSING' && !!r.task_id &&
    new Date(r.start_time).getTime() + r.target_duration_seconds * 1000 + DUE_TOLERANCE_MS <= now.getTime());
}

export function buildDueFocusLog(
  s: Pick<DueSessionRow, 'user_id' | 'task_id' | 'session_type' | 'start_time' | 'target_duration_seconds'>,
  durationSeconds: number = s.target_duration_seconds,
) {
  const end = new Date(new Date(s.start_time).getTime() + durationSeconds * 1000);
  return {
    user_id: s.user_id,
    task_id: s.task_id,
    type: s.session_type,
    start_time: s.start_time,
    end_time: end.toISOString(),
    duration_minutes: Math.max(1, Math.round(durationSeconds / 60)),
    local_date: getLocalDateString(end),
  };
}

const MAX_FOCUS_AGE_MS = 24 * 3600_000;
const PAUSED_IDLE_MS = 6 * 3600_000;
const MIN_LOG_SECONDS = 60;

export interface ClosableSessionRow extends DueSessionRow { updated_at: string; current_duration_seconds: number }
export interface ServerClosure { id: string; log: ReturnType<typeof buildDueFocusLog> | null; durationSeconds: number }

/**
 * What the server cron must close. FOCUSING past due -> full-target log (older than 24h -> close, no log).
 * PAUSED idle > 6h -> log from the saved duration if >= 60s, else close without log.
 */
export function planServerClosures(rows: ClosableSessionRow[], now: Date): ServerClosure[] {
  const out: ServerClosure[] = [];
  for (const r of rows) {
    if (!r.task_id) continue;
    const startMs = new Date(r.start_time).getTime();
    if (r.status === 'FOCUSING' && selectDueSessions([r], now).length) {
      if (startMs < now.getTime() - MAX_FOCUS_AGE_MS) out.push({ id: r.id, log: null, durationSeconds: 0 });
      else out.push({ id: r.id, log: buildDueFocusLog(r), durationSeconds: r.target_duration_seconds });
    } else if (r.status === 'PAUSED' && new Date(r.updated_at).getTime() < now.getTime() - PAUSED_IDLE_MS) {
      const dur = Math.min(r.current_duration_seconds ?? 0, r.target_duration_seconds);
      out.push(dur >= MIN_LOG_SECONDS
        ? { id: r.id, log: buildDueFocusLog(r, dur), durationSeconds: dur }
        : { id: r.id, log: null, durationSeconds: dur });
    }
  }
  return out;
}

/** Seconds to record on completion: client's own count (capped) wins; PAUSED rows use the saved duration; else wall-clock. */
export function computeCompletionDuration(a: {
  status: string; startTime: string; target: number; currentDuration: number; clientDuration?: number | null; nowMs: number;
}): number {
  const raw = a.clientDuration != null ? a.clientDuration
    : a.status === 'PAUSED' ? a.currentDuration
    : Math.floor((a.nowMs - new Date(a.startTime).getTime()) / 1000);
  return Math.max(0, Math.min(Math.round(raw), a.target));
}

/** Realtime: react only to completion of THIS device's session, ignoring abandon (duration 0). */
export function isOwnSessionCompletion(session: { id: string; current_duration_seconds: number }, storeSessionId: string | null): boolean {
  return !!storeSessionId && session.id === storeSessionId && session.current_duration_seconds !== 0;
}

/** Realtime FOCUSING echo: adopt only this device's own row, never while locally PAUSED or before our id is known. */
export function shouldAdoptFocusingEcho(
  session: { id: string; task_id: string | null },
  store: { sessionId: string | null; timerState: string; taskId?: string | null },
): boolean {
  return store.timerState !== 'PAUSED' && !!store.sessionId && session.id === store.sessionId;
}
