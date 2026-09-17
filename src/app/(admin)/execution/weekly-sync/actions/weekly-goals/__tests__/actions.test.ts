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
    // upsertGoalItems not called (empty items)
    // Fourth call: deleteGoalItems → ok (hapus semua, keep list kosong)
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

  it('upserts new items before deleting leftovers', async () => {
    const builders: any[] = [];
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation(() => {
        const n = builders.length;
        const b =
          n === 0 || n === 1
            ? makeQueryBuilder({ data: { id: 'goal-1' }, error: null }) // find + update quarter
            : n === 2
              ? makeQueryBuilder({ data: [{ item_id: 'task-old', status: 'DONE' }], error: null })
              : makeQueryBuilder({ data: null, error: null });
        builders.push(b);
        return b;
      }),
    } as any;
    mockCreateClient.mockResolvedValue(supabase);
    await setWeeklyGoalItems({
      year: 2026,
      quarter: 1,
      weekNumber: 5,
      goalSlot: 1,
      items: [
        { id: 'task-1', type: 'TASK' },
        { id: 'task-1', type: 'TASK' },
        { id: 'task-2', type: 'TASK' },
      ],
    });
    expect(builders[3].upsert).toHaveBeenCalledWith(
      [
        { weekly_goal_id: 'goal-1', item_id: 'task-1', status: 'TODO' },
        { weekly_goal_id: 'goal-1', item_id: 'task-2', status: 'TODO' },
      ],
      { onConflict: 'weekly_goal_id,item_id', ignoreDuplicates: true }
    );
    expect(builders[4].delete).toHaveBeenCalled();
    expect(builders[4].not).toHaveBeenCalledWith('item_id', 'in', '(task-1,task-2)');
  });

  it('does not delete anything when upsert fails', async () => {
    const builders: any[] = [];
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation(() => {
        const n = builders.length;
        const b =
          n === 0 || n === 1
            ? makeQueryBuilder({ data: { id: 'goal-1' }, error: null })
            : n === 2
              ? makeQueryBuilder({ data: [], error: null })
              : makeQueryBuilder({ data: null, error: { code: '23503', message: 'fk violation' } });
        builders.push(b);
        return b;
      }),
    } as any;
    mockCreateClient.mockResolvedValue(supabase);
    await expect(
      setWeeklyGoalItems({
        year: 2026,
        quarter: 1,
        weekNumber: 5,
        goalSlot: 1,
        items: [{ id: 'task-1', type: 'TASK' }],
      })
    ).rejects.toThrow('Failed to set weekly goal items');
    expect(builders[3].upsert).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledTimes(4);
    for (const b of builders) expect(b.delete).not.toHaveBeenCalled();
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
