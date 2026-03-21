// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { updateTask, deleteTask, updateTaskStatus, scheduleTask, updateTasksDisplayOrder } from '../actions';

describe('updateTask', () => {
  it('returns success message on update', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateTask('t1', 'New Title');
    expect(result.message).toContain('berhasil');
  });

  it('throws on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(updateTask('t1', 'T')).rejects.toThrow('Gagal update task');
  });
});

describe('deleteTask', () => {
  it('returns success message on delete', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await deleteTask('t1');
    expect(result.message).toContain('berhasil');
  });

  it('throws on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(deleteTask('t1')).rejects.toThrow('Gagal hapus task');
  });
});

describe('updateTaskStatus', () => {
  it('returns success message', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateTaskStatus('t1', 'DONE');
    expect(result.message).toContain('berhasil');
  });
});

describe('scheduleTask', () => {
  it('returns success on valid date', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await scheduleTask('t1', '2026-03-20');
    expect(result.success).toBe(true);
  });

  it('returns failure on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'schedule fail' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await scheduleTask('t1', null);
    expect(result.success).toBe(false);
  });
});

describe('updateTasksDisplayOrder', () => {
  it('returns success message', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateTasksDisplayOrder([{ id: 't1', display_order: 1 }]);
    expect(result.success).toBe(true);
  });
});
