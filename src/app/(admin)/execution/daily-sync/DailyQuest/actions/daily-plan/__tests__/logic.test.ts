// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildExistingItemsMap,
  getItemTypes,
  getItemIdsToDelete,
  extractScheduleBackups,
  buildItemsToInsert,
  remapSchedules,
} from '../logic';
import { RawDailyPlanItem, RawTaskSchedule } from '../queries';

const makeItem = (overrides: Partial<RawDailyPlanItem> = {}): RawDailyPlanItem => ({
  id: 'dpi-1',
  item_id: 'task-1',
  item_type: 'DAILY',
  status: 'TODO',
  daily_session_target: 1,
  focus_duration: 25,
  daily_plan_id: 'plan-1',
  ...overrides,
});

const makeSchedule = (overrides: Partial<RawTaskSchedule> = {}): RawTaskSchedule => ({
  scheduled_start_time: '2026-01-01T10:00:00Z',
  scheduled_end_time: '2026-01-01T10:25:00Z',
  duration_minutes: 25,
  session_count: 1,
  daily_plan_items: { item_id: 'task-1' },
  ...overrides,
});

describe('buildExistingItemsMap', () => {
  it('creates map keyed by item_id', () => {
    const items = [makeItem({ item_id: 'task-1' }), makeItem({ id: 'dpi-2', item_id: 'task-2' })];
    const map = buildExistingItemsMap(items);
    expect(map.size).toBe(2);
    expect(map.get('task-1')?.id).toBe('dpi-1');
    expect(map.get('task-2')?.id).toBe('dpi-2');
  });

  it('returns empty map for empty input', () => {
    expect(buildExistingItemsMap([])).toEqual(new Map());
  });
});

describe('getItemTypes', () => {
  it('returns unique item types', () => {
    const items = [
      { item_id: 'a', item_type: 'DAILY' },
      { item_id: 'b', item_type: 'WORK' },
      { item_id: 'c', item_type: 'DAILY' },
    ];
    const types = getItemTypes(items);
    expect(types).toHaveLength(2);
    expect(types).toContain('DAILY');
    expect(types).toContain('WORK');
  });

  it('returns empty array for empty input', () => {
    expect(getItemTypes([])).toEqual([]);
  });
});

describe('getItemIdsToDelete', () => {
  it('returns ids of items matching the given types', () => {
    const items = [
      makeItem({ id: 'dpi-1', item_type: 'DAILY' }),
      makeItem({ id: 'dpi-2', item_type: 'WORK' }),
      makeItem({ id: 'dpi-3', item_type: 'DAILY' }),
    ];
    const ids = getItemIdsToDelete(items, ['DAILY']);
    expect(ids).toEqual(['dpi-1', 'dpi-3']);
  });

  it('returns empty array when no items match', () => {
    const items = [makeItem({ item_type: 'WORK' })];
    expect(getItemIdsToDelete(items, ['DAILY'])).toEqual([]);
  });
});

describe('extractScheduleBackups', () => {
  it('extracts backup data from raw schedules', () => {
    const schedules = [
      makeSchedule({ daily_plan_items: { item_id: 'task-1' }, session_count: 2 }),
    ];
    const backups = extractScheduleBackups(schedules);
    expect(backups).toHaveLength(1);
    expect(backups[0].item_id).toBe('task-1');
    expect(backups[0].session_count).toBe(2);
  });

  it('returns empty array for empty input', () => {
    expect(extractScheduleBackups([])).toEqual([]);
  });
});

describe('buildItemsToInsert', () => {
  it('preserves existing status and session_target', () => {
    const selected = [{ item_id: 'task-1', item_type: 'DAILY' }];
    const existingMap = new Map([
      ['task-1', makeItem({ status: 'IN_PROGRESS', daily_session_target: 3, focus_duration: 30 })],
    ]);
    const items = buildItemsToInsert(selected, 'plan-1', existingMap);
    expect(items[0]).toMatchObject({
      item_id: 'task-1',
      daily_plan_id: 'plan-1',
      status: 'IN_PROGRESS',
      daily_session_target: 3,
      focus_duration: 30,
    });
  });

  it('uses defaults for new items not in existing map', () => {
    const selected = [{ item_id: 'new-task', item_type: 'WORK' }];
    const items = buildItemsToInsert(selected, 'plan-1', new Map());
    expect(items[0]).toMatchObject({
      status: 'TODO',
      daily_session_target: 1,
      focus_duration: 25,
    });
  });
});

describe('remapSchedules', () => {
  it('maps backups to new daily_plan_item_ids', () => {
    const backups = [
      { item_id: 'task-1', scheduled_start_time: 'T1', scheduled_end_time: 'T2', duration_minutes: 25, session_count: 1 },
    ];
    const newItems = [{ id: 'new-dpi-1', item_id: 'task-1' }];
    const result = remapSchedules(backups, newItems);
    expect(result).toHaveLength(1);
    expect(result[0].daily_plan_item_id).toBe('new-dpi-1');
  });

  it('skips backups with no matching new item', () => {
    const backups = [
      { item_id: 'task-DELETED', scheduled_start_time: 'T1', scheduled_end_time: 'T2', duration_minutes: 25, session_count: 1 },
    ];
    const result = remapSchedules(backups, []);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty inputs', () => {
    expect(remapSchedules([], [])).toEqual([]);
  });
});
