// app-cr6i: which habits belong in the Daily Quest card, and what the reminder line says.
// Pure — no fetching, no React. Habits never touch daily_plan_items; this is display-layer only.
import type { Habit } from '@/types/habit';
import { isScheduledOn } from '@/app/(admin)/habits/actions/habits/logic';

/** Habits shown as tickable rows in Daily Quest: opted in, active, and scheduled on `date`. */
export function selectDailySyncHabits(habits: Habit[], date: string): Habit[] {
  return habits.filter(
    (h) => h.show_in_daily_sync && !h.is_archived && isScheduledOn(h, date)
  );
}

/**
 * The other habits (not opted in) that are scheduled on `date` but still unfinished —
 * the number in "🔁 N kebiasaan lain belum selesai hari ini".
 */
export function countPendingOtherHabits(
  habits: Habit[],
  date: string,
  isCompleted: (habitId: string, date: string, dailyTarget: number) => boolean
): number {
  return habits.filter(
    (h) =>
      !h.show_in_daily_sync &&
      !h.is_archived &&
      isScheduledOn(h, date) &&
      !isCompleted(h.id, date, h.daily_target ?? 1)
  ).length;
}

/** Total "other" habits scheduled on `date`, done or not — lets the UI tell empty from all-done. */
export function countScheduledOtherHabits(habits: Habit[], date: string): number {
  return habits.filter(
    (h) => !h.show_in_daily_sync && !h.is_archived && isScheduledOn(h, date)
  ).length;
}
