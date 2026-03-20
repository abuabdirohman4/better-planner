// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { removeWeeklyGoal, setWeeklyGoalItems } from '../actions';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('removeWeeklyGoal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    await expect(removeWeeklyGoal('goal-1')).rejects.toThrow('User not found');
  });

  it('returns success on valid delete', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await removeWeeklyGoal('goal-1');
    expect(result).toEqual({ success: true, message: 'Weekly goal removed successfully' });
  });

  it('throws wrapped error on DB failure', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'DB error' } });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    await expect(removeWeeklyGoal('goal-1')).rejects.toThrow('Failed to remove weekly goal');
  });
});

describe('setWeeklyGoalItems', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    await expect(
      setWeeklyGoalItems({ year: 2026, quarter: 1, weekNumber: 5, goalSlot: 1, items: [] })
    ).rejects.toThrow('Failed to set weekly goal items');
  });

  it('returns success when creating new goal with no items', async () => {
    // First call: queryExistingWeeklyGoal → PGRST116 (not found)
    // Second call: insertWeeklyGoal → { id: 'new-goal' }
    // Third call: queryExistingGoalItems → []
    // Fourth call: deleteGoalItems → ok
    // insertGoalItems not called (empty items)
    const calls: any[] = [];
    let callCount = 0;
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // queryExistingWeeklyGoal → PGRST116
          const b = makeQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
          calls.push(b);
          return b;
        }
        if (callCount === 2) {
          // insertWeeklyGoal
          const b = makeQueryBuilder({ data: { id: 'new-goal' }, error: null });
          calls.push(b);
          return b;
        }
        // queryExistingGoalItems + deleteGoalItems
        const b = makeQueryBuilder({ data: [], error: null });
        calls.push(b);
        return b;
      }),
    } as any;
    mockCreateClient.mockResolvedValue(supabase);
    const result = await setWeeklyGoalItems({
      year: 2026,
      quarter: 1,
      weekNumber: 5,
      goalSlot: 1,
      items: [],
    });
    expect(result).toEqual({ success: true, message: 'Weekly goal items set successfully' });
  });

  it('throws wrapped error on failure', async () => {
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation(() => {
        throw new Error('connection error');
      }),
    } as any;
    mockCreateClient.mockResolvedValue(supabase);
    await expect(
      setWeeklyGoalItems({ year: 2026, quarter: 1, weekNumber: 5, goalSlot: 1, items: [] })
    ).rejects.toThrow('Failed to set weekly goal items');
  });
});
