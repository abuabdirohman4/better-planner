import { describe, it, expect } from 'vitest';
import {
  isCandidate,
  buildCandidates,
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
    };
    expect(isCandidate('DAILY_QUEST', task)).toBe(true);
  });

  it('returns false for DONE side quest', () => {
    const task: SourceTask = {
      id: '3',
      title: 'Side Project',
      description: null,
      status: 'DONE',
    };
    expect(isCandidate('SIDE_QUEST', task)).toBe(false);
  });

  it('returns true for non-DONE side quest', () => {
    const task: SourceTask = {
      id: '4',
      title: 'Side Project',
      description: null,
      status: 'IN_PROGRESS',
    };
    expect(isCandidate('SIDE_QUEST', task)).toBe(true);
  });

  it('returns false for DONE work quest', () => {
    const task: SourceTask = {
      id: '5',
      title: 'Sprint 1',
      description: null,
      status: 'DONE',
    };
    expect(isCandidate('WORK_QUEST', task)).toBe(false);
  });

  it('returns true for IN_PROGRESS work quest', () => {
    const task: SourceTask = {
      id: '6',
      title: 'Sprint 2',
      description: null,
      status: 'IN_PROGRESS',
    };
    expect(isCandidate('WORK_QUEST', task)).toBe(true);
  });
});

describe('buildCandidates', () => {
  it('detects existing candidates with trimming and case-insensitivity', () => {
    const sourceTop: SourceTask[] = [
      { id: '1', title: '  Olahraga ', description: null, status: 'TODO', is_archived: false },
      { id: '2', title: 'Belajar TS', description: null, status: 'TODO', is_archived: false },
    ];
    const targetTitles = ['olahraga'];
    const candidates = buildCandidates('DAILY_QUEST', sourceTop, [], targetTitles);

    expect(candidates).toEqual([
      { id: '1', title: '  Olahraga ', detail: null, alreadyExists: true },
      { id: '2', title: 'Belajar TS', detail: null, alreadyExists: false },
    ]);
  });

  it('calculates open children count for work quests', () => {
    const sourceTop: SourceTask[] = [
      { id: 'p1', title: 'Project A', description: null, status: 'IN_PROGRESS' },
    ];
    const sourceChildren: SourceTask[] = [
      { id: 'c1', title: 'Task 1', description: null, status: 'DONE', parent_task_id: 'p1' },
      { id: 'c2', title: 'Task 2', description: null, status: 'TODO', parent_task_id: 'p1' },
      { id: 'c3', title: 'Task 3', description: null, status: 'IN_PROGRESS', parent_task_id: 'p1' },
    ];
    const candidates = buildCandidates('WORK_QUEST', sourceTop, sourceChildren, []);

    expect(candidates).toEqual([
      { id: 'p1', title: 'Project A', detail: '2 tugas belum selesai', alreadyExists: false },
    ]);
  });

  it('filters out non-candidate tasks', () => {
    const sourceTop: SourceTask[] = [
      { id: '1', title: 'Finished Side Quest', description: null, status: 'DONE' },
      { id: '2', title: 'Active Side Quest', description: null, status: 'TODO' },
    ];
    const candidates = buildCandidates('SIDE_QUEST', sourceTop, [], []);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe('2');
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
    };
    const row = buildCopyRow('WORK_QUEST', task, 'user-1', '2026-07-01T00:00:00.000Z', 'parent-123');
    expect(row.parent_task_id).toBe('parent-123');
  });
});
