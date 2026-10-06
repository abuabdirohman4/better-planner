import { describe, it, expect } from 'vitest';
import { groupRitualPillars } from '../habitRows';
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
  ritual_pillar: null,
  tracking_type: 'positive',
  target_time: null, deadline_time: null,
  is_archived: false,
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ...over,
});

/** isCompleted stub: completes every habit id listed. */
const completed = (...ids: string[]) => (habitId: string) => ids.includes(habitId);

describe('groupRitualPillars (app-70vs)', () => {
  it('always returns the 4 pillars in order, empty ones not done', () => {
    const blocks = groupRitualPillars([], MON, completed());
    expect(blocks.map((b) => b.pillar)).toEqual(['tubuh', 'pikiran', 'spiritual', 'sdc']);
    expect(blocks.every((b) => !b.isDone && b.habits.length === 0)).toBe(true);
  });

  it('groups by pillar; pillar is ticked once at least 1 of its habits is done (app-fj81)', () => {
    const habits = [
      habit({ id: 'a', ritual_pillar: 'tubuh' }),
      habit({ id: 'b', ritual_pillar: 'tubuh' }),
      habit({ id: 'c', ritual_pillar: 'sdc' }),
      habit({ id: 'd' }),
    ];
    const blocks = groupRitualPillars(habits, MON, completed('a', 'c'));
    const by = (p: string) => blocks.find((b) => b.pillar === p)!;
    expect(by('tubuh')).toMatchObject({ doneCount: 1, isDone: true });
    expect(by('sdc')).toMatchObject({ doneCount: 1, isDone: true });
    expect(by('pikiran')).toMatchObject({ doneCount: 0, isDone: false });
    expect(blocks.flatMap((b) => b.habits.map((h) => h.id)).includes('d')).toBe(false);
  });

  it('skips archived and not-scheduled habits', () => {
    const habits = [
      habit({ id: 'a', ritual_pillar: 'tubuh', is_archived: true }),
      habit({ id: 'b', ritual_pillar: 'tubuh', frequency: 'weekly', target_days: [1] }),
    ];
    expect(groupRitualPillars(habits, TUE, completed())[0].habits).toEqual([]);
    expect(groupRitualPillars(habits, MON, completed())[0].habits.map((h) => h.id)).toEqual(['b']);
  });
});
