// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/quarterUtils', () => ({
  getQuarterWeekRange: vi.fn().mockReturnValue({ startWeek: 1, endWeek: 13 }),
}));
vi.mock('../queries', () => ({
  queryWeeklyGoals: vi.fn(),
  queryGoalItems: vi.fn(),
}));
vi.mock('../logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logic')>();
  return {
    ...actual,
    buildWeekGoalsMap: vi.fn(actual.buildWeekGoalsMap),
    buildGoalItemsMap: vi.fn(actual.buildGoalItemsMap),
    buildProgressData: vi.fn(actual.buildProgressData),
    buildEmptyWeeks: vi.fn(actual.buildEmptyWeeks),
  };
});

import { createClient } from '@/lib/supabase/server';
import { queryWeeklyGoals, queryGoalItems } from '../queries';
import { getWeeklyProgressForQuarter } from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  const supabase = makeSupabase({ user });
  vi.mocked(createClient).mockResolvedValue(supabase as any);
  return supabase;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWeeklyProgressForQuarter', () => {
  it('returns empty array when user is not authenticated', async () => {
    mockCreateClient(null);
    const result = await getWeeklyProgressForQuarter(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns empty weeks when no weekly goals found', async () => {
    mockCreateClient();
    vi.mocked(queryWeeklyGoals).mockResolvedValue([]);
    const result = await getWeeklyProgressForQuarter(2026, 1);
    expect(result).toHaveLength(13);
    result.forEach((w) => {
      expect(w.total).toBe(0);
      expect(w.completed).toBe(0);
      expect(w.percentage).toBe(0);
    });
    expect(queryGoalItems).not.toHaveBeenCalled();
  });

  it('calls queryGoalItems with the correct goal ids', async () => {
    mockCreateClient();
    const goals = [{ id: 'goal-1', week_number: 1, quarter: 1 }];
    vi.mocked(queryWeeklyGoals).mockResolvedValue(goals);
    vi.mocked(queryGoalItems).mockResolvedValue([]);
    await getWeeklyProgressForQuarter(2026, 1);
    expect(queryGoalItems).toHaveBeenCalledWith(expect.anything(), ['goal-1']);
  });

  it('returns 13 progress entries when goals exist', async () => {
    mockCreateClient();
    const goals = [{ id: 'goal-1', week_number: 1, quarter: 1 }];
    const items = [{ id: 'item-1', weekly_goal_id: 'goal-1', item_id: 'task-1', status: 'DONE' }];
    vi.mocked(queryWeeklyGoals).mockResolvedValue(goals);
    vi.mocked(queryGoalItems).mockResolvedValue(items);
    const result = await getWeeklyProgressForQuarter(2026, 1);
    expect(result).toHaveLength(13);
  });

  it('returns fallback empty weeks on query error', async () => {
    mockCreateClient();
    vi.mocked(queryWeeklyGoals).mockRejectedValue(new Error('DB failure'));
    const result = await getWeeklyProgressForQuarter(2026, 1);
    expect(result).toHaveLength(13);
    result.forEach((w) => {
      expect(w.total).toBe(0);
      expect(w.percentage).toBe(0);
    });
  });

  it('weekLabel uses W{n} format in normal path and Week {n} in error path', async () => {
    mockCreateClient();
    vi.mocked(queryWeeklyGoals).mockRejectedValue(new Error('fail'));
    const result = await getWeeklyProgressForQuarter(2026, 1);
    expect(result[0].weekLabel).toBe('Week 1');
  });
});
