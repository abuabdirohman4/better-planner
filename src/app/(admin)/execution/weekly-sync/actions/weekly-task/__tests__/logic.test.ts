// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildTitleMap, resolveWeekDate } from '../logic';

describe('buildTitleMap', () => {
  it('builds a Record<id, title> from tasks array', () => {
    const tasks = [
      { id: 'task-1', title: 'Task One' },
      { id: 'task-2', title: 'Task Two' },
    ];
    expect(buildTitleMap(tasks)).toEqual({ 'task-1': 'Task One', 'task-2': 'Task Two' });
  });

  it('returns empty object for empty array', () => {
    expect(buildTitleMap([])).toEqual({});
  });
});

describe('resolveWeekDate', () => {
  afterEach(() => vi.useRealTimers());

  it('returns provided weekDate when given', () => {
    expect(resolveWeekDate('2026-03-20')).toBe('2026-03-20');
  });

  it('returns today ISO date when weekDate is undefined', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T10:00:00Z'));
    expect(resolveWeekDate(undefined)).toBe('2026-03-20');
  });
});
