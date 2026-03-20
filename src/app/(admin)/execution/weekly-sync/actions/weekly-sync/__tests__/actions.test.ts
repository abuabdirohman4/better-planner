// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getWeeklySync } from '../actions';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('getWeeklySync', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty result when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    const result = await getWeeklySync(2026, 1, 5, '2026-03-17', '2026-03-23');
    expect(result).toEqual({ goals: [], rules: [] });
  });

  it('returns normalized data on success', async () => {
    const mockData = { goals: [{ id: 'g1' }], rules: [{ id: 'r1' }] };
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData, error: null });
    mockCreateClient.mockResolvedValue(supabase);
    const result = await getWeeklySync(2026, 1, 5, '2026-03-17', '2026-03-23');
    expect(result).toEqual({ goals: [{ id: 'g1' }], rules: [{ id: 'r1' }] });
  });

  it('returns empty result when RPC returns null data', async () => {
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
    mockCreateClient.mockResolvedValue(supabase);
    const result = await getWeeklySync(2026, 1, 5, '2026-03-17', '2026-03-23');
    expect(result).toEqual({ goals: [], rules: [] });
  });

  it('returns empty result on RPC error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'rpc fail' },
    });
    mockCreateClient.mockResolvedValue(supabase);
    const result = await getWeeklySync(2026, 1, 5, '2026-03-17', '2026-03-23');
    expect(result).toEqual({ goals: [], rules: [] });
    consoleSpy.mockRestore();
  });
});
