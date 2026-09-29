// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getHfgWeeklyStatus } from '../actions';

beforeEach(() => vi.clearAllMocks());

describe('getHfgWeeklyStatus', () => {
  it('user belum login → ringkasan kosong, rpc tidak dipanggil', async () => {
    const supabase = makeSupabase({ user: null });
    vi.mocked(createClient).mockResolvedValue(supabase);
    expect(await getHfgWeeklyStatus()).toEqual({ weekLabel: null, cards: [] });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('memanggil rpc hfg_weekly_status dengan p_user_id saja (tanggal dihitung SQL)', async () => {
    const supabase = makeSupabase({ user: { id: 'u1' } });
    supabase.rpc.mockResolvedValue({
      data: [{
        quest_id: 'q1', title: 'GM', urut: 1, weekly_target_hours: 10, actual_minutes: 390,
        expected_minutes: 257, status: 'ON_TRACK', week_start: '2026-09-28', week_end: '2026-10-04',
        year: 2026, quarter: 4, week_in_quarter: 1,
      }],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const result = await getHfgWeeklyStatus();

    expect(supabase.rpc).toHaveBeenCalledWith('hfg_weekly_status', { p_user_id: 'u1' });
    expect(result.weekLabel).toBe('W1 Q4 2026');
    expect(result.cards[0]).toMatchObject({ actualLabel: '6.5h', targetLabel: '10h', status: 'ON_TRACK' });
  });

  it('melempar error rpc supaya SWR menandai error', async () => {
    const supabase = makeSupabase({ user: { id: 'u1' } });
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    vi.mocked(createClient).mockResolvedValue(supabase);
    await expect(getHfgWeeklyStatus()).rejects.toMatchObject({ message: 'function does not exist' });
  });
});
