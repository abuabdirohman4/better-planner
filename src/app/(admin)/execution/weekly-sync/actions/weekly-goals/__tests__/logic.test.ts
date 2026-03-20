// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildExistingStatusMap, deduplicateItems, buildGoalItemsToInsert } from '../logic';

describe('buildExistingStatusMap', () => {
  it('builds a Map from item_id → status', () => {
    const map = buildExistingStatusMap([
      { item_id: 'task-1', status: 'DONE' },
      { item_id: 'task-2', status: 'IN_PROGRESS' },
    ]);
    expect(map.get('task-1')).toBe('DONE');
    expect(map.get('task-2')).toBe('IN_PROGRESS');
  });

  it('returns empty map for empty input', () => {
    expect(buildExistingStatusMap([]).size).toBe(0);
  });

  it('last entry wins for duplicate item_ids', () => {
    const map = buildExistingStatusMap([
      { item_id: 'task-1', status: 'TODO' },
      { item_id: 'task-1', status: 'DONE' },
    ]);
    expect(map.get('task-1')).toBe('DONE');
  });
});

describe('deduplicateItems', () => {
  it('removes duplicate items by id', () => {
    const items = [
      { id: 'a', type: 'TASK' },
      { id: 'b', type: 'TASK' },
      { id: 'a', type: 'TASK' },
    ];
    expect(deduplicateItems(items)).toHaveLength(2);
  });

  it('returns same array when no duplicates', () => {
    const items = [
      { id: 'a', type: 'TASK' },
      { id: 'b', type: 'TASK' },
    ];
    expect(deduplicateItems(items)).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateItems([])).toEqual([]);
  });
});

describe('buildGoalItemsToInsert', () => {
  it('uses existing status from map', () => {
    const statusMap = new Map([['task-1', 'DONE']]);
    const result = buildGoalItemsToInsert(
      [{ id: 'task-1', type: 'TASK' }],
      'goal-1',
      statusMap
    );
    expect(result[0]).toEqual({ weekly_goal_id: 'goal-1', item_id: 'task-1', status: 'DONE' });
  });

  it('defaults to TODO when item not in status map', () => {
    const result = buildGoalItemsToInsert(
      [{ id: 'new-task', type: 'TASK' }],
      'goal-1',
      new Map()
    );
    expect(result[0].status).toBe('TODO');
  });

  it('returns empty array for empty items', () => {
    expect(buildGoalItemsToInsert([], 'goal-1', new Map())).toEqual([]);
  });
});
