"use client";

import { useMemo } from "react";
import { calculateMonthlyStats } from "../actions/completions/logic";
import type { Habit, HabitCompletion, MonthlyStats } from "@/types/habit";

export function useMonthlyStats(
  habits: Habit[],
  completions: HabitCompletion[],
  year: number,
  month: number
): MonthlyStats {
  // Get today's date string "YYYY-MM-DD" in WIB timezone
  // Recalculated once per mount — components remount daily via navigation
  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }, []);

  return useMemo(() => {
    return calculateMonthlyStats(habits, completions, year, month, today);
  }, [habits, completions, year, month, today]);
}
