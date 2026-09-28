// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/quarterUtils', () => ({
  getQuarterDates: vi.fn().mockImplementation((year: number, quarter: number) => ({
    startDate: new Date(Date.UTC(year, (quarter - 1) * 3, 1)),
    endDate: new Date(Date.UTC(year, quarter * 3, 0, 23, 59, 59)),
  })),
  getPrevQuarter: vi.fn().mockReturnValue({ year: 2026, quarter: 3 }),
  createdAtForQuarter: vi.fn().mockReturnValue('2026-10-01T00:00:00.000Z'),
}));

import { createClient } from '@/lib/supabase/server';
import { getCarryOverCandidates, carryOverQuests } from '../actions';

describe('getCarryOverCandidates', () => {
  it('throws User not authenticated when user is null', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(getCarryOverCandidates('DAILY_QUEST', 2026, 4)).rejects.toThrow('User not authenticated');
  });

  it('returns carry over candidates when authenticated', async () => {
    const sourceRows = [
      { id: 't1', title: 'Task 1', description: null, status: 'TODO', is_archived: false, focus_duration: 25, parent_task_id: null },
    ];
    const targetRows: any[] = [];

    let callCount = 0;
    const builder = makeQueryBuilder();
    builder.then = vi.fn().mockImplementation((resolve) => {
      callCount++;
      // call 1: source top tasks, call 2: target top tasks
      return Promise.resolve({ data: callCount === 1 ? sourceRows : targetRows, error: null }).then(resolve);
    });

    (createClient as any).mockResolvedValue(makeSupabase({
      user: { id: 'user-1' },
      fromBuilder: builder,
    }));

    const candidates = await getCarryOverCandidates('DAILY_QUEST', 2026, 4);
    expect(candidates).toEqual([
      { id: 't1', title: 'Task 1', detail: null, alreadyExists: false },
    ]);
  });
});

describe('carryOverQuests', () => {
  it('returns 0 without calling createClient if ids is empty', async () => {
    vi.clearAllMocks();
    const result = await carryOverQuests('DAILY_QUEST', [], 2026, 4);
    expect(result).toBe(0);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('copies non-work quests with status TODO and createdAtForQuarter', async () => {
    const source = [
      { id: 't1', title: 'Side Quest 1', description: 'Desc', status: 'IN_PROGRESS', parent_task_id: null },
    ];

    const selectBuilder = makeQueryBuilder({ data: source, error: null });
    const insertBuilder = makeQueryBuilder({ data: [{ id: 'new-t1' }], error: null });

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation((table: string) => {
        return selectBuilder;
      }),
    };
    (createClient as any).mockResolvedValue(supabase);

    // Mock insert specifically
    selectBuilder.insert = vi.fn().mockReturnValue(insertBuilder);

    const count = await carryOverQuests('SIDE_QUEST', ['t1'], 2026, 4);
    expect(count).toBe(1);
    expect(selectBuilder.insert).toHaveBeenCalledWith([
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
    ]);
  });

  it('copies work quests with their open children', async () => {
    const project = { id: 'p1', title: 'Project 1', description: null, status: 'IN_PROGRESS', parent_task_id: null };
    const children = [
      { id: 'c1', title: 'Child Done', description: null, status: 'DONE', parent_task_id: 'p1' },
      { id: 'c2', title: 'Child Open', description: null, status: 'TODO', parent_task_id: 'p1' },
    ];

    let selectCalls = 0;
    const queryBuilder = makeQueryBuilder();
    queryBuilder.then = vi.fn().mockImplementation((resolve) => {
      selectCalls++;
      // 1st select: queryTasksByIds -> [project]
      // 2nd select: queryChildren -> children
      return Promise.resolve({ data: selectCalls === 1 ? [project] : children, error: null }).then(resolve);
    });

    let insertCalls: any[] = [];
    queryBuilder.insert = vi.fn().mockImplementation((rows) => {
      insertCalls.push(rows);
      return makeQueryBuilder({ data: [{ id: 'new-p1' }], error: null });
    });

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    (createClient as any).mockResolvedValue(supabase);

    const count = await carryOverQuests('WORK_QUEST', ['p1'], 2026, 4);
    expect(count).toBe(1);
    expect(insertCalls.length).toBe(2);
    // First insert is the parent project
    expect(insertCalls[0][0].title).toBe('Project 1');
    // Second insert is open children only
    expect(insertCalls[1].length).toBe(1);
    expect(insertCalls[1][0].title).toBe('Child Open');
    expect(insertCalls[1][0].parent_task_id).toBe('new-p1');
  });
});
