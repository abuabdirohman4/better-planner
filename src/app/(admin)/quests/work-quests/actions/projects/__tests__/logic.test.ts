// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  toWorkQuestTask,
  toWorkQuestProject,
  buildTasksMap,
  assembleProjects,
  collectAllTaskIds,
} from '../logic';
import { RawTaskRow } from '../queries';

const makeRow = (overrides: Partial<RawTaskRow> = {}): RawTaskRow => ({
  id: 'id-1',
  parent_task_id: null,
  title: 'Test Title',
  description: null,
  status: 'TODO',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('toWorkQuestTask', () => {
  it('transforms raw row to WorkQuestTask', () => {
    const row = makeRow({ id: 'task-1', parent_task_id: 'proj-1', title: 'My Task' });
    const result = toWorkQuestTask(row);
    expect(result).toEqual({
      id: 'task-1',
      parent_task_id: 'proj-1',
      title: 'My Task',
      description: undefined,
      status: 'TODO',
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  });

  it('converts null description to undefined', () => {
    const row = makeRow({ description: null, parent_task_id: 'proj-1' });
    expect(toWorkQuestTask(row).description).toBeUndefined();
  });

  it('preserves non-null description', () => {
    const row = makeRow({ description: 'some desc', parent_task_id: 'proj-1' });
    expect(toWorkQuestTask(row).description).toBe('some desc');
  });
});

describe('toWorkQuestProject', () => {
  it('assembles project with its tasks', () => {
    const projectRow = makeRow({ id: 'proj-1', title: 'Project A' });
    const taskRows = [
      makeRow({ id: 'task-1', parent_task_id: 'proj-1', title: 'Task 1' }),
      makeRow({ id: 'task-2', parent_task_id: 'proj-1', title: 'Task 2' }),
      makeRow({ id: 'task-3', parent_task_id: 'proj-OTHER', title: 'Other Task' }),
    ];
    const result = toWorkQuestProject(projectRow, taskRows);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].id).toBe('task-1');
    expect(result.tasks[1].id).toBe('task-2');
  });

  it('returns empty tasks when no tasks belong to this project', () => {
    const projectRow = makeRow({ id: 'proj-1' });
    const result = toWorkQuestProject(projectRow, []);
    expect(result.tasks).toHaveLength(0);
  });
});

describe('buildTasksMap', () => {
  it('groups tasks by parent_task_id', () => {
    const tasks = [
      makeRow({ id: 'task-1', parent_task_id: 'proj-1' }),
      makeRow({ id: 'task-2', parent_task_id: 'proj-1' }),
      makeRow({ id: 'task-3', parent_task_id: 'proj-2' }),
    ];
    const map = buildTasksMap(tasks);
    expect(map.get('proj-1')).toHaveLength(2);
    expect(map.get('proj-2')).toHaveLength(1);
  });

  it('ignores tasks with null parent_task_id', () => {
    const tasks = [makeRow({ id: 'proj-1', parent_task_id: null })];
    const map = buildTasksMap(tasks);
    expect(map.size).toBe(0);
  });

  it('returns empty map for empty input', () => {
    expect(buildTasksMap([])).toEqual(new Map());
  });
});

describe('assembleProjects', () => {
  it('assembles multiple projects with their tasks (batch, no N+1)', () => {
    const projects = [
      makeRow({ id: 'proj-1', title: 'P1' }),
      makeRow({ id: 'proj-2', title: 'P2' }),
    ];
    const tasks = [
      makeRow({ id: 'task-1', parent_task_id: 'proj-1' }),
      makeRow({ id: 'task-2', parent_task_id: 'proj-2' }),
      makeRow({ id: 'task-3', parent_task_id: 'proj-2' }),
    ];
    const result = assembleProjects(projects, tasks);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('proj-1');
    expect(result[0].tasks).toHaveLength(1);
    expect(result[1].id).toBe('proj-2');
    expect(result[1].tasks).toHaveLength(2);
  });

  it('returns projects with empty tasks when no tasks exist', () => {
    const projects = [makeRow({ id: 'proj-1' })];
    const result = assembleProjects(projects, []);
    expect(result[0].tasks).toHaveLength(0);
  });

  it('returns empty array for empty projects input', () => {
    expect(assembleProjects([], [])).toEqual([]);
  });
});

describe('collectAllTaskIds', () => {
  it('prepends project id to task ids', () => {
    const result = collectAllTaskIds('proj-1', ['task-1', 'task-2']);
    expect(result).toEqual(['proj-1', 'task-1', 'task-2']);
  });

  it('returns array with just project id when no tasks', () => {
    expect(collectAllTaskIds('proj-1', [])).toEqual(['proj-1']);
  });
});
