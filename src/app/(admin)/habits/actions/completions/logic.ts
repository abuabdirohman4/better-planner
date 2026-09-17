// NO "use server"
import type {
  Habit,
  HabitCompletion,
  HabitStats,
  MonthlyStats,
  StreakResult,
  HabitCategory,
} from '@/types/habit';
import type { RawCompletionRow } from './queries';
import { isScheduledOn } from '../habits/logic';

/**
 * Transform a raw database row into a typed HabitCompletion domain object.
 * Owned here (logic layer) so queries.ts stays thin and returns raw rows only.
 */
export function toHabitCompletion(row: RawCompletionRow): HabitCompletion {
  return {
    id: row.id,
    habit_id: row.habit_id,
    user_id: row.user_id,
    date: row.date,
    note: row.note,
    created_at: row.created_at,
  };
}

/**
 * Build a Set of "habitId:YYYY-MM-DD" strings for O(1) completion lookups.
 * Used by hooks and components to check if a habit was completed on a given date.
 */
export function buildCompletionSet(completions: HabitCompletion[]): Set<string> {
  return new Set(completions.map(c => `${c.habit_id}:${c.date}`));
}

/**
 * Dates where completion count >= dailyTarget (a day only "counts" when the target is met).
 */
export function buildCompletedDates(completions: HabitCompletion[], dailyTarget: number): Set<string> {
  const counts = new Map<string, number>();
  for (const c of completions) counts.set(c.date, (counts.get(c.date) ?? 0) + 1);
  const dates = new Set<string>();
  for (const [date, n] of counts) if (n >= Math.max(1, dailyTarget)) dates.add(date);
  return dates;
}

/**
 * Calculate current and best streak from a set of completed dates.
 *
 * Walks the real history, not a calendar month — a streak that crosses 1 Sep
 * keeps counting (app-w3t3). Days the habit is not scheduled on are skipped:
 * they neither break the run nor add to it (app-pizc).
 *
 * @param completedDates - Set of "YYYY-MM-DD" strings (all history you fetched)
 * @param today - "YYYY-MM-DD" upper bound; nothing after it is counted
 * @param isScheduled - optional; returns false for days off the habit's schedule
 */
export function calculateStreak(
  completedDates: Set<string>,
  today: string,
  isScheduled: (date: string) => boolean = () => true
): StreakResult {
  const sorted = Array.from(completedDates).filter(d => d <= today).sort();
  if (sorted.length === 0) return { current_streak: 0, best_streak: 0 };

  const done = new Set(sorted);

  // --- best_streak: longest run, walking day by day from the first completion ---
  let best = 0;
  let run = 0;
  for (let d = sorted[0]; d <= today; d = addOneDay(d)) {
    if (!isScheduled(d)) continue; // off-schedule day is neither hit nor miss
    if (done.has(d)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  // --- current_streak: walk backwards from today, skipping unscheduled days ---
  let current = 0;
  let cursor = today;
  while (cursor >= sorted[0]) {
    if (isScheduled(cursor)) {
      if (!done.has(cursor)) break;
      current += 1;
    }
    cursor = subtractOneDay(cursor);
  }

  return { current_streak: current, best_streak: best };
}

function addOneDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function subtractOneDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function groupByHabit(completions: HabitCompletion[]): Map<string, HabitCompletion[]> {
  const byHabit = new Map<string, HabitCompletion[]>();
  for (const c of completions) {
    if (!byHabit.has(c.habit_id)) byHabit.set(c.habit_id, []);
    byHabit.get(c.habit_id)!.push(c);
  }
  return byHabit;
}

function countScheduled(dates: Set<string>, habit: Habit): number {
  let n = 0;
  for (const d of dates) if (isScheduledOn(habit, d)) n += 1;
  return n;
}

/**
 * Compute full monthly stats for all habits.
 *
 * `completions` is the month window (drives completed/goal/percentage).
 * `streakCompletions` is the longer history used for streaks only — the month
 * window alone made every streak reset on the 1st (app-w3t3). Defaults to the
 * month window when no history is supplied.
 */
export function calculateMonthlyStats(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string,
  streakCompletions: HabitCompletion[] = completions
): MonthlyStats {
  // Group completions by habit_id (raw rows; daily_target applied per habit below)
  const byHabit = groupByHabit(completions);
  const streakByHabit =
    streakCompletions === completions ? byHabit : groupByHabit(streakCompletions);

  const perHabit: HabitStats[] = [];
  let totalPossible = 0;
  let totalCompleted = 0;

  // Track best streak across all habits
  let overallBestStreak = 0;
  let bestStreakHabitId = habits[0]?.id ?? '';

  // Category breakdown
  const categoryBreakdown: Partial<
    Record<HabitCategory, { completed: number; total: number; percentage: number }>
  > = {};

  for (const habit of habits) {
    const dailyTarget = habit.daily_target ?? 1;
    const datesForHabit = buildCompletedDates(byHabit.get(habit.id) ?? [], dailyTarget);
    // Only scheduled days count toward the monthly goal (app-pizc).
    const completed = countScheduled(datesForHabit, habit);
    const goal = habit.monthly_goal;

    const percentage = goal > 0 ? Math.round((completed / goal) * 100) : 0;

    const { current_streak, best_streak } = calculateStreak(
      buildCompletedDates(streakByHabit.get(habit.id) ?? [], dailyTarget),
      today,
      (date) => isScheduledOn(habit, date)
    );

    perHabit.push({
      habit_id: habit.id,
      completed,
      goal,
      percentage,
      current_streak,
      best_streak,
    });

    totalPossible += goal;
    totalCompleted += completed;

    if (best_streak > overallBestStreak) {
      overallBestStreak = best_streak;
      bestStreakHabitId = habit.id;
    }

    // Category breakdown
    const cat = habit.category;
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { completed: 0, total: 0, percentage: 0 };
    }
    const catEntry = categoryBreakdown[cat]!;
    catEntry.completed += completed;
    catEntry.total += goal;
    catEntry.percentage =
      catEntry.total > 0 ? Math.round((catEntry.completed / catEntry.total) * 100) : 0;
  }

  const overall_percentage =
    totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return {
    total_possible: totalPossible,
    total_completed: totalCompleted,
    overall_percentage,
    best_streak: overallBestStreak,
    best_streak_habit_id: bestStreakHabitId,
    per_habit: perHabit,
    category_breakdown: categoryBreakdown,
  };
}
