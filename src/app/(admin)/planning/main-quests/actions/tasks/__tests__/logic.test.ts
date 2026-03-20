// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseTaskFormData, buildTaskInsertData, filterTasksNeedingOrderFix } from '../logic';

describe('parseTaskFormData', () => {
  it('parses all fields from FormData', () => {
    const fd = new FormData();
    fd.append('milestone_id', 'm1');
    fd.append('title', 'My Task');
    fd.append('parent_task_id', 'p1');
    fd.append('display_order', '3');
    const result = parseTaskFormData(fd);
    expect(result).toEqual({ milestone_id: 'm1', title: 'My Task', parent_task_id: 'p1', display_order: '3' });
  });

  it('returns null for missing optional fields', () => {
    const fd = new FormData();
    fd.append('milestone_id', 'm1');
    const result = parseTaskFormData(fd);
    expect(result.title).toBeNull();
    expect(result.parent_task_id).toBeNull();
    expect(result.display_order).toBeNull();
  });
});

describe('buildTaskInsertData', () => {
  it('builds data for regular task with display_order', () => {
    const result = buildTaskInsertData(
      { milestone_id: 'm1', title: 'T', parent_task_id: null, display_order: '2' },
      'u1'
    );
    expect(result.milestone_id).toBe('m1');
    expect(result.display_order).toBe(2);
    expect(result.type).toBe('MAIN_QUEST');
    expect(result.user_id).toBe('u1');
  });

  it('uses lastOrder + 1 when no display_order provided', () => {
    const result = buildTaskInsertData(
      { milestone_id: 'm1', title: 'T', parent_task_id: null, display_order: null, lastOrder: 4 },
      'u1'
    );
    expect(result.display_order).toBe(5);
  });

  it('sets milestone_id to null for subtask', () => {
    const result = buildTaskInsertData(
      { milestone_id: null, title: 'Sub', parent_task_id: 'parent-1', display_order: null },
      'u1'
    );
    expect(result.milestone_id).toBeNull();
    expect(result.parent_task_id).toBe('parent-1');
  });

  it('throws when no milestone_id and no parent_task_id', () => {
    expect(() => buildTaskInsertData(
      { milestone_id: null, title: 'T', parent_task_id: null, display_order: null },
      'u1'
    )).toThrow('milestone_id wajib diisi');
  });

  it('defaults display_order to 1 when lastOrder is undefined', () => {
    const result = buildTaskInsertData(
      { milestone_id: 'm1', title: 'T', parent_task_id: null, display_order: null, lastOrder: undefined },
      'u1'
    );
    expect(result.display_order).toBe(1);
  });
});

describe('filterTasksNeedingOrderFix', () => {
  it('returns tasks with null or 0 display_order', () => {
    const tasks = [
      { id: 't1', display_order: 0 },
      { id: 't2', display_order: 2 },
      { id: 't3', display_order: null },
    ];
    const result = filterTasksNeedingOrderFix(tasks);
    expect(result.map(t => t.id)).toEqual(['t1', 't3']);
  });

  it('returns empty array when all have valid orders', () => {
    const tasks = [{ id: 't1', display_order: 1 }, { id: 't2', display_order: 2 }];
    expect(filterTasksNeedingOrderFix(tasks)).toEqual([]);
  });
});
