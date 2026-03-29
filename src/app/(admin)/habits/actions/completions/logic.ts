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
 * Calculate current and best streak from a set of completed dates.
 *
 * - current_streak: walk backwards from today, count consecutive days that are completed.
 *   Stops as soon as a gap is found. Only counts days up to and including today.
 * - best_streak: the longest consecutive run across all completed dates up to today.
 *
 * @param completedDates - Set of "YYYY-MM-DD" strings
 * @param today - "YYYY-MM-DD" string (upper bound)
 * @param year - year of the month window (used to scope streak to this month)
 * @param month - 1-based month (used to scope streak to this month)
 */
export function calculateStreak(
  completedDates: Set<string>,
  today: string,
  year: number,
  month: number
): StreakResult {
  // Filter to only dates in the target month and up to today
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  const monthDates = new Set<string>();
  for (const d of completedDates) {
    if (d.startsWith(monthPrefix) && d <= today) {
      monthDates.add(d);
    }
  }

  // Build sorted array of completed dates within the month
  const sorted = Array.from(monthDates).sort();

  if (sorted.length === 0) {
    return { current_streak: 0, best_streak: 0 };
  }

  // --- best_streak: longest consecutive run in sorted dates ---
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (isConsecutiveDays(prev, curr)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }

  // --- current_streak: walk backwards from today (within month scope) ---
  // Clamp today to the last day of the target month when viewing a past month
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  const effectiveToday = today <= monthEnd ? today : monthEnd;

  let current = 0;
  let cursor = effectiveToday;

  while (monthDates.has(cursor) && cursor >= sorted[0]) {
    current += 1;
    cursor = subtractOneDay(cursor);
  }

  return { current_streak: current, best_streak: best };
}

/**
 * Returns true if dateB is exactly one day after dateA.
 */
function isConsecutiveDays(dateA: string, dateB: string): boolean {
  const next = addOneDay(dateA);
  return next === dateB;
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

/**
 * Compute full monthly stats for all habits.
 */
export function calculateMonthlyStats(
  habits: Habit[],
  completions: HabitCompletion[],
  year: number,
  month: number,
  today: string
): MonthlyStats {
  // Group completions by habit_id
  const byHabit = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!byHabit.has(c.habit_id)) {
      byHabit.set(c.habit_id, new Set());
    }
    byHabit.get(c.habit_id)!.add(c.date);
  }

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
    const datesForHabit = byHabit.get(habit.id) ?? new Set<string>();
    const completed = datesForHabit.size;
    const goal = habit.monthly_goal;

    const percentage = goal > 0 ? Math.round((completed / goal) * 100) : 0;

    const { current_streak, best_streak } = calculateStreak(
      datesForHabit,
      today,
      year,
      month
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
