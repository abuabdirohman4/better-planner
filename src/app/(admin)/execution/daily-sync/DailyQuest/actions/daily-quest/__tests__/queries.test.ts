// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  insertDailyQuestTask,
  updateDailyQuestArchive,
  queryTimerSessions,
  deleteTimerEvents,
  deleteTimerSessions,
  deleteActivityLogs,
  deleteDailyPlanItems,
  deleteTask,
  queryDailyQuests,
  updateTask,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('insertDailyQuestTask', () => {
  it('inserts into tasks and returns the new task', async () => {
    const task = { id: 'task-1', user_id: 'user-1', title: 'Test Quest', type: 'DAILY_QUEST', status: 'TODO', focus_duration: 25 };
    const builder = makeQueryBuilder({ data: task, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await insertDailyQuestTask(supabase, 'user-1', 'Test Quest', 25);

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: 'Test Quest',
      type: 'DAILY_QUEST',
      status: 'TODO',
      focus_duration: 25,
      milestone_id: null,
    });
    expect(result).toEqual(task);
  });

  it('throws on insert error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertDailyQuestTask(supabase, 'user-1', 'Test', 0)).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('updateDailyQuestArchive', () => {
  it('sets is_archived=true on the task', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await updateDailyQuestArchive(supabase, 'task-1');

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.update).toHaveBeenCalledWith({ is_archived: true });
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
  });

  it('throws on update error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'archive fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateDailyQuestArchive(supabase, 'task-1')).rejects.toMatchObject({ message: 'archive fail' });
  });
});

describe('queryTimerSessions', () => {
  it('selects timer sessions by task_id and user_id', async () => {
    const sessions = [{ id: 'session-1' }, { id: 'session-2' }];
    const builder = makeQueryBuilder({ data: sessions, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryTimerSessions(supabase, 'task-1', 'user-1');

    expect(supabase.from).toHaveBeenCalledWith('timer_sessions');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(result).toEqual(sessions);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTimerSessions(supabase, 'task-1', 'user-1');
    expect(result).toEqual([]);
  });
});

describe('deleteTimerEvents', () => {
  it('deletes timer_events by session_id .in filter', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await deleteTimerEvents(supabase, ['session-1', 'session-2']);

    expect(supabase.from).toHaveBeenCalledWith('timer_events');
    expect(builder.in).toHaveBeenCalledWith('session_id', ['session-1', 'session-2']);
  });

  it('throws on delete error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'events delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteTimerEvents(supabase, ['s-1'])).rejects.toMatchObject({ message: 'events delete fail' });
  });
});

describe('deleteTimerSessions', () => {
  it('deletes timer_sessions by task_id and user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await deleteTimerSessions(supabase, 'task-1', 'user-1');

    expect(supabase.from).toHaveBeenCalledWith('timer_sessions');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'sessions delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteTimerSessions(supabase, 'task-1', 'user-1')).rejects.toMatchObject({ message: 'sessions delete fail' });
  });
});

describe('deleteActivityLogs', () => {
  it('deletes activity_logs by task_id and user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await deleteActivityLogs(supabase, 'task-1', 'user-1');

    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'logs delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteActivityLogs(supabase, 'task-1', 'user-1')).rejects.toMatchObject({ message: 'logs delete fail' });
  });
});

describe('deleteDailyPlanItems', () => {
  it('deletes daily_plan_items by item_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await deleteDailyPlanItems(supabase, 'task-1');

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.eq).toHaveBeenCalledWith('item_id', 'task-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'plan items delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteDailyPlanItems(supabase, 'task-1')).rejects.toMatchObject({ message: 'plan items delete fail' });
  });
});

describe('deleteTask', () => {
  it('deletes task by id and user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    await deleteTask(supabase, 'task-1', 'user-1');

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'task delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteTask(supabase, 'task-1', 'user-1')).rejects.toMatchObject({ message: 'task delete fail' });
  });
});

describe('queryDailyQuests', () => {
  it('queries tasks with DAILY_QUEST type within date range', async () => {
    const tasks = [{ id: 'task-1', title: 'Quest A' }];
    const builder = makeQueryBuilder({ data: tasks, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryDailyQuests(supabase, 'user-1', '2026-01-01T00:00:00Z', '2026-03-31T23:59:59Z');

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('type', 'DAILY_QUEST');
    expect(builder.gte).toHaveBeenCalledWith('created_at', '2026-01-01T00:00:00Z');
    expect(builder.lte).toHaveBeenCalledWith('created_at', '2026-03-31T23:59:59Z');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual(tasks);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryDailyQuests(supabase, 'user-1', '2026-01-01T00:00:00Z', '2026-03-31T23:59:59Z');
    expect(result).toEqual([]);
  });

  it('throws on query error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'query fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryDailyQuests(supabase, 'user-1', 'start', 'end')).rejects.toMatchObject({ message: 'query fail' });
  });
});

describe('updateTask', () => {
  it('updates a task and returns updated data', async () => {
    const updated = { id: 'task-1', title: 'Updated', status: 'IN_PROGRESS' };
    const builder = makeQueryBuilder({ data: updated, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await updateTask(supabase, 'task-1', { title: 'Updated', status: 'IN_PROGRESS' });

    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.update).toHaveBeenCalledWith({ title: 'Updated', status: 'IN_PROGRESS' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
    expect(result).toEqual(updated);
  });

  it('throws on update error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateTask(supabase, 'task-1', {})).rejects.toMatchObject({ message: 'update fail' });
  });
});
