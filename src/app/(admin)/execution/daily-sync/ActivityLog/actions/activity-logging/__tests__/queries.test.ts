// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  checkDuplicateActivityLog,
  insertActivityLog,
  queryActivityLogs,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('checkDuplicateActivityLog', () => {
  it('queries activity_logs with correct filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await checkDuplicateActivityLog(supabase, 'user-1', 'task-1', '2026-01-01T09:00:00Z', '2026-01-01T09:25:00Z');
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('start_time', '2026-01-01T09:00:00Z');
    expect(builder.eq).toHaveBeenCalledWith('end_time', '2026-01-01T09:25:00Z');
    expect(builder.single).toHaveBeenCalled();
  });

  it('returns null when no duplicate found', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await checkDuplicateActivityLog(supabase, 'user-1', 'task-1', 's', 'e');
    expect(result).toBeNull();
  });
});

describe('insertActivityLog', () => {
  it('inserts with correct payload', async () => {
    const row = { id: 'log-1' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const payload = {
      user_id: 'user-1', task_id: 'task-1', type: 'FOCUS' as const,
      start_time: 's', end_time: 'e', duration_minutes: 25,
      local_date: '2026-01-01', what_done: null, what_think: null,
    };
    const result = await insertActivityLog(supabase, payload);
    expect(builder.insert).toHaveBeenCalledWith(payload);
    expect(result).toEqual(row);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertActivityLog(supabase, {
      user_id: 'u', task_id: 't', type: 'FOCUS', start_time: 's', end_time: 'e',
      duration_minutes: 1, local_date: 'd', what_done: null, what_think: null,
    })).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('queryActivityLogs', () => {
  it('queries with correct user_id and local_date filters', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryActivityLogs(supabase, 'user-1', '2026-01-01');
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('local_date', '2026-01-01');
    expect(builder.order).toHaveBeenCalledWith('start_time', { ascending: false });
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'query fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryActivityLogs(supabase, 'user-1', 'd')).rejects.toMatchObject({ message: 'query fail' });
  });
});

describe('queryTasksByIds', () => {
  it('returns empty array without DB call when ids is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryTasksByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries tasks with .in filter', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'task-1' }], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryTasksByIds(supabase, ['task-1']);
    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.in).toHaveBeenCalledWith('id', ['task-1']);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'tasks fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryTasksByIds(supabase, ['t'])).rejects.toMatchObject({ message: 'tasks fail' });
  });
});

describe('queryMilestonesByIds', () => {
  it('returns empty array without DB call when ids is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryMilestonesByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries milestones with .in filter', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryMilestonesByIds(supabase, ['m-1']);
    expect(supabase.from).toHaveBeenCalledWith('milestones');
    expect(builder.in).toHaveBeenCalledWith('id', ['m-1']);
  });
});

describe('queryQuestsByIds', () => {
  it('returns empty array without DB call when ids is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryQuestsByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries quests with .in filter', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryQuestsByIds(supabase, ['q-1']);
    expect(supabase.from).toHaveBeenCalledWith('quests');
    expect(builder.in).toHaveBeenCalledWith('id', ['q-1']);
  });
});
