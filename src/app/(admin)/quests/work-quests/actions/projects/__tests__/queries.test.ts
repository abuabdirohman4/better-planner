// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryProjectsByQuarter,
  queryTasksByProjectIds,
  queryProjectById,
  insertProject,
  updateProjectTitle,
  updateProjectStatus,
  deleteProjectById,
  deleteTasksByProjectId,
  queryTimerSessionIdsByTaskIds,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskIds,
  deleteActivityLogsByTaskIds,
  deleteDailyPlanItemsByTaskIds,
} from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryProjectsByQuarter', () => {
  it('queries tasks table with correct filters', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryProjectsByQuarter(supabase, 'user-1', new Date('2026-01-01'), new Date('2026-03-31'));
    expect(supabase.from).toHaveBeenCalledWith('tasks');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('type', 'WORK_QUEST');
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryProjectsByQuarter(supabase, 'user-1', new Date(), new Date());
    expect(result).toEqual([]);
  });

  it('throws when supabase returns error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'DB error' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryProjectsByQuarter(supabase, 'user-1', new Date(), new Date())).rejects.toMatchObject({ message: 'DB error' });
  });
});

describe('queryTasksByProjectIds', () => {
  it('returns empty array immediately when projectIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryTasksByProjectIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries with .in filter on parent_task_id', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'task-1' }], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryTasksByProjectIds(supabase, ['proj-1', 'proj-2']);
    expect(builder.in).toHaveBeenCalledWith('parent_task_id', ['proj-1', 'proj-2']);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryTasksByProjectIds(supabase, ['proj-1'])).rejects.toMatchObject({ message: 'fail' });
  });
});

describe('queryProjectById', () => {
  it('calls .single() and returns data', async () => {
    const row = { id: 'proj-1', title: 'Test' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryProjectById(supabase, 'user-1', 'proj-1');
    expect(result).toEqual(row);
    expect(builder.single).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryProjectById(supabase, 'user-1', 'proj-x')).rejects.toMatchObject({ message: 'not found' });
  });
});

describe('insertProject', () => {
  it('inserts with correct payload and returns data', async () => {
    const row = { id: 'new-proj', title: 'My Project' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await insertProject(supabase, 'user-1', 'My Project');
    expect(result).toEqual(row);
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      title: 'My Project',
      type: 'WORK_QUEST',
      status: 'TODO',
      parent_task_id: null,
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(insertProject(supabase, 'user-1', 'title')).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('updateProjectTitle', () => {
  it('updates tasks table with correct filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await updateProjectTitle(supabase, 'user-1', 'proj-1', 'New Title');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'proj-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(updateProjectTitle(supabase, 'user-1', 'proj-1', 'T')).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('updateProjectStatus', () => {
  it('updates status field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await updateProjectStatus(supabase, 'user-1', 'proj-1', 'DONE');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'DONE' }));
  });
});

describe('deleteProjectById', () => {
  it('deletes from tasks with correct filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteProjectById(supabase, 'user-1', 'proj-1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'proj-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});

describe('deleteTasksByProjectId', () => {
  it('deletes tasks by parent_task_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteTasksByProjectId(supabase, 'user-1', 'proj-1');
    expect(builder.eq).toHaveBeenCalledWith('parent_task_id', 'proj-1');
  });
});

describe('queryTimerSessionIdsByTaskIds', () => {
  it('returns empty array when taskIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    const result = await queryTimerSessionIdsByTaskIds(supabase, 'user-1', []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns mapped IDs from data', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'sess-1' }, { id: 'sess-2' }], error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryTimerSessionIdsByTaskIds(supabase, 'user-1', ['task-1']);
    expect(result).toEqual(['sess-1', 'sess-2']);
  });
});

describe('deleteTimerEventsBySessionIds', () => {
  it('skips DB call when sessionIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await deleteTimerEventsBySessionIds(supabase, []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('deletes from timer_events with .in filter', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteTimerEventsBySessionIds(supabase, ['sess-1']);
    expect(supabase.from).toHaveBeenCalledWith('timer_events');
    expect(builder.in).toHaveBeenCalledWith('session_id', ['sess-1']);
  });
});

describe('deleteTimerSessionsByTaskIds', () => {
  it('skips DB call when taskIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await deleteTimerSessionsByTaskIds(supabase, 'user-1', []);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('deleteActivityLogsByTaskIds', () => {
  it('skips DB call when taskIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await deleteActivityLogsByTaskIds(supabase, 'user-1', []);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('deleteDailyPlanItemsByTaskIds', () => {
  it('skips DB call when taskIds is empty', async () => {
    const supabase = makeSupabaseFrom(makeQueryBuilder());
    await deleteDailyPlanItemsByTaskIds(supabase, []);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('deletes from daily_plan_items with .in filter on item_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteDailyPlanItemsByTaskIds(supabase, ['task-1', 'task-2']);
    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.in).toHaveBeenCalledWith('item_id', ['task-1', 'task-2']);
  });
});
