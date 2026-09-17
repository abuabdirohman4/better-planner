"use client";

import { useMemo } from "react";
import { useHabits } from "@/app/(admin)/habits/hooks/useHabits";
import { useHabitCompletions } from "@/app/(admin)/habits/hooks/useHabitCompletions";
import { useMonthlyStats } from "@/app/(admin)/habits/hooks/useMonthlyStats";
import {
  selectDailySyncHabits,
  countPendingOtherHabits,
  countScheduledOtherHabits,
} from "../utils/habitRows";

/**
 * Habits for the Daily Quest card on `date` (app-cr6i).
 * Reuses the habit hooks as-is, so mutations here refresh /habits/today too —
 * same SWR keys, one global cache.
 */
export function useDailySyncHabits(date: string) {
  const { habits, isLoading: habitsLoading } = useHabits();
  // Daily Sync owns the selected date; fall back to today in WIB, never to a UTC slice.
  const day =
    /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const {
    completions,
    isCompleted,
    toggleCompletion,
    isLoading: completionsLoading,
  } = useHabitCompletions(year, month);

  const stats = useMonthlyStats(habits, completions);

  const shownHabits = useMemo(() => selectDailySyncHabits(habits, day), [habits, day]);

  const streakOf = (habitId: string) =>
    stats.per_habit.find((s) => s.habit_id === habitId)?.current_streak ?? 0;

  return {
    date: day,
    habits: shownHabits,
    isCompleted,
    toggleCompletion,
    streakOf,
    pendingOtherCount: countPendingOtherHabits(habits, day, isCompleted),
    scheduledOtherCount: countScheduledOtherHabits(habits, day),
    isLoading: habitsLoading || completionsLoading,
  };
}
