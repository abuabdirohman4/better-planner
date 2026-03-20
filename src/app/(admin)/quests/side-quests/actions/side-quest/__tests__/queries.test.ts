// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  querySideQuests,
  updateSideQuestStatusField,
  updateSideQuestFields,
  queryTimerSessionsByTask,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTask,
  deleteActivityLogsByTask,
  deleteDailyPlanItemsByTask,
  deleteSideQuestTask,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('querySideQuests', () => {
  it('filters by user_id, type SIDE_QUEST, and date range', async () => {
    const rows = [{ id: 't1', title: 'Side Quest', type: 'SIDE_QUEST' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const start = new Date('2026-01-01');
    const end = new Date('2026-03-31');
    const result = await querySideQuests(supabase, 'u1', start, end);
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.eq).toHaveBeenCalledWith('type', 'SIDE_QUEST');
    expect(builder.gte).toHaveBeenCalledWith('created_at', start.toISOString());
    expect(builder.lte).toHaveBeenCalledWith('created_at', end.toISOString());
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db err' } });
    const supabase = makeFrom(builder);
    await expect(querySideQuests(supabase, 'u1', new Date(), new Date())).rejects.toMatchObject({ message: 'db err' });
  });
});

describe('updateSideQuestStatusField', () => {
  it('updates status and updated_at', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateSideQuestStatusField(supabase, 't1', 'u1', 'DONE');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'DONE' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 't1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'status fail' } });
    const supabase = makeFrom(builder);
    await expect(updateSideQuestStatusField(supabase, 't1', 'u1', 'TODO')).rejects.toMatchObject({ message: 'status fail' });
  });
});

describe('updateSideQuestFields', () => {
  it('updates with correct filters including type', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateSideQuestFields(supabase, 't1', 'u1', { title: 'New Title' });
    expect(builder.update).toHaveBeenCalledWith({ title: 'New Title' });
    expect(builder.eq).toHaveBeenCalledWith('type', 'SIDE_QUEST');
  });
});

describe('queryTimerSessionsByTask', () => {
  it('returns session ids for task', async () => {
    const rows = [{ id: 'sess-1' }, { id: 'sess-2' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await queryTimerSessionsByTask(supabase, 't1', 'u1');
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('task_id', 't1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    const result = await queryTimerSessionsByTask(supabase, 't1', 'u1');
    expect(result).toEqual([]);
  });
});

describe('deleteTimerEventsBySessionIds', () => {
  it('skips DB call when sessionIds is empty', async () => {
    const supabase = makeFrom(makeQueryBuilder());
    await deleteTimerEventsBySessionIds(supabase, []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('deletes from timer_events with .in filter', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteTimerEventsBySessionIds(supabase, ['sess-1', 'sess-2']);
    expect(supabase.from).toHaveBeenCalledWith('timer_events');
    expect(builder.in).toHaveBeenCalledWith('session_id', ['sess-1', 'sess-2']);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeFrom(builder);
    await expect(deleteTimerEventsBySessionIds(supabase, ['sess-1'])).rejects.toMatchObject({ message: 'delete fail' });
  });
});

describe('deleteTimerSessionsByTask', () => {
  it('deletes timer sessions by task_id and user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteTimerSessionsByTask(supabase, 't1', 'u1');
    expect(supabase.from).toHaveBeenCalledWith('timer_sessions');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 't1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });
});

describe('deleteActivityLogsByTask', () => {
  it('deletes activity logs by task_id and user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteActivityLogsByTask(supabase, 't1', 'u1');
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 't1');
  });
});

describe('deleteDailyPlanItemsByTask', () => {
  it('deletes daily_plan_items by item_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteDailyPlanItemsByTask(supabase, 't1');
    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('item_id', 't1');
  });
});

describe('deleteSideQuestTask', () => {
  it('deletes task with SIDE_QUEST type filter', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteSideQuestTask(supabase, 't1', 'u1');
    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.eq).toHaveBeenCalledWith('type', 'SIDE_QUEST');
  });
});
