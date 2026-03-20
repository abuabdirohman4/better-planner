// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';
import {
  deleteWeeklyGoal,
  queryExistingWeeklyGoal,
  updateWeeklyGoalQuarter,
  insertWeeklyGoal,
  queryExistingGoalItems,
  deleteGoalItems,
  insertGoalItems,
} from '../queries';

describe('deleteWeeklyGoal', () => {
  it('calls delete with correct params', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await deleteWeeklyGoal(supabase, 'goal-1', 'user-1');
    expect(supabase.from).toHaveBeenCalledWith('weekly_goals');
    expect(b.delete).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(deleteWeeklyGoal(supabase, 'goal-1', 'user-1')).rejects.toMatchObject({
      message: 'delete fail',
    });
  });
});

describe('queryExistingWeeklyGoal', () => {
  it('returns goal when found', async () => {
    const b = makeQueryBuilder({ data: { id: 'goal-1' }, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryExistingWeeklyGoal(supabase, 'user-1', 2026, 1, 1);
    expect(result).toEqual({ id: 'goal-1' });
  });

  it('returns null when PGRST116 (not found)', async () => {
    const b = makeQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryExistingWeeklyGoal(supabase, 'user-1', 2026, 1, 1);
    expect(result).toBeNull();
  });

  it('throws on non-PGRST116 error', async () => {
    const b = makeQueryBuilder({ data: null, error: { code: '42P01', message: 'table not found' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(queryExistingWeeklyGoal(supabase, 'user-1', 2026, 1, 1)).rejects.toMatchObject({
      message: 'table not found',
    });
  });
});

describe('updateWeeklyGoalQuarter', () => {
  it('returns updated goal id', async () => {
    const b = makeQueryBuilder({ data: { id: 'goal-1' }, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await updateWeeklyGoalQuarter(supabase, 'goal-1', 2);
    expect(result).toEqual({ id: 'goal-1' });
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(updateWeeklyGoalQuarter(supabase, 'goal-1', 2)).rejects.toMatchObject({
      message: 'update fail',
    });
  });
});

describe('insertWeeklyGoal', () => {
  it('returns inserted goal id', async () => {
    const b = makeQueryBuilder({ data: { id: 'new-goal' }, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await insertWeeklyGoal(supabase, 'user-1', 2026, 1, 5, 2);
    expect(result).toEqual({ id: 'new-goal' });
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(insertWeeklyGoal(supabase, 'user-1', 2026, 1, 5, 2)).rejects.toMatchObject({
      message: 'insert fail',
    });
  });
});

describe('queryExistingGoalItems', () => {
  it('returns items', async () => {
    const items = [{ item_id: 'task-1', status: 'DONE' }];
    const b = makeQueryBuilder({ data: items, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryExistingGoalItems(supabase, 'goal-1');
    expect(result).toEqual(items);
  });

  it('returns [] when data is null', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryExistingGoalItems(supabase, 'goal-1');
    expect(result).toEqual([]);
  });
});

describe('deleteGoalItems', () => {
  it('calls delete on weekly_goal_items', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await deleteGoalItems(supabase, 'goal-1');
    expect(supabase.from).toHaveBeenCalledWith('weekly_goal_items');
    expect(b.delete).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'delete items fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(deleteGoalItems(supabase, 'goal-1')).rejects.toMatchObject({
      message: 'delete items fail',
    });
  });
});

describe('insertGoalItems', () => {
  it('does nothing for empty items', async () => {
    const supabase = makeSupabase();
    await insertGoalItems(supabase, []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('inserts items successfully', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await insertGoalItems(supabase, [
      { weekly_goal_id: 'goal-1', item_id: 'task-1', status: 'TODO' },
    ]);
    expect(supabase.from).toHaveBeenCalledWith('weekly_goal_items');
    expect(b.insert).toHaveBeenCalled();
  });

  it('silently ignores 23505 unique constraint violation', async () => {
    const b = makeQueryBuilder({ data: null, error: { code: '23505', message: 'duplicate' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(
      insertGoalItems(supabase, [{ weekly_goal_id: 'goal-1', item_id: 'task-1', status: 'TODO' }])
    ).resolves.toBeUndefined();
  });

  it('throws on non-23505 error', async () => {
    const b = makeQueryBuilder({ data: null, error: { code: '42P01', message: 'table missing' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(
      insertGoalItems(supabase, [{ weekly_goal_id: 'goal-1', item_id: 'task-1', status: 'TODO' }])
    ).rejects.toMatchObject({ message: 'table missing' });
  });
});
