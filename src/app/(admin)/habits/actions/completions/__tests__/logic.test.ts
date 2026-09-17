import { describe, it, expect } from 'vitest';
import { calculateMonthlyStats, buildCompletedDates, calculateStreak, getTimeliness, firstCompletionOfDay } from '../logic';
import type { Habit, HabitCompletion } from '@/types/habit';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1', user_id: 'u', name: 'Air', description: null, category: 'kesehatan',
  frequency: 'daily', monthly_goal: 30, daily_target: 1, target_days: null,
  show_in_daily_sync: false, tracking_type: 'positive',
  target_time: null, deadline_time: null, is_archived: false, sort_order: 0, created_at: '', updated_at: '', ...over,
});
const comp = (date: string, n = 1): HabitCompletion[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${date}-${i}`, habit_id: 'h1', user_id: 'u', date, note: null, created_at: '', done_at: null }));

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
    const s = calculateMonthlyStats([habit({ daily_target: 3 })], comp('2026-04-13', 3), '2026-04-13');
    expect(s.per_habit[0].completed).toBe(1);
    expect(s.per_habit[0].current_streak).toBe(1);
  });
  it('2/3 completions → no streak, not completed', () => {
    const s = calculateMonthlyStats([habit({ daily_target: 3 })], comp('2026-04-13', 2), '2026-04-13');
    expect(s.per_habit[0].completed).toBe(0);
    expect(s.per_habit[0].current_streak).toBe(0);
  });
  it('daily_target=1 with duplicate rows still counts one day', () => {
    const s = calculateMonthlyStats([habit()], comp('2026-04-13', 2), '2026-04-13');
    expect(s.per_habit[0].completed).toBe(1);
  });
});

// --- app-w3t3: streak must survive a month boundary ---
describe('calculateStreak across months', () => {
  const range = (from: string, days: number): string[] => {
    const out: string[] = [];
    const d = new Date(from + 'T00:00:00Z');
    for (let i = 0; i < days; i++) {
      out.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  };

  it('counts a run that crosses 1 September', () => {
    // 2026-08-30, 08-31, 09-01, 09-02
    const s = calculateStreak(new Set(range('2026-08-30', 4)), '2026-09-02');
    expect(s.current_streak).toBe(4);
    expect(s.best_streak).toBe(4);
  });

  it('does not reset to 0 on the 1st of the month', () => {
    const s = calculateStreak(new Set(range('2026-07-25', 39)), '2026-09-01');
    expect(s.current_streak).toBe(39);
  });

  it('stops at the first real gap', () => {
    const dates = new Set([...range('2026-08-28', 3), ...range('2026-09-01', 2)]);
    const s = calculateStreak(dates, '2026-09-02');
    expect(s.current_streak).toBe(2); // 09-01, 09-02 only; 08-31 missing
    expect(s.best_streak).toBe(3);
  });

  it('ignores completions after today', () => {
    const s = calculateStreak(new Set(['2026-09-01', '2026-09-02', '2026-09-03']), '2026-09-02');
    expect(s.current_streak).toBe(2);
  });
});

// --- app-pizc: unscheduled days are skipped, not counted as misses ---
describe('calculateStreak with a weekly schedule', () => {
  // Mondays in Sep 2026: 07, 14, 21, 28 (2026-09-07 is a Monday)
  const isMonday = (d: string) => new Date(d + 'T00:00:00Z').getUTCDay() === 1;

  it('4 consecutive Mondays = streak 4 despite empty Tue-Sun', () => {
    const mondays = new Set(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
    const s = calculateStreak(mondays, '2026-09-28', isMonday);
    expect(s.current_streak).toBe(4);
    expect(s.best_streak).toBe(4);
  });

  it('a missed Monday still breaks the streak', () => {
    const mondays = new Set(['2026-09-07', '2026-09-21', '2026-09-28']);
    const s = calculateStreak(mondays, '2026-09-28', isMonday);
    expect(s.current_streak).toBe(2); // 09-14 missed
  });

  it('a habit with no schedule is treated as daily', () => {
    const s = calculateStreak(new Set(['2026-09-07', '2026-09-14']), '2026-09-14');
    expect(s.current_streak).toBe(1); // 09-13 missing → daily run of 1
  });
});

describe('calculateMonthlyStats with target_days', () => {
  it('weekly habit: off-schedule days neither count nor break the streak', () => {
    const weekly = habit({ frequency: 'weekly', target_days: [1], monthly_goal: 4 });
    const done = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'].flatMap(d => comp(d));
    const s = calculateMonthlyStats([weekly], done, '2026-09-28');
    expect(s.per_habit[0].completed).toBe(4);
    expect(s.per_habit[0].current_streak).toBe(4);
  });

  it('target_days null keeps the habit daily', () => {
    const s = calculateMonthlyStats([habit()], [...comp('2026-09-27'), ...comp('2026-09-28')], '2026-09-28');
    expect(s.per_habit[0].current_streak).toBe(2);
  });

  it('streakCompletions arg supplies cross-month history', () => {
    const monthWindow = ['2026-09-01', '2026-09-02'].flatMap(d => comp(d));
    const history = [...['2026-08-30', '2026-08-31'].flatMap(d => comp(d)), ...monthWindow];
    const s = calculateMonthlyStats([habit()], monthWindow, '2026-09-02', history);
    expect(s.per_habit[0].completed).toBe(2); // month window only
    expect(s.per_habit[0].current_streak).toBe(4); // full history
  });
});

describe('getTimeliness (app-r02c)', () => {
  const at = (created: string, done: string | null = null): HabitCompletion => ({
    id: 'c1', habit_id: 'h1', user_id: 'u', date: '2026-09-17', note: null,
    created_at: created, done_at: done,
  });
  // 12:15 WIB = 05:15Z, 21:00 WIB = 14:00Z
  const duhur = habit({ deadline_time: '13:00' });

  it('dicentang sebelum batas = tepat waktu', () => {
    expect(getTimeliness(duhur, at('2026-09-17T05:15:00Z'))).toBe('ontime');
  });
  it('dicentang setelah batas = telat', () => {
    expect(getTimeliness(duhur, at('2026-09-17T14:00:00Z'))).toBe('late');
  });
  it('done_at mengalahkan created_at: shalat 12:15 tapi baru centang 21:00 tetap tepat waktu', () => {
    expect(getTimeliness(duhur, at('2026-09-17T14:00:00Z', '12:15'))).toBe('ontime');
  });
  it('done_at juga bisa membuat telat walau baris dibuat pagi', () => {
    expect(getTimeliness(duhur, at('2026-09-17T05:15:00Z', '13:30'))).toBe('late');
  });
  it('tepat pada jam batas masih tepat waktu (inklusif)', () => {
    expect(getTimeliness(duhur, at('2026-09-17T00:00:00Z', '13:00'))).toBe('ontime');
  });
  it('habit tanpa deadline_time = null, tidak dinilai', () => {
    expect(getTimeliness(habit({ deadline_time: null }), at('2026-09-17T14:00:00Z'))).toBeNull();
  });
  it('belum dicentang = null', () => {
    expect(getTimeliness(duhur, undefined)).toBeNull();
  });
  it('Postgres TIME "HH:MM:SS" tetap dibandingkan benar', () => {
    expect(getTimeliness(habit({ deadline_time: '13:00:00' }), at('', '12:15:00'))).toBe('ontime');
  });
  it('Tahajud batas 04:30: dicentang 03:30 WIB (20:30Z hari sebelumnya) tepat waktu', () => {
    // batas dini hari — created_at hari sebelumnya di UTC, tapi jam WIB-nya 03:30
    expect(getTimeliness(habit({ deadline_time: '04:30' }), at('2026-09-16T20:30:00Z'))).toBe('ontime');
  });
  it('lewat tengah malam: dicentang 23:50 WIB dinilai telat terhadap batas 04:30', () => {
    expect(getTimeliness(habit({ deadline_time: '04:30' }), at('2026-09-17T16:50:00Z'))).toBe('late');
  });

  it('daily_target>1: yang dinilai baris paling awal, bukan baris terakhir', () => {
    const rows: HabitCompletion[] = [
      { ...at('2026-09-17T14:00:00Z'), id: 'late' },
      { ...at('2026-09-17T05:00:00Z'), id: 'early' },
    ];
    const first = firstCompletionOfDay(rows, 'h1', '2026-09-17');
    expect(first?.id).toBe('early');
    expect(getTimeliness(duhur, first)).toBe('ontime');
  });
});
