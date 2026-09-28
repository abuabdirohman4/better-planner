import { describe, it, expect } from 'vitest';
import {
  isCandidate,
  latestByTitle,
  buildGroups,
  buildCopyRow,
  type SourceTask,
} from '../logic';

describe('isCandidate', () => {
  it('returns false for archived daily quest', () => {
    const task: SourceTask = {
      id: '1',
      title: 'Workout',
      description: null,
      status: 'TODO',
      is_archived: true,
      created_at: '2026-04-01T00:00:00.000Z',
    };
    expect(isCandidate('DAILY_QUEST', task)).toBe(false);
  });

  it('returns true for non-archived daily quest even if DONE', () => {
    const task: SourceTask = {
      id: '2',
      title: 'Read Book',
      description: null,
      status: 'DONE',
      is_archived: false,
      created_at: '2026-04-01T00:00:00.000Z',
    };
    expect(isCandidate('DAILY_QUEST', task)).toBe(true);
  });

  it('returns false for DONE side quest', () => {
    const task: SourceTask = {
      id: '3',
      title: 'Side Project',
      description: null,
      status: 'DONE',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    expect(isCandidate('SIDE_QUEST', task)).toBe(false);
  });

  it('returns true for non-DONE side quest', () => {
    const task: SourceTask = {
      id: '4',
      title: 'Side Project',
      description: null,
      status: 'IN_PROGRESS',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    expect(isCandidate('SIDE_QUEST', task)).toBe(true);
  });

  it('returns false for DONE work quest', () => {
    const task: SourceTask = {
      id: '5',
      title: 'Sprint 1',
      description: null,
      status: 'DONE',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    expect(isCandidate('WORK_QUEST', task)).toBe(false);
  });

  it('returns true for IN_PROGRESS work quest', () => {
    const task: SourceTask = {
      id: '6',
      title: 'Sprint 2',
      description: null,
      status: 'IN_PROGRESS',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    expect(isCandidate('WORK_QUEST', task)).toBe(true);
  });
});

describe('latestByTitle', () => {
  it('deduplicates by title taking the latest created_at', () => {
    const rows = [
      { id: '1', title: 'Olahraga', created_at: '2026-03-01T00:00:00.000Z' },
      { id: '2', title: ' olahraga ', created_at: '2026-06-01T00:00:00.000Z' },
      { id: '3', title: 'Membaca', created_at: '2026-02-01T00:00:00.000Z' },
    ];
    const result = latestByTitle(rows);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.title.trim().toLowerCase() === 'olahraga')?.id).toBe('2');
  });
});

describe('buildGroups', () => {
  const dummyQuarterOf = (iso: string) => {
    if (iso.startsWith('2025-10')) return { year: 2025, quarter: 4 };
    if (iso.startsWith('2026-04')) return { year: 2026, quarter: 2 };
    if (iso.startsWith('2026-07')) return { year: 2026, quarter: 3 };
    return { year: 2026, quarter: 1 };
  };

  it('daily: quest Q2 + copy in Q3 deduplicates to single candidate in Q3 group', () => {
    const sourceTop: SourceTask[] = [
      { id: 'd1', title: 'Lari', description: null, status: 'TODO', created_at: '2026-04-10T00:00:00.000Z' },
      { id: 'd2', title: ' lari ', description: null, status: 'TODO', created_at: '2026-07-10T00:00:00.000Z' },
    ];
    const groups = buildGroups('DAILY_QUEST', sourceTop, [], [], [], dummyQuarterOf);

    expect(groups).toHaveLength(1);
    expect(groups[0].year).toBe(2026);
    expect(groups[0].quarter).toBe(3);
    expect(groups[0].candidates).toHaveLength(1);
    expect(groups[0].candidates[0].id).toBe('d2');
  });

  it('side: DONE does not appear; title existing in target has alreadyExists: true', () => {
    const sourceTop: SourceTask[] = [
      { id: 's1', title: 'Side Done', description: null, status: 'DONE', created_at: '2026-04-01T00:00:00.000Z' },
      { id: 's2', title: 'Side Existing', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' },
      { id: 's3', title: 'Side New', description: null, status: 'IN_PROGRESS', created_at: '2026-07-02T00:00:00.000Z' },
    ];
    const targetTop: SourceTask[] = [
      { id: 'st1', title: 'side existing', description: null, status: 'TODO', created_at: '2026-10-01T00:00:00.000Z' },
    ];
    const groups = buildGroups('SIDE_QUEST', sourceTop, [], targetTop, [], dummyQuarterOf);

    expect(groups).toHaveLength(1);
    const cExisting = groups[0].candidates.find((c) => c.id === 's2');
    const cNew = groups[0].candidates.find((c) => c.id === 's3');
    const cDone = groups[0].candidates.find((c) => c.id === 's1');

    expect(cDone).toBeUndefined();
    expect(cExisting?.alreadyExists).toBe(true);
    expect(cNew?.alreadyExists).toBe(false);
  });

  it('work: combines tasks across quarters, drops DONE tasks and deduplicates children', () => {
    const sourceTop: SourceTask[] = [
      { id: 'p_q2', title: 'Project Alpha', description: null, status: 'TODO', created_at: '2026-04-01T00:00:00.000Z' },
      { id: 'p_q3', title: 'Project Alpha', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' },
    ];
    const sourceChildren: SourceTask[] = [
      { id: 't1', title: 'Task 1', description: null, status: 'TODO', parent_task_id: 'p_q2', created_at: '2026-04-02T00:00:00.000Z' },
      { id: 't2', title: 'Task 2', description: null, status: 'DONE', parent_task_id: 'p_q2', created_at: '2026-04-03T00:00:00.000Z' },
      { id: 't1_prime', title: 'Task 1', description: null, status: 'TODO', parent_task_id: 'p_q3', created_at: '2026-07-02T00:00:00.000Z' },
      { id: 't3', title: 'Task 3', description: null, status: 'TODO', parent_task_id: 'p_q3', created_at: '2026-07-03T00:00:00.000Z' },
    ];

    const groups = buildGroups('WORK_QUEST', sourceTop, sourceChildren, [], [], dummyQuarterOf);
    expect(groups).toHaveLength(1);
    expect(groups[0].candidates).toHaveLength(1);
    const candidate = groups[0].candidates[0];
    expect(candidate.id).toBe('p_q3');
    expect(candidate.children.map((c) => c.id)).toEqual(['t1_prime', 't3']);
  });

  it('work: target already has project "A" with task t3 -> candidate alreadyExists: true, child t3 alreadyExists: true, t1 false', () => {
    const sourceTop: SourceTask[] = [
      { id: 'p1', title: 'Project A', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' },
    ];
    const sourceChildren: SourceTask[] = [
      { id: 't1', title: 'Task 1', description: null, status: 'TODO', parent_task_id: 'p1', created_at: '2026-07-02T00:00:00.000Z' },
      { id: 't3', title: 'Task 3', description: null, status: 'TODO', parent_task_id: 'p1', created_at: '2026-07-03T00:00:00.000Z' },
    ];
    const targetTop: SourceTask[] = [
      { id: 'tp1', title: 'project a', description: null, status: 'TODO', created_at: '2026-10-01T00:00:00.000Z' },
    ];
    const targetChildren: SourceTask[] = [
      { id: 'tt3', title: 'task 3', description: null, status: 'TODO', parent_task_id: 'tp1', created_at: '2026-10-02T00:00:00.000Z' },
    ];

    const groups = buildGroups('WORK_QUEST', sourceTop, sourceChildren, targetTop, targetChildren, dummyQuarterOf);
    expect(groups[0].candidates).toHaveLength(1);
    const candidate = groups[0].candidates[0];
    expect(candidate.alreadyExists).toBe(true);
    expect(candidate.children.find((c) => c.id === 't3')?.alreadyExists).toBe(true);
    expect(candidate.children.find((c) => c.id === 't1')?.alreadyExists).toBe(false);
  });

  it('work: target has project "A" with ALL tasks -> candidate is omitted', () => {
    const sourceTop: SourceTask[] = [
      { id: 'p1', title: 'Project A', description: null, status: 'TODO', created_at: '2026-07-01T00:00:00.000Z' },
    ];
    const sourceChildren: SourceTask[] = [
      { id: 't1', title: 'Task 1', description: null, status: 'TODO', parent_task_id: 'p1', created_at: '2026-07-02T00:00:00.000Z' },
    ];
    const targetTop: SourceTask[] = [
      { id: 'tp1', title: 'project a', description: null, status: 'TODO', created_at: '2026-10-01T00:00:00.000Z' },
    ];
    const targetChildren: SourceTask[] = [
      { id: 'tt1', title: 'task 1', description: null, status: 'TODO', parent_task_id: 'tp1', created_at: '2026-10-02T00:00:00.000Z' },
    ];

    const groups = buildGroups('WORK_QUEST', sourceTop, sourceChildren, targetTop, targetChildren, dummyQuarterOf);
    expect(groups).toHaveLength(0);
  });

  it('orders groups newest quarter first (Q3 2026 before Q2 2026 before Q4 2025)', () => {
    const sourceTop: SourceTask[] = [
      { id: '1', title: 'Task 2025 Q4', description: null, status: 'TODO', created_at: '2025-10-15T00:00:00.000Z' },
      { id: '2', title: 'Task 2026 Q3', description: null, status: 'TODO', created_at: '2026-07-15T00:00:00.000Z' },
      { id: '3', title: 'Task 2026 Q2', description: null, status: 'TODO', created_at: '2026-04-15T00:00:00.000Z' },
    ];
    const groups = buildGroups('DAILY_QUEST', sourceTop, [], [], [], dummyQuarterOf);
    expect(groups.map((g) => `${g.year}-Q${g.quarter}`)).toEqual([
      '2026-Q3',
      '2026-Q2',
      '2025-Q4',
    ]);
  });
});

describe('buildCopyRow', () => {
  it('builds copy row for daily quest with focus_duration', () => {
    const task: SourceTask = {
      id: '1',
      title: 'Meditation',
      description: 'Morning meditation',
      status: 'DONE',
      focus_duration: 30,
      created_at: '2026-04-01T00:00:00.000Z',
    };
    const row = buildCopyRow('DAILY_QUEST', task, 'user-1', '2026-07-01T00:00:00.000Z');

    expect(row).toEqual({
      user_id: 'user-1',
      title: 'Meditation',
      description: 'Morning meditation',
      type: 'DAILY_QUEST',
      status: 'TODO',
      milestone_id: null,
      parent_task_id: null,
      created_at: '2026-07-01T00:00:00.000Z',
      focus_duration: 30,
    });
  });

  it('builds copy row for side quest without focus_duration', () => {
    const task: SourceTask = {
      id: '2',
      title: 'Read Book',
      description: null,
      status: 'IN_PROGRESS',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    const row = buildCopyRow('SIDE_QUEST', task, 'user-1', '2026-07-01T00:00:00.000Z');

    expect(row).toEqual({
      user_id: 'user-1',
      title: 'Read Book',
      description: null,
      type: 'SIDE_QUEST',
      status: 'TODO',
      milestone_id: null,
      parent_task_id: null,
      created_at: '2026-07-01T00:00:00.000Z',
    });
    expect('focus_duration' in row).toBe(false);
  });

  it('assigns parent_task_id when provided', () => {
    const task: SourceTask = {
      id: 'c1',
      title: 'Subtask',
      description: null,
      status: 'TODO',
      created_at: '2026-04-01T00:00:00.000Z',
    };
    const row = buildCopyRow('WORK_QUEST', task, 'user-1', '2026-07-01T00:00:00.000Z', 'parent-123');
    expect(row.parent_task_id).toBe('parent-123');
  });
});
