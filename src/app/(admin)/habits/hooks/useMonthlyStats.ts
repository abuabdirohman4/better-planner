"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { habitKeys } from "@/lib/swr";
import { getRecentCompletions } from "../actions/completions/actions";
import { calculateMonthlyStats } from "../actions/completions/logic";
import type { Habit, HabitCompletion, MonthlyStats } from "@/types/habit";

const STREAK_HISTORY_DAYS = 90;

export function useMonthlyStats(
  habits: Habit[],
  completions: HabitCompletion[]
): MonthlyStats {
  // Get today's date string "YYYY-MM-DD" in WIB timezone
  // Recalculated once per mount — components remount daily via navigation
  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }, []);

  // Streaks need history across month boundaries (app-w3t3); the month window
  // alone reset every streak on the 1st. Separate fetch, bounded to 90 days.
  const { data: streakHistory } = useSWR(
    habitKeys.recentCompletions(STREAK_HISTORY_DAYS),
    () => getRecentCompletions(STREAK_HISTORY_DAYS),
    { revalidateOnFocus: false, dedupingInterval: 30 * 1000, errorRetryCount: 2 }
  );

  return useMemo(() => {
    // Include the viewed month's rows so optimistic toggles show up immediately.
    const history = streakHistory ? [...streakHistory, ...completions] : completions;
    return calculateMonthlyStats(habits, completions, today, history);
  }, [habits, completions, today, streakHistory]);
}
