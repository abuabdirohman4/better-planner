import { describe, it, expect } from 'vitest';
import { calculateMonthlyStats, buildCompletedDates } from '../logic';
import type { Habit, HabitCompletion } from '@/types/habit';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1', user_id: 'u', name: 'Air', description: null, category: 'kesehatan',
  frequency: 'daily', monthly_goal: 30, daily_target: 1, tracking_type: 'positive',
  target_time: null, is_archived: false, sort_order: 0, created_at: '', updated_at: '', ...over,
});
const comp = (date: string, n = 1): HabitCompletion[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${date}-${i}`, habit_id: 'h1', user_id: 'u', date, note: null, created_at: '' }));

describe('buildCompletedDates', () => {
  it('daily_target=1: any row counts', () => {
    expect(buildCompletedDates(comp('2026-04-01'), 1)).toEqual(new Set(['2026-04-01']));
  });
  it('daily_target=3: only days with >=3 rows count', () => {
    const rows = [...comp('2026-04-01', 3), ...comp('2026-04-02', 2)];
    expect(buildCompletedDates(rows, 3)).toEqual(new Set(['2026-04-01']));
  });
});

describe('calculateMonthlyStats with daily_target', () => {
  it('3/3 completions → streak +1 and completed +1', () => {
    const s = calculateMonthlyStats([habit({ daily_target: 3 })], comp('2026-04-13', 3), 2026, 4, '2026-04-13');
    expect(s.per_habit[0].completed).toBe(1);
    expect(s.per_habit[0].current_streak).toBe(1);
  });
  it('2/3 completions → no streak, not completed', () => {
    const s = calculateMonthlyStats([habit({ daily_target: 3 })], comp('2026-04-13', 2), 2026, 4, '2026-04-13');
    expect(s.per_habit[0].completed).toBe(0);
    expect(s.per_habit[0].current_streak).toBe(0);
  });
  it('daily_target=1 with duplicate rows still counts one day', () => {
    const s = calculateMonthlyStats([habit()], comp('2026-04-13', 2), 2026, 4, '2026-04-13');
    expect(s.per_habit[0].completed).toBe(1);
  });
});
