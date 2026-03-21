// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryWeeklyGoals,
  queryWeeklyGoalItems,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
  queryCompletedPreviousDayItems,
  queryTodayPlanItems,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryWeeklyGoals', () => {
  it('queries weekly_goals with user_id, year, week_number filters', async () => {
    const goals = [{ id: 'wg-1', goal_slot: 1 }];
    const builder = makeQueryBuilder({ data: goals, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryWeeklyGoals(supabase, 'user-1', 2026, 12);

    expect(supabase.from).toHaveBeenCalledWith('weekly_goals');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('year', 2026);
    expect(builder.eq).toHaveBeenCalledWith('week_number', 12);
    expect(result).toEqual(goals);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryWeeklyGoals(supabase, 'user-1', 2026, 12);
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryWeeklyGoals(supabase, 'user-1', 2026, 12)).rejects.toMatchObject({ message: 'db fail' });
  });
});

describe('queryWeeklyGoalItems', () => {
  it('queries weekly_goal_items with .in on weekly_goal_id', async () => {
    const items = [{ id: 'wgi-1', weekly_goal_id: 'wg-1', item_id: 'task-1' }];
    const builder = makeQueryBuilder({ data: items, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryWeeklyGoalItems(supabase, ['wg-1', 'wg-2']);

    expect(supabase.from).toHaveBeenCalledWith('weekly_goal_items');
    expect(builder.in).toHaveBeenCalledWith('weekly_goal_id', ['wg-1', 'wg-2']);
    expect(result).toEqual(items);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'items fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryWeeklyGoalItems(supabase, ['wg-1'])).rejects.toMatchObject({ message: 'items fail' });
  });
});

describe('queryTasksByIds', () => {
  it('queries tasks with .in on id', async () => {
    const tasks = [{ id: 'task-1', title: 'Task One', status: 'TODO', milestone_id: null, type: 'WORK', parent_task_id: null }];
    const builder = makeQueryBuilder({ data: tasks, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryTasksByIds(supabase, ['task-1', 'task-2']);

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.in).toHaveBeenCalledWith('id', ['task-1', 'task-2']);
    expect(result).toEqual(tasks);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTasksByIds(supabase, ['task-1']);
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'tasks fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryTasksByIds(supabase, ['task-1'])).rejects.toMatchObject({ message: 'tasks fail' });
  });
});

describe('queryMilestonesByIds', () => {
  it('returns empty array immediately when milestoneIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryMilestonesByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries milestones with .in on id', async () => {
    const milestones = [{ id: 'ms-1', title: 'Milestone One', quest_id: 'quest-1' }];
    const builder = makeQueryBuilder({ data: milestones, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryMilestonesByIds(supabase, ['ms-1']);

    expect(supabase.from).toHaveBeenCalledWith('milestones');
    expect(builder.in).toHaveBeenCalledWith('id', ['ms-1']);
    expect(result).toEqual(milestones);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'milestones fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryMilestonesByIds(supabase, ['ms-1'])).rejects.toMatchObject({ message: 'milestones fail' });
  });
});

describe('queryQuestsByIds', () => {
  it('returns empty array immediately when questIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryQuestsByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries quests with .in on id', async () => {
    const quests = [{ id: 'quest-1', title: 'My Quest' }];
    const builder = makeQueryBuilder({ data: quests, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryQuestsByIds(supabase, ['quest-1']);

    expect(supabase.from).toHaveBeenCalledWith('quests');
    expect(builder.in).toHaveBeenCalledWith('id', ['quest-1']);
    expect(result).toEqual(quests);
  });
});

describe('queryCompletedPreviousDayItems', () => {
  it('returns empty array immediately when previousDays is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryCompletedPreviousDayItems(supabase, 'user-1', []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries daily_plan_items with user_id, previous dates, and DONE status', async () => {
    const rows = [{ item_id: 'task-1', status: 'DONE', updated_at: 'T1', daily_plans: { plan_date: '2026-03-17', user_id: 'user-1' } }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryCompletedPreviousDayItems(supabase, 'user-1', ['2026-03-17', '2026-03-18']);

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('daily_plans.user_id', 'user-1');
    expect(builder.in).toHaveBeenCalledWith('daily_plans.plan_date', ['2026-03-17', '2026-03-18']);
    expect(builder.eq).toHaveBeenCalledWith('status', 'DONE');
    // Returns mapped { item_id } only
    expect(result).toEqual([{ item_id: 'task-1' }]);
  });
});

describe('queryTodayPlanItems', () => {
  it('queries daily_plan_items for today with user_id and plan_date', async () => {
    const rows = [{ item_id: 'task-2', status: 'TODO', daily_plans: { plan_date: '2026-03-20', user_id: 'user-1' } }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryTodayPlanItems(supabase, 'user-1', '2026-03-20');

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('daily_plans.user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('daily_plans.plan_date', '2026-03-20');
    // Returns mapped { item_id } only
    expect(result).toEqual([{ item_id: 'task-2' }]);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTodayPlanItems(supabase, 'user-1', '2026-03-20');
    expect(result).toEqual([]);
  });
});
