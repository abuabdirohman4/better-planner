// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

// Mock next/cache and supabase server before importing actions
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getHierarchicalData } from '../actions';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('getHierarchicalData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns [] when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    const result = await getHierarchicalData(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns [] when quests query returns empty array', async () => {
    const b = makeQueryBuilder({ data: [], error: null });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await getHierarchicalData(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns [] on DB error and logs error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Make from() throw to simulate a deeper error
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation(() => {
        throw new Error('connection failed');
      }),
    } as any;
    mockCreateClient.mockResolvedValue(supabase);
    const result = await getHierarchicalData(2026, 1);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
