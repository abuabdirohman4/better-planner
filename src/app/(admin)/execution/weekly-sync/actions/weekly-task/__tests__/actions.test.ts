// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getTaskTitles, updateWeeklyTaskStatus } from '../actions';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('getTaskTitles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns {} when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    const result = await getTaskTitles(['task-1']);
    expect(result).toEqual({});
  });

  it('returns {} for empty taskIds', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase());
    const result = await getTaskTitles([]);
    expect(result).toEqual({});
  });

  it('returns title map on success', async () => {
    const b = makeQueryBuilder({ data: [{ id: 'task-1', title: 'Task One' }], error: null });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await getTaskTitles(['task-1']);
    expect(result).toEqual({ 'task-1': 'Task One' });
  });

  it('returns {} on DB error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const b = makeQueryBuilder({ data: null, error: { message: 'fail' } });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await getTaskTitles(['task-1']);
    expect(result).toEqual({});
    consoleSpy.mockRestore();
  });
});

describe('updateWeeklyTaskStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    await expect(updateWeeklyTaskStatus('task-1', 1, 'DONE')).rejects.toThrow('User not authenticated');
  });

  it('returns RPC data on success', async () => {
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: 'rpc-result', error: null });
    // from() for updateWeeklyGoalItemsStatus
    const b = makeQueryBuilder({ data: null, error: null });
    supabase.from = vi.fn().mockReturnValue(b);
    mockCreateClient.mockResolvedValue(supabase);
    const result = await updateWeeklyTaskStatus('task-1', 1, 'DONE', '2026-03-20');
    expect(result).toBe('rpc-result');
  });

  it('throws and re-throws on RPC error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'rpc error' },
    });
    mockCreateClient.mockResolvedValue(supabase);
    await expect(updateWeeklyTaskStatus('task-1', 1, 'DONE')).rejects.toMatchObject({
      message: 'rpc error',
    });
    consoleSpy.mockRestore();
  });
});
