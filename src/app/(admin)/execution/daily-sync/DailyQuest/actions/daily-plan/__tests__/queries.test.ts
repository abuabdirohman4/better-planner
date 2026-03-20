// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  upsertDailyPlan,
  queryExistingPlanItems,
  querySchedulesByPlanItemIds,
  deletePlanItemsByTypes,
  insertPlanItems,
  insertTaskSchedules,
  updatePlanItemField,
  updatePlanItemStatusRpc,
  updateWeeklyGoalItemsStatus,
  deletePlanItem,
  updatePlanItemsDisplayOrderBatch,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('upsertDailyPlan', () => {
  it('upserts daily_plans and returns data', async () => {
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

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(upsertDailyPlan(supabase, 'user-1', '2026-03-20')).rejects.toMatchObject({ message: 'upsert fail' });
  });
});

describe('queryExistingPlanItems', () => {
  it('queries daily_plan_items by daily_plan_id', async () => {
    const items = [{ id: 'dpi-1', item_id: 'task-1' }];
    const builder = makeQueryBuilder({ data: items, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryExistingPlanItems(supabase, 'plan-1');

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('daily_plan_id', 'plan-1');
    expect(result).toEqual(items);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryExistingPlanItems(supabase, 'plan-1');
    expect(result).toEqual([]);
  });
});

describe('querySchedulesByPlanItemIds', () => {
  it('returns empty array immediately when itemIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await querySchedulesByPlanItemIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries task_schedules with .in filter', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'sched-1' }], error: null });
    const supabase = makeSupabaseFrom(builder);
    await querySchedulesByPlanItemIds(supabase, ['dpi-1', 'dpi-2']);
    expect(supabase.from).toHaveBeenCalledWith('task_schedules');
    expect(builder.in).toHaveBeenCalledWith('daily_plan_item_id', ['dpi-1', 'dpi-2']);
  });
});

describe('deletePlanItemsByTypes', () => {
  it('skips DB call when itemTypes is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await deletePlanItemsByTypes(supabase, 'plan-1', []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('deletes with eq on daily_plan_id and in on item_type', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deletePlanItemsByTypes(supabase, 'plan-1', ['DAILY', 'WORK']);
    expect(builder.eq).toHaveBeenCalledWith('daily_plan_id', 'plan-1');
    expect(builder.in).toHaveBeenCalledWith('item_type', ['DAILY', 'WORK']);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deletePlanItemsByTypes(supabase, 'plan-1', ['DAILY'])).rejects.toMatchObject({ message: 'delete fail' });
  });
});

describe('insertPlanItems', () => {
  it('inserts items and returns id + item_id', async () => {
    const returned = [{ id: 'dpi-1', item_id: 'task-1' }];
    const builder = makeQueryBuilder({ data: returned, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await insertPlanItems(supabase, [{ item_id: 'task-1' }]);

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.insert).toHaveBeenCalled();
    expect(result).toEqual(returned);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertPlanItems(supabase, [{}])).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('insertTaskSchedules', () => {
  it('skips DB call when schedules is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await insertTaskSchedules(supabase, []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('inserts into task_schedules (does not throw on error — soft fail)', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'restore fail' } });
    const supabase = makeSupabaseFrom(builder);
    // Should NOT throw — this is a soft-fail function
    await expect(insertTaskSchedules(supabase, [{ daily_plan_item_id: 'dpi-1' }])).resolves.toBeUndefined();
  });
});

describe('updatePlanItemField', () => {
  it('updates daily_plan_items by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await updatePlanItemField(supabase, 'dpi-1', { focus_duration: 30 });
    expect(builder.update).toHaveBeenCalledWith({ focus_duration: 30 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'dpi-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updatePlanItemField(supabase, 'dpi-1', {})).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('updatePlanItemStatusRpc', () => {
  it('calls rpc with correct parameters', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: 'ok', error: null }),
    } as any;
    const result = await updatePlanItemStatusRpc(supabase, 'task-1', 'DONE', 'user-1', '2026-03-20', 'dpi-1');
    expect(supabase.rpc).toHaveBeenCalledWith('update_task_and_daily_plan_status', expect.objectContaining({
      p_task_id: 'task-1',
      p_status: 'DONE',
      p_user_id: 'user-1',
      p_date: '2026-03-20',
      p_daily_plan_item_id: 'dpi-1',
    }));
    expect(result).toBe('ok');
  });

  it('throws on rpc error', async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc fail' } }),
    } as any;
    await expect(updatePlanItemStatusRpc(supabase, 'task-1', 'DONE', 'user-1', '2026-03-20', null)).rejects.toMatchObject({ message: 'rpc fail' });
  });
});

describe('updateWeeklyGoalItemsStatus', () => {
  it('updates weekly_goal_items (does not throw on error — soft warn)', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'warn fail' } });
    const supabase = makeSupabaseFrom(builder);
    // Should NOT throw
    await expect(updateWeeklyGoalItemsStatus(supabase, 'task-1', 'DONE')).resolves.toBeUndefined();
  });

  it('updates with correct filter on item_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await updateWeeklyGoalItemsStatus(supabase, 'task-1', 'DONE');
    expect(builder.update).toHaveBeenCalledWith({ status: 'DONE' });
    expect(builder.eq).toHaveBeenCalledWith('item_id', 'task-1');
  });
});

describe('deletePlanItem', () => {
  it('deletes from daily_plan_items by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deletePlanItem(supabase, 'dpi-1');
    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('id', 'dpi-1');
  });
});

describe('updatePlanItemsDisplayOrderBatch', () => {
  it('runs concurrent updates for all items (Promise.all)', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const items = [
      { id: 'dpi-1', display_order: 0 },
      { id: 'dpi-2', display_order: 1 },
    ];
    await updatePlanItemsDisplayOrderBatch(supabase, items);
    // Each item triggers one supabase.from() call
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(builder.update).toHaveBeenCalledWith({ display_order: 0 });
    expect(builder.update).toHaveBeenCalledWith({ display_order: 1 });
  });

  it('throws when any item update fails', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'batch fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updatePlanItemsDisplayOrderBatch(supabase, [{ id: 'dpi-1', display_order: 0 }]))
      .rejects.toMatchObject({ message: 'batch fail' });
  });
});
