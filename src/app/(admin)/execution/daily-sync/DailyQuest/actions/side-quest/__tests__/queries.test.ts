// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { insertSideQuestTask, upsertDailyPlan, insertSideQuestPlanItem } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('insertSideQuestTask', () => {
  it('inserts into tasks table and returns the created task', async () => {
    const task = { id: 'task-1', user_id: 'user-1', title: 'Learn TypeScript', type: 'SIDE_QUEST', status: 'TODO', milestone_id: null };
    const builder = makeQueryBuilder({ data: task, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await insertSideQuestTask(supabase, 'user-1', 'Learn TypeScript');

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: 'Learn TypeScript',
      type: 'SIDE_QUEST',
      status: 'TODO',
      milestone_id: null,
    });
    expect(result).toEqual(task);
  });

  it('throws on DB error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert task fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertSideQuestTask(supabase, 'user-1', 'Learn TypeScript')).rejects.toMatchObject({ message: 'insert task fail' });
  });
});

describe('upsertDailyPlan', () => {
  it('upserts daily_plans and returns plan with id', async () => {
    const plan = { id: 'plan-1', user_id: 'user-1', plan_date: '2026-03-20' };
    const builder = makeQueryBuilder({ data: plan, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await upsertDailyPlan(supabase, 'user-1', '2026-03-20');

    expect(supabase.from).toHaveBeenCalledWith('daily_plans');
    expect(builder.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', plan_date: '2026-03-20' },
      { onConflict: 'user_id,plan_date' }
    );
    expect(result).toEqual(plan);
  });

  it('throws on DB error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(upsertDailyPlan(supabase, 'user-1', '2026-03-20')).rejects.toMatchObject({ message: 'upsert fail' });
  });
});

describe('insertSideQuestPlanItem', () => {
  it('inserts into daily_plan_items with correct shape', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await insertSideQuestPlanItem(supabase, 'plan-1', 'task-1');

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.insert).toHaveBeenCalledWith({
      daily_plan_id: 'plan-1',
      item_id: 'task-1',
      item_type: 'SIDE_QUEST',
      status: 'TODO',
      focus_duration: 25,
    });
  });

  it('throws on DB error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert item fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertSideQuestPlanItem(supabase, 'plan-1', 'task-1')).rejects.toMatchObject({ message: 'insert item fail' });
  });
});
