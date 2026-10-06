import { describe, it, expect } from 'vitest';
import {
  shouldDailyReset,
  pickSessionToComplete,
  pickRecoverableSession,
  selectDueSessions,
  buildDueFocusLog,
  planServerClosures,
  computeCompletionDuration,
  isOwnSessionCompletion,
  shouldAdoptFocusingEcho,
} from '@/lib/timerSessionLogic';

const T0 = '2026-10-06T03:00:00.000Z';
const ms = (iso: string, plusSec = 0) => new Date(new Date(iso).getTime() + plusSec * 1000);

describe('shouldDailyReset', () => {
  it('tidak reset bila hari sama', () => {
    expect(shouldDailyReset('2026-10-06', '2026-10-06', 'IDLE')).toBe(false);
  });
  it('reset bila hari WIB berganti dan timer IDLE', () => {
    expect(shouldDailyReset('2026-10-05', '2026-10-06', 'IDLE')).toBe(true);
  });
  it('TIDAK reset saat FOCUSING / PAUSED / BREAK walau hari berganti', () => {
    for (const s of ['FOCUSING', 'PAUSED', 'BREAK'] as const) {
      expect(shouldDailyReset('2026-10-05', '2026-10-06', s)).toBe(false);
    }
  });
  it('tidak reset bila belum pernah tercatat', () => {
    expect(shouldDailyReset(null, '2026-10-06', 'IDLE')).toBe(false);
  });
});

describe('pickSessionToComplete', () => {
  const rows = [
    { id: 'other', task_id: 'B', start_time: T0 },
    { id: 'a-old', task_id: 'A', start_time: ms(T0, -3600).toISOString() },
    { id: 'a-now', task_id: 'A', start_time: ms(T0, 30).toISOString() },
  ];
  it('pakai sessionId bila ada di daftar', () => {
    expect(pickSessionToComplete(rows, 'A', T0, 'other')?.id).toBe('other');
  });
  it('tanpa sessionId: task sama + start dalam 120 dtk', () => {
    expect(pickSessionToComplete(rows, 'A', T0)?.id).toBe('a-now');
  });
  it('tidak pernah mengembalikan baris task lain', () => {
    expect(pickSessionToComplete(rows, 'C', T0)).toBeNull();
  });
  it('start terlalu jauh (>120 dtk) -> null', () => {
    expect(pickSessionToComplete(rows, 'A', ms(T0, 600).toISOString())).toBeNull();
  });
});

describe('pickRecoverableSession', () => {
  const now = ms(T0, 600).getTime();
  const mk = (id: string, task: string, startOffset: number, target = 1500) => ({
    id, task_id: task, start_time: ms(T0, startOffset).toISOString(), target_duration_seconds: target,
  });
  it('store punya sessionId -> baris itu', () => {
    const rows = [mk('x', 'A', 0), mk('y', 'B', 10)];
    expect(pickRecoverableSession(rows, { sessionId: 'x', taskId: 'A' }, now)?.id).toBe('x');
  });
  it('store aktif tanpa sessionId -> hanya baris task yang aktif', () => {
    const rows = [mk('y', 'B', 10), mk('x', 'A', 0)];
    expect(pickRecoverableSession(rows, { taskId: 'A' }, now)?.id).toBe('x');
    expect(pickRecoverableSession(rows, { taskId: 'Z' }, now)).toBeNull();
  });
  it('store IDLE -> FOCUSING terbaru yang belum jatuh tempo', () => {
    const rows = [mk('late', 'A', 0), mk('over', 'B', -5000)];
    expect(pickRecoverableSession(rows, {}, now)?.id).toBe('late');
  });
  it('store IDLE dan semua jatuh tempo -> null (server yang menutup)', () => {
    expect(pickRecoverableSession([mk('over', 'B', -5000)], {}, now)).toBeNull();
  });
});

describe('selectDueSessions', () => {
  const row = (id: string, startOffset: number, target: number, over: object = {}) => ({
    id, user_id: 'u', task_id: 't', status: 'FOCUSING', session_type: 'FOCUS',
    start_time: ms(T0, startOffset).toISOString(), target_duration_seconds: target, ...over,
  });
  it('sesi 25 mnt terpilih setelah target + 30 dtk', () => {
    expect(selectDueSessions([row('a', 0, 1500)], ms(T0, 1531))).toHaveLength(1);
  });
  it('belum jatuh tempo / masih dalam toleransi 30 dtk -> tidak', () => {
    expect(selectDueSessions([row('a', 0, 1500)], ms(T0, 1400))).toHaveLength(0);
    expect(selectDueSessions([row('a', 0, 1500)], ms(T0, 1520))).toHaveLength(0);
  });
  it('sesi 90 menit tetap terpilih setelah 90 menit (tanpa batas 1 jam)', () => {
    expect(selectDueSessions([row('a', 0, 5400)], ms(T0, 5431))).toHaveLength(1);
    expect(selectDueSessions([row('a', 0, 5400)], ms(T0, 3000))).toHaveLength(0);
  });
  it('abaikan break / tanpa task / bukan FOCUSING', () => {
    const rows = [
      row('b', 0, 300, { session_type: 'SHORT_BREAK', task_id: null, status: 'RUNNING' }),
      row('c', 0, 300, { task_id: null }),
      row('d', 0, 300, { status: 'COMPLETED' }),
    ];
    expect(selectDueSessions(rows, ms(T0, 9999))).toHaveLength(0);
  });
});

