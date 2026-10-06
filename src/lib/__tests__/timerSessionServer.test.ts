import { describe, it, expect, vi } from 'vitest';

const findRecent = vi.fn();
vi.mock('@/app/(admin)/execution/daily-sync/ActivityLog/actions/activity-logging/dedup', () => ({
  findRecentActivityLog: (...a: unknown[]) => findRecent(...a),
}));
import { completeDueFocusSessions } from '@/lib/timerSessionServer';

const NOW = new Date('2026-10-06T06:00:00Z');
const due = { id: 's1', updated_at: '2026-10-06T04:00:00Z', current_duration_seconds: 0, user_id: 'u', task_id: 't', status: 'FOCUSING', session_type: 'FOCUS',
  start_time: '2026-10-06T04:00:00Z', target_duration_seconds: 5400 }; // 90 mnt, jatuh tempo 05:30

function fakeSupabase(rows: unknown[], insertError: { code: string; message: string } | null = null) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const client = {
    from: (table: string) => ({
      select: () => ({ in: () => ({ not: async () => ({ data: rows, error: null }) }) }),
      insert: async (v: unknown) => { inserts.push({ table, v }); return { error: insertError }; },
      update: (v: unknown) => ({ eq: () => ({ in: async () => { updates.push({ table, v }); return { error: null }; } }) }),
    }),
  };
  return { client: client as never, inserts, updates };
}

describe('completeDueFocusSessions', () => {
  it('menulis log + menutup sesi 90 menit yang jatuh tempo', async () => {
    findRecent.mockResolvedValue(null);
    const { client, inserts, updates } = fakeSupabase([due]);
    expect(await completeDueFocusSessions(client, NOW)).toBe(1);
    expect(inserts[0]).toMatchObject({ table: 'activity_logs', v: { duration_minutes: 90, local_date: '2026-10-06', end_time: '2026-10-06T05:30:00.000Z' } });
    expect(updates[0]).toMatchObject({ table: 'timer_sessions', v: { status: 'COMPLETED' } });
  });

  it('catatan siklus di baris sesi ikut jadi what_done log (app-mgsb)', async () => {
    findRecent.mockResolvedValue(null);
    const { client, inserts } = fakeSupabase([{ ...due, notes: '09:10 riset' }]);
    await completeDueFocusSessions(client, NOW);
    expect(inserts[0]).toMatchObject({ v: { what_done: '09:10 riset' } });
  });

  it('log sudah ditulis klien -> tidak membuat log ganda, sesi tetap ditutup', async () => {
    findRecent.mockResolvedValue({ id: 'existing' });
    const { client, inserts, updates } = fakeSupabase([due]);
    expect(await completeDueFocusSessions(client, NOW)).toBe(1);
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
  });

  it('belum jatuh tempo -> tidak disentuh', async () => {
    const { client, inserts, updates } = fakeSupabase([{ ...due, start_time: '2026-10-06T05:00:00Z' }]);
    expect(await completeDueFocusSessions(client, NOW)).toBe(0);
    expect(inserts.length + updates.length).toBe(0);
  });
});

describe('kasus tepi server', () => {
  it('FK ditolak (23503, task terhapus) -> tutup tanpa log, tidak retry selamanya', async () => {
    findRecent.mockResolvedValue(null);
    const { client, updates } = fakeSupabase([due], { code: '23503', message: 'fk' });
    expect(await completeDueFocusSessions(client, NOW)).toBe(1);
    expect(updates[0]).toMatchObject({ v: { status: 'COMPLETED' } });
  });

  it('PAUSED menggantung > 6 jam dibuat log dari durasi tersimpan', async () => {
    findRecent.mockResolvedValue(null);
    const paused = { ...due, id: 'p1', status: 'PAUSED', current_duration_seconds: 600, updated_at: '2026-10-05T23:00:00Z' };
    const { client, inserts } = fakeSupabase([paused]);
    expect(await completeDueFocusSessions(client, NOW)).toBe(1);
    expect(inserts[0]).toMatchObject({ v: { duration_minutes: 10, end_time: '2026-10-06T04:10:00.000Z' } });
  });
});
