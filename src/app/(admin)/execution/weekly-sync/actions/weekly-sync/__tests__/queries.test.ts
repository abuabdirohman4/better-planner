// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeSupabase } from '@/test-utils/supabase-mock';
import { rpcGetWeeklySync } from '../queries';

describe('rpcGetWeeklySync', () => {
  it('calls rpc with correct params and returns data', async () => {
    const mockData = { goals: [{ id: 'g1' }], rules: [] };
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData, error: null });

    const result = await rpcGetWeeklySync(supabase, 'user-1', 2026, 1, 5, '2026-03-17', '2026-03-23');

    expect(supabase.rpc).toHaveBeenCalledWith('get_weekly_sync', {
      p_user_id: 'user-1',
      p_year: 2026,
      p_quarter: 1,
      p_week_number: 5,
      p_start_date: '2026-03-17',
      p_end_date: '2026-03-23',
    });
    expect(result).toEqual(mockData);
  });

  it('throws on RPC error', async () => {
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'rpc fail' },
    });
    await expect(
      rpcGetWeeklySync(supabase, 'user-1', 2026, 1, 5, '2026-03-17', '2026-03-23')
    ).rejects.toMatchObject({ message: 'rpc fail' });
  });
});
