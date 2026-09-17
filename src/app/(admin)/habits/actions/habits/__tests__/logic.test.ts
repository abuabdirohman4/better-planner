import { describe, it, expect } from 'vitest';
import { isScheduledOn, parseHabitFormInput, toHabit } from '../logic';
import type { RawHabitRow } from '../queries';

const sched = (target_days: number[] | null) => ({ target_days });

// 2026-09-07 is a Monday, 2026-09-08 a Tuesday, 2026-09-13 a Sunday.
describe('isScheduledOn', () => {
  it('null target_days = every day (legacy habits keep showing daily)', () => {
    expect(isScheduledOn(sched(null), '2026-09-07')).toBe(true);
    expect(isScheduledOn(sched(null), '2026-09-08')).toBe(true);
  });

  it('empty target_days = every day', () => {
    expect(isScheduledOn(sched([]), '2026-09-08')).toBe(true);
  });

  it('matches only the selected weekdays', () => {
    const mondayAndThursday = sched([1, 4]);
    expect(isScheduledOn(mondayAndThursday, '2026-09-07')).toBe(true); // Mon
    expect(isScheduledOn(mondayAndThursday, '2026-09-08')).toBe(false); // Tue
    expect(isScheduledOn(mondayAndThursday, '2026-09-10')).toBe(true); // Thu
  });

  it('0 means Sunday', () => {
    expect(isScheduledOn(sched([0]), '2026-09-13')).toBe(true);
    expect(isScheduledOn(sched([0]), '2026-09-14')).toBe(false);
  });
});

const rawRow = (over: Partial<RawHabitRow> = {}): RawHabitRow => ({
  id: 'h1', user_id: 'u', name: 'Ngaji', description: null, category: 'spiritual',
  frequency: 'weekly', monthly_goal: 4, daily_target: 1, target_days: [1, 4],
  show_in_daily_sync: false, tracking_type: 'positive', target_time: null, is_archived: false, sort_order: 0,
  created_at: '', updated_at: '', ...over,
});

describe('toHabit', () => {
  it('maps target_days through', () => {
    expect(toHabit(rawRow()).target_days).toEqual([1, 4]);
  });
  it('missing column becomes null, not undefined', () => {
    expect(toHabit(rawRow({ target_days: null })).target_days).toBeNull();
  });
  // app-cr6i: rows written before the column existed must not read as "show me".
  it('show_in_daily_sync defaults to false when the column is absent', () => {
    expect(toHabit(rawRow({ show_in_daily_sync: undefined as never })).show_in_daily_sync).toBe(false);
    expect(toHabit(rawRow({ show_in_daily_sync: true })).show_in_daily_sync).toBe(true);
  });
});

const form = (over: Record<string, unknown> = {}) => ({
  name: 'Ngaji', category: 'spiritual', frequency: 'weekly',
  monthly_goal: 4, tracking_type: 'positive', ...over,
});

describe('parseHabitFormInput target_days', () => {
  it('sorts and dedupes', () => {
    expect(parseHabitFormInput(form({ target_days: [4, 1, 4] })).target_days).toEqual([1, 4]);
  });

  it('rejects a weekly habit with no day selected', () => {
    expect(() => parseHabitFormInput(form({ target_days: [] }))).toThrow(/at least one target day/);
    expect(() => parseHabitFormInput(form())).toThrow(/at least one target day/);
  });

  it('rejects out-of-range days', () => {
    expect(() => parseHabitFormInput(form({ target_days: [7] }))).toThrow(/0-6/);
  });

  it('daily habits need no target_days', () => {
    expect(parseHabitFormInput(form({ frequency: 'daily' })).target_days).toBeUndefined();
  });
});

describe('parseHabitFormInput show_in_daily_sync', () => {
  it('passes the flag through', () => {
    expect(parseHabitFormInput(form({ frequency: 'daily', show_in_daily_sync: true })).show_in_daily_sync).toBe(true);
    expect(parseHabitFormInput(form({ frequency: 'daily', show_in_daily_sync: false })).show_in_daily_sync).toBe(false);
  });

  it('stays undefined when not supplied, so updates never clear it by accident', () => {
    expect(parseHabitFormInput(form({ frequency: 'daily' })).show_in_daily_sync).toBeUndefined();
  });
});
