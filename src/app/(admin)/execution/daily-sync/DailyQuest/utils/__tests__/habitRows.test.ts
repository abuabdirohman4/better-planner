import { describe, it, expect } from 'vitest';
import {
  selectDailySyncHabits,
  countPendingOtherHabits,
  countScheduledOtherHabits,
} from '../habitRows';
import type { Habit } from '@/types/habit';

// 2026-09-07 is a Monday, 2026-09-08 a Tuesday.
const MON = '2026-09-07';
const TUE = '2026-09-08';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  user_id: 'u',
  name: 'Update Finance',
  description: null,
  category: 'keuangan',
  frequency: 'daily',
  monthly_goal: 30,
  daily_target: 1,
  target_days: null,
  show_in_daily_sync: false,
  tracking_type: 'positive',
  target_time: null,
  is_archived: false,
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ...over,
});

/** isCompleted stub: completes every habit id listed. */
const completed = (...ids: string[]) => (habitId: string) => ids.includes(habitId);

describe('selectDailySyncHabits', () => {
  it('only picks habits flagged show_in_daily_sync', () => {
    const habits = [
      habit({ id: 'a', show_in_daily_sync: true }),
      habit({ id: 'b', show_in_daily_sync: false }),
    ];
    expect(selectDailySyncHabits(habits, MON).map(h => h.id)).toEqual(['a']);
  });

  it('skips archived habits even when flagged', () => {
    const habits = [habit({ id: 'a', show_in_daily_sync: true, is_archived: true })];
    expect(selectDailySyncHabits(habits, MON)).toEqual([]);
  });

  it('respects target_days — a Monday habit is absent on Tuesday', () => {
    const habits = [habit({ id: 'a', show_in_daily_sync: true, target_days: [1] })];
    expect(selectDailySyncHabits(habits, MON).map(h => h.id)).toEqual(['a']);
    expect(selectDailySyncHabits(habits, TUE)).toEqual([]);
  });

  it('null target_days means every day', () => {
    const habits = [habit({ id: 'a', show_in_daily_sync: true, target_days: null })];
    expect(selectDailySyncHabits(habits, TUE).map(h => h.id)).toEqual(['a']);
  });
});

describe('countPendingOtherHabits', () => {
  it('counts only unflagged, scheduled, unfinished habits', () => {
    const habits = [
      habit({ id: 'shown', show_in_daily_sync: true }), // flagged -> has its own row
      habit({ id: 'done' }), // unflagged but finished
      habit({ id: 'pending' }), // unflagged and unfinished -> counted
      habit({ id: 'offday', target_days: [1] }), // not scheduled on Tuesday
      habit({ id: 'archived', is_archived: true }),
    ];
    expect(countPendingOtherHabits(habits, TUE, completed('done'))).toBe(1);
  });

  it('is zero once every other habit is done', () => {
    const habits = [habit({ id: 'a' }), habit({ id: 'b' })];
    expect(countPendingOtherHabits(habits, MON, completed('a', 'b'))).toBe(0);
  });

  it('honours daily_target when asking if a habit is complete', () => {
    const habits = [habit({ id: 'a', daily_target: 5 })];
    const seenTargets: number[] = [];
    countPendingOtherHabits(habits, MON, (_id, _d, target) => {
      seenTargets.push(target);
      return false;
    });
    expect(seenTargets).toEqual([5]);
  });
});

describe('countScheduledOtherHabits', () => {
  it('counts unflagged scheduled habits whether done or not', () => {
    const habits = [
      habit({ id: 'shown', show_in_daily_sync: true }),
      habit({ id: 'a' }),
      habit({ id: 'b' }),
      habit({ id: 'offday', target_days: [1] }),
    ];
    expect(countScheduledOtherHabits(habits, TUE)).toBe(2);
  });

  it('is zero when there are no other habits — the reminder line hides', () => {
    expect(countScheduledOtherHabits([habit({ show_in_daily_sync: true })], MON)).toBe(0);
  });
});
