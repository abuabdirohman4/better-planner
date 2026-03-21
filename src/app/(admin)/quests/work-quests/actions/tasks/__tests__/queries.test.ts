// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  insertTask,
  updateTaskTitle,
  updateTaskStatus,
  deleteTaskById,
  queryTimerSessionIdsByTaskId,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskId,
  deleteActivityLogsByTaskId,
  deleteDailyPlanItemsByTaskId,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('insertTask', () => {
  it('inserts with correct payload', async () => {
    const row = { id: 'task-1', title: 'Test Task' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await insertTask(supabase, 'user-1', 'proj-1', 'Test Task');

    expect(result).toEqual(row);
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      parent_task_id: 'proj-1',
      title: 'Test Task',
      type: 'WORK_QUEST',
      status: 'TODO',
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertTask(supabase, 'user-1', 'proj-1', 'T')).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('updateTaskTitle', () => {
  it('updates with correct filters', async () => {
    const row = { id: 'task-1', title: 'New Title' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await updateTaskTitle(supabase, 'user-1', 'task-1', 'New Title');

    expect(result).toEqual(row);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateTaskTitle(supabase, 'user-1', 'task-1', 'T')).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('updateTaskStatus', () => {
  it('updates status field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await updateTaskStatus(supabase, 'user-1', 'task-1', 'DONE');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'DONE' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateTaskStatus(supabase, 'user-1', 'task-1', 'DONE')).rejects.toMatchObject({ message: 'fail' });
  });
});

describe('deleteTaskById', () => {
  it('deletes with correct filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteTaskById(supabase, 'user-1', 'task-1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});

describe('queryTimerSessionIdsByTaskId', () => {
  it('returns mapped session IDs', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'sess-1' }, { id: 'sess-2' }], error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTimerSessionIdsByTaskId(supabase, 'user-1', 'task-1');
    expect(result).toEqual(['sess-1', 'sess-2']);
  });

  it('returns empty array when no sessions', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTimerSessionIdsByTaskId(supabase, 'user-1', 'task-1');
    expect(result).toEqual([]);
  });
});

describe('deleteTimerEventsBySessionIds', () => {
  it('skips DB call when sessionIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await deleteTimerEventsBySessionIds(supabase, []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('deletes from timer_events', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteTimerEventsBySessionIds(supabase, ['sess-1']);
    expect(supabase.from).toHaveBeenCalledWith('timer_events');
    expect(builder.in).toHaveBeenCalledWith('session_id', ['sess-1']);
  });
});

describe('deleteTimerSessionsByTaskId', () => {
  it('deletes from timer_sessions with correct filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteTimerSessionsByTaskId(supabase, 'user-1', 'task-1');
    expect(supabase.from).toHaveBeenCalledWith('timer_sessions');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
  });
});

describe('deleteActivityLogsByTaskId', () => {
  it('deletes from activity_logs', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteActivityLogsByTaskId(supabase, 'user-1', 'task-1');
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
  });
});

describe('deleteDailyPlanItemsByTaskId', () => {
  it('deletes from daily_plan_items with item_id filter', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteDailyPlanItemsByTaskId(supabase, 'task-1');
    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('item_id', 'task-1');
  });
});
