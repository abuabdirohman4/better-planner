// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  verifyPlanItemOwnership,
  insertSchedule,
  updateScheduleById,
  deleteScheduleById,
  querySchedulesByItemId,
  querySchedulesByDateRange,
  queryTaskTitlesByIds,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('verifyPlanItemOwnership', () => {
  it('returns user_id when ownership verified', async () => {
    const builder = makeQueryBuilder({
      data: { id: 'dpi-1', daily_plans: { user_id: 'user-1' } },
      error: null,
    });
    const supabase = makeSupabaseFrom(builder);
    const result = await verifyPlanItemOwnership(supabase, 'dpi-1');
    expect(result).toBe('user-1');
  });

  it('returns null when not found', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeSupabaseFrom(builder);
    const result = await verifyPlanItemOwnership(supabase, 'dpi-x');
    expect(result).toBeNull();
  });

  it('handles array format for daily_plans join', async () => {
    const builder = makeQueryBuilder({
      data: { id: 'dpi-1', daily_plans: [{ user_id: 'user-1' }] },
      error: null,
    });
    const supabase = makeSupabaseFrom(builder);
    const result = await verifyPlanItemOwnership(supabase, 'dpi-1');
    expect(result).toBe('user-1');
  });
});

describe('insertSchedule', () => {
  it('inserts into task_schedules and returns data', async () => {
    const schedule = { id: 'sched-1', daily_plan_item_id: 'dpi-1' };
    const builder = makeQueryBuilder({ data: schedule, error: null });
    const supabase = makeSupabaseFrom(builder);

    const payload = {
      daily_plan_item_id: 'dpi-1',
      scheduled_start_time: '2026-03-20T10:00:00Z',
      scheduled_end_time: '2026-03-20T10:25:00Z',
      duration_minutes: 25,
      session_count: 1,
    };

    const result = await insertSchedule(supabase, payload);

    expect(supabase.from).toHaveBeenCalledWith('task_schedules');
    expect(builder.insert).toHaveBeenCalledWith(payload);
    expect(result).toEqual(schedule);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertSchedule(supabase, {} as any)).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('updateScheduleById', () => {
  it('updates task_schedules by id', async () => {
    const updated = { id: 'sched-1', duration_minutes: 50 };
    const builder = makeQueryBuilder({ data: updated, error: null });
    const supabase = makeSupabaseFrom(builder);

    const payload = {
      scheduled_start_time: '2026-03-20T10:00:00Z',
      scheduled_end_time: '2026-03-20T10:50:00Z',
      duration_minutes: 50,
      session_count: 2,
    };

    const result = await updateScheduleById(supabase, 'sched-1', payload);

    expect(builder.eq).toHaveBeenCalledWith('id', 'sched-1');
    expect(result).toEqual(updated);
  });

  it('returns undefined when row not found (PGRST116)', async () => {
    const builder = makeQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
    const supabase = makeSupabaseFrom(builder);
    const result = await updateScheduleById(supabase, 'sched-x', {} as any);
    expect(result).toBeUndefined();
  });

  it('throws on other errors', async () => {
    const builder = makeQueryBuilder({ data: null, error: { code: '42P01', message: 'table missing' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateScheduleById(supabase, 'sched-1', {} as any)).rejects.toMatchObject({ message: 'table missing' });
  });
});

describe('deleteScheduleById', () => {
  it('deletes from task_schedules by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteScheduleById(supabase, 'sched-1');
    expect(supabase.from).toHaveBeenCalledWith('task_schedules');
    expect(builder.eq).toHaveBeenCalledWith('id', 'sched-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteScheduleById(supabase, 'sched-1')).rejects.toMatchObject({ message: 'delete fail' });
  });
});

describe('querySchedulesByItemId', () => {
  it('queries task_schedules ordered by start_time', async () => {
    const schedules = [{ id: 'sched-1' }];
    const builder = makeQueryBuilder({ data: schedules, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await querySchedulesByItemId(supabase, 'dpi-1');

    expect(builder.eq).toHaveBeenCalledWith('daily_plan_item_id', 'dpi-1');
    expect(builder.order).toHaveBeenCalledWith('scheduled_start_time', { ascending: true });
    expect(result).toEqual(schedules);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'query fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(querySchedulesByItemId(supabase, 'dpi-1')).rejects.toMatchObject({ message: 'query fail' });
  });
});

describe('querySchedulesByDateRange', () => {
  it('queries with gte + lte filters', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await querySchedulesByDateRange(supabase, '2026-03-19T17:00:00Z', '2026-03-20T16:59:59Z');
    expect(builder.gte).toHaveBeenCalledWith('scheduled_start_time', '2026-03-19T17:00:00Z');
    expect(builder.lte).toHaveBeenCalledWith('scheduled_end_time', '2026-03-20T16:59:59Z');
  });
});

describe('queryTaskTitlesByIds', () => {
  it('returns empty array when itemIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryTaskTitlesByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries tasks by id', async () => {
    const titles = [{ id: 'task-1', title: 'My Task' }];
    const builder = makeQueryBuilder({ data: titles, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTaskTitlesByIds(supabase, ['task-1']);
    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.in).toHaveBeenCalledWith('id', ['task-1']);
    expect(result).toEqual(titles);
  });
});