describe('buildDueFocusLog', () => {
  it('end = start + target, durasi menit, local_date WIB dari end_time', () => {
    // 16:50 UTC + 25 mnt = 17:15 UTC = 00:15 WIB hari berikutnya
    const log = buildDueFocusLog({
      user_id: 'u', task_id: 't', session_type: 'FOCUS',
      start_time: '2026-10-06T16:50:00.000Z', target_duration_seconds: 1500,
    });
    expect(log).toEqual({
      user_id: 'u', task_id: 't', type: 'FOCUS',
      start_time: '2026-10-06T16:50:00.000Z',
      end_time: '2026-10-06T17:15:00.000Z',
      duration_minutes: 25,
      local_date: '2026-10-07',
    });
  });
});

describe('planServerClosures', () => {
  const NOW = new Date('2026-10-06T12:00:00Z');
  const base = { user_id: 'u', task_id: 't', session_type: 'FOCUS', target_duration_seconds: 1500, current_duration_seconds: 0 };
  const ago = (min: number) => new Date(NOW.getTime() - min * 60000).toISOString();

  it('FOCUSING jatuh tempo -> log penuh', () => {
    const [a] = planServerClosures([{ ...base, id: 'a', status: 'FOCUSING', start_time: ago(40), updated_at: ago(40) }], NOW);
    expect(a).toMatchObject({ id: 'a', log: { duration_minutes: 25 } });
  });
  it('FOCUSING lebih tua dari 24 jam -> tutup tanpa log', () => {
    const [a] = planServerClosures([{ ...base, id: 'a', status: 'FOCUSING', start_time: ago(25 * 60), updated_at: ago(25 * 60) }], NOW);
    expect(a).toEqual({ id: 'a', log: null, durationSeconds: 0 });
  });
  it('PAUSED idle > 6 jam dengan >= 60 dtk -> log dari durasi tersimpan', () => {
    const [a] = planServerClosures([{ ...base, id: 'p', status: 'PAUSED', start_time: ago(500), updated_at: ago(400), current_duration_seconds: 600 }], NOW);
    expect(a.log).toMatchObject({ duration_minutes: 10 });
    expect(new Date(a.log!.end_time).getTime() - new Date(a.log!.start_time).getTime()).toBe(600_000);
  });
  it('PAUSED idle > 6 jam < 60 dtk -> tutup tanpa log', () => {
    const [a] = planServerClosures([{ ...base, id: 'p', status: 'PAUSED', start_time: ago(500), updated_at: ago(400), current_duration_seconds: 30 }], NOW);
    expect(a.log).toBeNull();
  });
  it('PAUSED baru (< 6 jam) dan FOCUSING belum jatuh tempo -> tidak disentuh', () => {
    expect(planServerClosures([
      { ...base, id: 'p', status: 'PAUSED', start_time: ago(100), updated_at: ago(60), current_duration_seconds: 600 },
      { ...base, id: 'f', status: 'FOCUSING', start_time: ago(5), updated_at: ago(1) },
    ], NOW)).toHaveLength(0);
  });
});

describe('computeCompletionDuration', () => {
  const nowMs = new Date('2026-10-06T06:00:00Z').getTime();
  const start = '2026-10-06T04:00:00Z'; // 2 jam lalu
  it('pakai durasi klien (dibatasi target) bukan wall-clock', () => {
    expect(computeCompletionDuration({ status: 'FOCUSING', startTime: start, target: 1500, currentDuration: 0, clientDuration: 600, nowMs })).toBe(600);
    expect(computeCompletionDuration({ status: 'FOCUSING', startTime: start, target: 1500, currentDuration: 0, clientDuration: 9000, nowMs })).toBe(1500);
  });
  it('PAUSED tanpa durasi klien -> current_duration_seconds', () => {
    expect(computeCompletionDuration({ status: 'PAUSED', startTime: start, target: 1500, currentDuration: 420, nowMs })).toBe(420);
  });
  it('FOCUSING tanpa durasi klien -> wall-clock dibatasi target', () => {
    expect(computeCompletionDuration({ status: 'FOCUSING', startTime: start, target: 1500, currentDuration: 0, nowMs })).toBe(1500);
  });
});

describe('isOwnSessionCompletion', () => {
  it('hanya sesi milik store dan bukan abandon (durasi 0)', () => {
    expect(isOwnSessionCompletion({ id: 'x', current_duration_seconds: 900 }, 'x')).toBe(true);
    expect(isOwnSessionCompletion({ id: 'y', current_duration_seconds: 900 }, 'x')).toBe(false);
    expect(isOwnSessionCompletion({ id: 'x', current_duration_seconds: 0 }, 'x')).toBe(false);
    expect(isOwnSessionCompletion({ id: 'x', current_duration_seconds: 900 }, null)).toBe(false);
  });
});

describe('shouldAdoptFocusingEcho', () => {
  const row = { id: 'x', task_id: 't' };
  it('hanya baris milik store, dan tidak saat PAUSED', () => {
    expect(shouldAdoptFocusingEcho(row, { sessionId: 'x', timerState: 'FOCUSING', taskId: 't' })).toBe(true);
    expect(shouldAdoptFocusingEcho(row, { sessionId: 'x', timerState: 'PAUSED', taskId: 't' })).toBe(false);
    expect(shouldAdoptFocusingEcho(row, { sessionId: 'y', timerState: 'FOCUSING', taskId: 't' })).toBe(false);
  });
  it('store aktif tapi id belum kembali -> jangan adopsi baris lain', () => {
    expect(shouldAdoptFocusingEcho(row, { sessionId: null, timerState: 'FOCUSING', taskId: 't' })).toBe(false);
  });
});
