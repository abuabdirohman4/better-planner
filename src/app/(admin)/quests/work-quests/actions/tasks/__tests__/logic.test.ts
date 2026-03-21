// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toWorkQuestTask } from '../logic';
import { RawTaskRow } from '../queries';

const makeRow = (overrides: Partial<RawTaskRow> = {}): RawTaskRow => ({
  id: 'task-1',
  parent_task_id: 'proj-1',
  title: 'Task Title',
  description: null,
  status: 'TODO',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('toWorkQuestTask', () => {
  it('transforms raw row to WorkQuestTask', () => {
    const row = makeRow({ id: 'task-1', parent_task_id: 'proj-1', status: 'IN_PROGRESS' });
    const result = toWorkQuestTask(row);
    expect(result.id).toBe('task-1');
    expect(result.parent_task_id).toBe('proj-1');
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.description).toBeUndefined();
  });

  it('preserves description when not null', () => {
    const row = makeRow({ description: 'some desc' });
    expect(toWorkQuestTask(row).description).toBe('some desc');
  });
});
