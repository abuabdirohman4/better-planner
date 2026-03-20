// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryWeeklyGoals, queryGoalItems } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryWeeklyGoals', () => {
  it('queries weekly_goals table with correct filters', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryWeeklyGoals(supabase, 'user-1', 2026, 1);
    expect(supabase.from).toHaveBeenCalledWith('weekly_goals');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('year', 2026);
    expect(builder.eq).toHaveBeenCalledWith('quarter', 1);
    expect(builder.gte).toHaveBeenCalledWith('week_number', 1);
    expect(builder.lte).toHaveBeenCalledWith('week_number', 13);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryWeeklyGoals(supabase, 'user-1', 2026, 1);
    expect(result).toEqual([]);
  });

  it('returns data when query succeeds', async () => {
    const rows = [{ id: 'goal-1', week_number: 1, quarter: 1 }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryWeeklyGoals(supabase, 'user-1', 2026, 1);
    expect(result).toEqual(rows);
  });

  it('throws when supabase returns error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'DB error' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryWeeklyGoals(supabase, 'user-1', 2026, 1)).rejects.toMatchObject({ message: 'DB error' });
  });
});

describe('queryGoalItems', () => {
  it('returns empty array immediately when weeklyGoalIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryGoalItems(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries weekly_goal_items table with correct .in filter', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryGoalItems(supabase, ['goal-1', 'goal-2']);
    expect(supabase.from).toHaveBeenCalledWith('weekly_goal_items');
    expect(builder.in).toHaveBeenCalledWith('weekly_goal_id', ['goal-1', 'goal-2']);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryGoalItems(supabase, ['goal-1']);
    expect(result).toEqual([]);
  });

  it('throws when supabase returns error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'items error' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryGoalItems(supabase, ['goal-1'])).rejects.toMatchObject({ message: 'items error' });
  });
});
