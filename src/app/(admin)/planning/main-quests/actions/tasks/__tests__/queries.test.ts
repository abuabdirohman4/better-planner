// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryTasksForMilestone,
  queryLastTaskOrder,
  validateMilestoneExists,
  insertTask,
  updateTaskStatusField,
  updateTaskTitle,
  deleteTaskById,
  updateTaskOrder,
  updateTaskScheduledDate,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryTasksForMilestone', () => {
  it('returns tasks filtered by milestone_id with null parent', async () => {
    const rows = [{ id: 't1', title: 'Task', status: 'TODO', display_order: 1 }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await queryTasksForMilestone(supabase, 'm1');
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('milestone_id', 'm1');
    expect(builder.is).toHaveBeenCalledWith('parent_task_id', null);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db error' } });
    const supabase = makeFrom(builder);
    await expect(queryTasksForMilestone(supabase, 'm1')).rejects.toThrow('Failed to fetch tasks');
  });
});

describe('queryLastTaskOrder', () => {
  it('returns display_order from last task', async () => {
    const builder = makeQueryBuilder({ data: { display_order: 5 }, error: null });
    const supabase = makeFrom(builder);
    const result = await queryLastTaskOrder(supabase, 'm1');
    expect(result).toBe(5);
  });

  it('returns undefined on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'no rows' } });
    const supabase = makeFrom(builder);
    const result = await queryLastTaskOrder(supabase, 'm1');
    expect(result).toBeUndefined();
  });
});

describe('validateMilestoneExists', () => {
  it('returns true when milestone found', async () => {
    const builder = makeQueryBuilder({ data: { id: 'm1' }, error: null });
    const supabase = makeFrom(builder);
    const result = await validateMilestoneExists(supabase, 'm1');
    expect(result).toBe(true);
  });

  it('returns false on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeFrom(builder);
    const result = await validateMilestoneExists(supabase, 'm1');
    expect(result).toBe(false);
  });
});

describe('insertTask', () => {
  it('inserts task and returns data', async () => {
    const row = { id: 't1', title: 'Task', status: 'TODO', display_order: 1, parent_task_id: null, milestone_id: 'm1' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeFrom(builder);
    const result = await insertTask(supabase, { milestone_id: 'm1', title: 'Task', status: 'TODO', user_id: 'u1' });
    expect(result).toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeFrom(builder);
    await expect(insertTask(supabase, { milestone_id: 'm1', title: 'T', status: 'TODO', user_id: 'u1' })).rejects.toThrow('Gagal menambah task');
  });
});

describe('updateTaskStatusField', () => {
  it('updates status', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateTaskStatusField(supabase, 't1', 'DONE');
    expect(builder.update).toHaveBeenCalledWith({ status: 'DONE' });
    expect(builder.eq).toHaveBeenCalledWith('id', 't1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(updateTaskStatusField(supabase, 't1', 'DONE')).rejects.toThrow('Gagal update status task');
  });
});

describe('updateTaskTitle', () => {
  it('updates title', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateTaskTitle(supabase, 't1', 'New Title');
    expect(builder.update).toHaveBeenCalledWith({ title: 'New Title' });
  });
});

describe('deleteTaskById', () => {
  it('deletes task by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteTaskById(supabase, 't1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 't1');
  });
});

describe('updateTaskOrder', () => {
  it('updates display_order', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateTaskOrder(supabase, 't1', 3);
    expect(builder.update).toHaveBeenCalledWith({ display_order: 3 });
  });
});

describe('updateTaskScheduledDate', () => {
  it('updates scheduled_date and returns success', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    const result = await updateTaskScheduledDate(supabase, 't1', '2026-03-20');
    expect(result).toEqual({ success: true });
    expect(builder.update).toHaveBeenCalledWith({ scheduled_date: '2026-03-20' });
  });

  it('returns failure on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'schedule fail' } });
    const supabase = makeFrom(builder);
    const result = await updateTaskScheduledDate(supabase, 't1', null);
    expect(result.success).toBe(false);
  });
});
