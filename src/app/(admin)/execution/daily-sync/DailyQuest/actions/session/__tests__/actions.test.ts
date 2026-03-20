// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../queries', () => ({
  queryDailyPlanItem: vi.fn(),
  countFocusSessions: vi.fn(),
}));
vi.mock('../logic', () => ({
  validateItemId: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { queryDailyPlanItem, countFocusSessions } from '../queries';
import { validateItemId } from '../logic';
import { countCompletedSessions } from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }));
}

beforeEach(() => vi.clearAllMocks());

describe('countCompletedSessions', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(countCompletedSessions('dpi-1', '2026-03-20')).rejects.toThrow(
      'not authenticated'
    );
  });

  it('throws when queryDailyPlanItem fails', async () => {
    mockCreateClient();
    vi.mocked(queryDailyPlanItem).mockRejectedValue(new Error('not found'));
    await expect(countCompletedSessions('dpi-1', '2026-03-20')).rejects.toThrow('not found');
  });

  it('throws when validateItemId throws (item_id missing)', async () => {
    mockCreateClient();
    vi.mocked(queryDailyPlanItem).mockResolvedValue({ item_id: '' });
    vi.mocked(validateItemId).mockImplementation(() => {
      throw new Error('Item ID not found');
    });
    await expect(countCompletedSessions('dpi-1', '2026-03-20')).rejects.toThrow(
      'Item ID not found'
    );
  });

  it('returns count on success', async () => {
    mockCreateClient();
    vi.mocked(queryDailyPlanItem).mockResolvedValue({ item_id: 'task-1' });
    vi.mocked(validateItemId).mockReturnValue('task-1');
    vi.mocked(countFocusSessions).mockResolvedValue(4);

    const result = await countCompletedSessions('dpi-1', '2026-03-20');

    expect(queryDailyPlanItem).toHaveBeenCalledWith(expect.anything(), 'dpi-1');
    expect(validateItemId).toHaveBeenCalledWith({ item_id: 'task-1' });
    expect(countFocusSessions).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'task-1',
      '2026-03-20'
    );
    expect(result).toBe(4);
  });

  it('returns 0 when no sessions found', async () => {
    mockCreateClient();
    vi.mocked(queryDailyPlanItem).mockResolvedValue({ item_id: 'task-1' });
    vi.mocked(validateItemId).mockReturnValue('task-1');
    vi.mocked(countFocusSessions).mockResolvedValue(0);

    const result = await countCompletedSessions('dpi-1', '2026-03-20');

    expect(result).toBe(0);
  });
});
