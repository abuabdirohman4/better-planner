// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildEmptyWeeks,
  buildWeekGoalsMap,
  buildGoalItemsMap,
  calculateWeekProgress,
  buildProgressData,
} from '../logic';

describe('buildEmptyWeeks', () => {
  it('returns array of correct length', () => {
    const result = buildEmptyWeeks(3);
    expect(result).toHaveLength(3);
  });

  it('sets weekNumber starting from 1', () => {
    const result = buildEmptyWeeks(2);
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(2);
  });

  it('sets weekLabel as W{n}', () => {
    const result = buildEmptyWeeks(2);
    expect(result[0].weekLabel).toBe('W1');
    expect(result[1].weekLabel).toBe('W2');
  });

  it('sets total, completed, percentage to 0', () => {
    const result = buildEmptyWeeks(1);
    expect(result[0]).toMatchObject({ total: 0, completed: 0, percentage: 0 });
  });
});

describe('buildWeekGoalsMap', () => {
  it('groups goal ids by week_number', () => {
    const goals = [
      { id: 'g1', week_number: 1 },
      { id: 'g2', week_number: 1 },
      { id: 'g3', week_number: 2 },
    ];
    const map = buildWeekGoalsMap(goals);
    expect(map.get(1)).toEqual(['g1', 'g2']);
    expect(map.get(2)).toEqual(['g3']);
  });

  it('returns empty map for empty input', () => {
    const map = buildWeekGoalsMap([]);
    expect(map.size).toBe(0);
  });
});

describe('buildGoalItemsMap', () => {
  it('groups items by weekly_goal_id', () => {
    const items = [
      { weekly_goal_id: 'g1', status: 'DONE' },
      { weekly_goal_id: 'g1', status: 'TODO' },
      { weekly_goal_id: 'g2', status: 'DONE' },
    ];
    const map = buildGoalItemsMap(items);
    expect(map.get('g1')).toHaveLength(2);
    expect(map.get('g2')).toHaveLength(1);
  });

  it('returns empty map for empty input', () => {
    const map = buildGoalItemsMap([]);
    expect(map.size).toBe(0);
  });
});

describe('calculateWeekProgress', () => {
  it('returns zeros when goalIds is empty', () => {
    const result = calculateWeekProgress([], new Map());
    expect(result).toEqual({ total: 0, completed: 0, percentage: 0 });
  });

  it('calculates correct percentage averaging per-goal percentages', () => {
    // Goal 1: 5/10 = 50%, Goal 2: 18/20 = 90% → avg = 70%
    const items1 = Array.from({ length: 10 }, (_, i) => ({
      weekly_goal_id: 'g1',
      status: i < 5 ? 'DONE' : 'TODO',
    }));
    const items2 = Array.from({ length: 20 }, (_, i) => ({
      weekly_goal_id: 'g2',
      status: i < 18 ? 'DONE' : 'TODO',
    }));
    const map = new Map([['g1', items1], ['g2', items2]]);
    const result = calculateWeekProgress(['g1', 'g2'], map);
    expect(result.percentage).toBe(70);
    expect(result.total).toBe(30);
    expect(result.completed).toBe(23);
  });

  it('treats missing status as TODO', () => {
    const items = [{ weekly_goal_id: 'g1', status: null }, { weekly_goal_id: 'g1', status: 'DONE' }];
    const map = new Map([['g1', items]]);
    const result = calculateWeekProgress(['g1'], map);
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(50);
  });

  it('skips goals with no items', () => {
    const map = new Map([['g1', []]]);
    const result = calculateWeekProgress(['g1'], map);
    expect(result).toEqual({ total: 0, completed: 0, percentage: 0 });
  });
});

describe('buildProgressData', () => {
  it('builds one entry per week', () => {
    const weekGoalsMap = new Map<number, string[]>();
    const goalItemsMap = new Map<string, any[]>();
    const result = buildProgressData(3, weekGoalsMap, goalItemsMap);
    expect(result).toHaveLength(3);
  });

  it('correctly populates data for week with goals', () => {
    const weekGoalsMap = new Map([[1, ['g1']]]);
    const goalItemsMap = new Map([['g1', [
      { weekly_goal_id: 'g1', status: 'DONE' },
      { weekly_goal_id: 'g1', status: 'TODO' },
    ]]]);
    const result = buildProgressData(1, weekGoalsMap, goalItemsMap);
    expect(result[0].total).toBe(2);
    expect(result[0].completed).toBe(1);
    expect(result[0].percentage).toBe(50);
    expect(result[0].weekLabel).toBe('W1');
  });

  it('returns zero data for weeks with no goals', () => {
    const result = buildProgressData(2, new Map(), new Map());
    expect(result[0]).toMatchObject({ total: 0, completed: 0, percentage: 0 });
    expect(result[1]).toMatchObject({ total: 0, completed: 0, percentage: 0 });
  });
});
