"use client";

import { useHabits } from "@/app/(admin)/habits/hooks/useHabits";
import { useHabitCompletions } from "@/app/(admin)/habits/hooks/useHabitCompletions";
import { groupRitualPillars } from "../utils/habitRows";

/**
 * Habit ritual pagi untuk Daily Sync pada `date`. Memakai hook habit yang sama dengan
 * /habits/today (SWR key sama), jadi centang di sini ikut statistik Habit Tracker.
 */
export function useDailySyncHabits(date: string) {
  const { habits, isLoading: habitsLoading } = useHabits();
  // Daily Sync owns the selected date; fall back to today in WIB, never to a UTC slice.
  const day =
    /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { isCompleted, toggleCompletion, isLoading: completionsLoading } = useHabitCompletions(
    Number(day.slice(0, 4)),
    Number(day.slice(5, 7))
  );

  return {
    date: day,
    pillars: groupRitualPillars(habits, day, isCompleted),
    isCompleted,
    toggleCompletion,
    isLoading: habitsLoading || completionsLoading,
  };
}
