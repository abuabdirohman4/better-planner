// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryActivityLogById,
  updateActivityLogJournal,
  checkDuplicateLog,
  insertActivityLogWithJournal,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryActivityLogById', () => {
  it('queries activity_logs with correct id and user_id filters', async () => {
    const row = { id: 'log-1', what_done: 'done', what_think: 'think', created_at: '...' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryActivityLogById(supabase, 'user-1', 'log-1');
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('id', 'log-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(row);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryActivityLogById(supabase, 'user-1', 'log-x')).rejects.toMatchObject({ message: 'not found' });
  });
});

describe('updateActivityLogJournal', () => {
  it('updates what_done and what_think with correct filters', async () => {
    const row = { id: 'log-1', what_done: 'done', what_think: null };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await updateActivityLogJournal(supabase, 'user-1', 'log-1', 'done', null);
    expect(builder.update).toHaveBeenCalledWith({ what_done: 'done', what_think: null });
    expect(builder.eq).toHaveBeenCalledWith('id', 'log-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(result).toEqual(row);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateActivityLogJournal(supabase, 'u', 'id', null, null)).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('checkDuplicateLog', () => {
  it('queries with correct filters and returns existing log', async () => {
    const row = { id: 'log-1' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await checkDuplicateLog(supabase, 'user-1', 'task-1', 'start', 'end');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('start_time', 'start');
    expect(builder.eq).toHaveBeenCalledWith('end_time', 'end');
    expect(result).toEqual(row);
  });

  it('returns null when no duplicate found', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await checkDuplicateLog(supabase, 'user-1', 'task-1', 's', 'e');
    expect(result).toBeNull();
  });
});

describe('insertActivityLogWithJournal', () => {
  it('inserts with correct payload', async () => {
    const row = { id: 'log-1' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const payload = {
      user_id: 'user-1', task_id: 'task-1', type: 'FOCUS' as const,
      start_time: 's', end_time: 'e', duration_minutes: 25,
      local_date: '2026-01-01', what_done: 'done', what_think: null,
    };
    const result = await insertActivityLogWithJournal(supabase, payload);
    expect(builder.insert).toHaveBeenCalledWith(payload);
    expect(result).toEqual(row);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertActivityLogWithJournal(supabase, {
      user_id: 'u', task_id: 't', type: 'FOCUS', start_time: 's', end_time: 'e',
      duration_minutes: 1, local_date: 'd', what_done: null, what_think: null,
    })).rejects.toMatchObject({ message: 'insert fail' });
  });
});
