// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/quarterUtils', () => ({
  getQuarterDates: vi.fn().mockImplementation((year: number, quarter: number) => ({
    startDate: new Date(Date.UTC(year, (quarter - 1) * 3, 1)),
    endDate: new Date(Date.UTC(year, quarter * 3, 0, 23, 59, 59)),
    endExclusive: new Date(Date.UTC(year, quarter * 3, 1)),
  })),
  createdAtForQuarter: vi.fn().mockReturnValue('2026-10-01T00:00:00.000Z'),
  quarterOfDate: vi.fn().mockReturnValue({ year: 2026, quarter: 3 }),
}));

vi.mock('../queries', () => ({
  queryTopTasksBefore: vi.fn(),
  queryTopTasksInRange: vi.fn(),
  queryTasksByIds: vi.fn(),
  queryChildren: vi.fn(),
  insertTasks: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import {
  queryTopTasksBefore,
  queryTopTasksInRange,
  queryTasksByIds,
  queryChildren,
  insertTasks,
} from '../queries';
import { getCarryOverGroups, carryOverQuests, carryOverWorkQuests } from '../actions';

describe('getCarryOverGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws User not authenticated when user is null', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(getCarryOverGroups('DAILY_QUEST', 2026, 4)).rejects.toThrow('User not authenticated');
  });

  it('returns carry over groups when authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' } }));
    (queryTopTasksBefore as any).mockResolvedValue([
      { id: 'd1', title: 'Task 1', description: null, status: 'TODO', is_archived: false, created_at: '2026-07-01T00:00:00.000Z' },
    ]);
    (queryTopTasksInRange as any).mockResolvedValue([]);

    const groups = await getCarryOverGroups('DAILY_QUEST', 2026, 4);
    expect(groups).toHaveLength(1);
    expect(groups[0].candidates[0].id).toBe('d1');
  });
});

describe('carryOverQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 without calling createClient if ids is empty', async () => {
    const result = await carryOverQuests('DAILY_QUEST', [], 2026, 4);
    expect(result).toBe(0);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('throws error when called with WORK_QUEST', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' } }));
    await expect(carryOverQuests('WORK_QUEST', ['w1'], 2026, 4)).rejects.toThrow('Use carryOverWorkQuests');
  });

  it('copies non-work quests with status TODO and createdAtForQuarter', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' } }));
    const source = [
      { id: 't1', title: 'Side Quest 1', description: 'Desc', status: 'IN_PROGRESS', parent_task_id: null, created_at: '2026-07-01T00:00:00.000Z' },
    ];
    (queryTasksByIds as any).mockResolvedValue(source);
    (insertTasks as any).mockResolvedValue([{ id: 'new-t1' }]);

    const count = await carryOverQuests('SIDE_QUEST', ['t1'], 2026, 4);
    expect(count).toBe(1);
    expect(insertTasks).toHaveBeenCalledWith(
      expect.anything(),
      [
        {
          user_id: 'user-1',
          title: 'Side Quest 1',
          description: 'Desc',
          type: 'SIDE_QUEST',
          status: 'TODO',
          milestone_id: null,
          parent_task_id: null,
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ]
    );
  });
});

describe('carryOverWorkQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 without calling createClient if selections is empty', async () => {
    const result = await carryOverWorkQuests([], 2026, 4);
    expect(result).toBe(0);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('when target does not have project, inserts project then tasks with new project id', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' } }));

    const project = { id: 'p1', title: 'Project Alpha', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' };
    const task = { id: 't1', title: 'Task 1', description: null, status: 'TODO', parent_task_id: 'p1', created_at: '2026-07-02T00:00:00.000Z' };

    (queryTasksByIds as any).mockImplementation((_sb: any, _u: any, _type: any, ids: string[]) => {
      if (ids.includes('p1') && ids.length === 1) return Promise.resolve([project]);
      if (ids.includes('t1')) return Promise.resolve([task]);
      return Promise.resolve([]);
    });
    (queryTopTasksInRange as any).mockResolvedValue([]);
    (insertTasks as any)
      .mockResolvedValueOnce([{ id: 'new-p1' }]) // project insert
      .mockResolvedValueOnce([{ id: 'new-t1' }]); // task insert

    const count = await carryOverWorkQuests([{ projectId: 'p1', taskIds: ['t1'] }], 2026, 4);
    expect(count).toBe(2); // 1 project + 1 task

    expect(insertTasks).toHaveBeenCalledTimes(2);
    // Project insert
    expect((insertTasks as any).mock.calls[0][1][0].title).toBe('Project Alpha');
    // Task insert
    expect((insertTasks as any).mock.calls[1][1][0].title).toBe('Task 1');
    expect((insertTasks as any).mock.calls[1][1][0].parent_task_id).toBe('new-p1');
  });

  it('when target already has project with same title, adds task to existing project without creating new project', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' } }));

    const project = { id: 'p1', title: 'Project Alpha', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' };
    const task = { id: 't1', title: 'Task 1', description: null, status: 'TODO', parent_task_id: 'p1', created_at: '2026-07-02T00:00:00.000Z' };
    const targetProject = { id: 'tp1', title: '  project alpha ', description: null, status: 'TODO', created_at: '2026-10-01T00:00:00.000Z' };

    (queryTasksByIds as any).mockImplementation((_sb: any, _u: any, _type: any, ids: string[]) => {
      if (ids.includes('p1') && ids.length === 1) return Promise.resolve([project]);
      if (ids.includes('t1')) return Promise.resolve([task]);
      return Promise.resolve([]);
    });
    (queryTopTasksInRange as any).mockResolvedValue([targetProject]);
    (insertTasks as any).mockResolvedValue([{ id: 'new-t1' }]);

    const count = await carryOverWorkQuests([{ projectId: 'p1', taskIds: ['t1'] }], 2026, 4);
    expect(count).toBe(1); // 0 project (reused existing) + 1 task

    expect(insertTasks).toHaveBeenCalledTimes(1);
    expect((insertTasks as any).mock.calls[0][1][0].parent_task_id).toBe('tp1');
  });

  it('ignores tasks whose parent belongs to another project title', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' } }));

    const project = { id: 'p1', title: 'Project Alpha', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' };
    const otherProject = { id: 'p_other', title: 'Project Beta', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' };
    const task = { id: 't_rogue', title: 'Task Rogue', description: null, status: 'TODO', parent_task_id: 'p_other', created_at: '2026-07-02T00:00:00.000Z' };

    (queryTasksByIds as any).mockImplementation((_sb: any, _u: any, _type: any, ids: string[]) => {
      if (ids.includes('p1') && ids.length === 1) return Promise.resolve([project]);
      if (ids.includes('t_rogue')) return Promise.resolve([task]);
      if (ids.includes('p_other')) return Promise.resolve([otherProject]);
      return Promise.resolve([]);
    });
    (queryTopTasksInRange as any).mockResolvedValue([]);
    (insertTasks as any).mockResolvedValue([{ id: 'new-p1' }]);

    const count = await carryOverWorkQuests([{ projectId: 'p1', taskIds: ['t_rogue'] }], 2026, 4);
    expect(count).toBe(1); // 1 project, 0 rogue tasks

    expect(insertTasks).toHaveBeenCalledTimes(1);
  });
});
