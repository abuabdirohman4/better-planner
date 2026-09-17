"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { habitKeys, notifyHabitsChanged } from "@/lib/swr";
import {
  getCompletionsForMonth,
  toggleCompletion as toggleCompletionAction,
  adjustCompletion as adjustCompletionAction,
  setCompletionDoneAt as setCompletionDoneAtAction,
} from "../actions/completions/actions";
import { firstCompletionOfDay } from "../actions/completions/logic";
import type { HabitCompletion } from "@/types/habit";

export function useHabitCompletions(year: number, month: number) {
  const {
    data: completions = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    habitKeys.completionsForMonth(year, month),
    () => getCompletionsForMonth(year, month),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 1000,
      errorRetryCount: 2,
    }
  );

  // habitId:date -> completion count
  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of completions) {
      const k = `${c.habit_id}:${c.date}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [completions]);

  const getCount = (habitId: string, date: string): number => countMap.get(`${habitId}:${date}`) ?? 0;

  const isCompleted = (habitId: string, date: string, dailyTarget = 1): boolean =>
    getCount(habitId, date) >= Math.max(1, dailyTarget);

  const toggleCompletion = async (habitId: string, date: string): Promise<void> => {
    const alreadyCompleted = getCount(habitId, date) > 0;

    // Optimistic update
    mutate((currentData) => {
      const current = currentData ?? [];
      if (alreadyCompleted) {
        // Remove the completion
        return current.filter((c) => !(c.habit_id === habitId && c.date === date));
      } else {
        // Add a temporary optimistic completion
        const optimistic: HabitCompletion = {
          id: 'optimistic',
          habit_id: habitId,
          user_id: '',
          date,
          note: null,
          created_at: new Date().toISOString(),
          done_at: null,
        };
        return [...current, optimistic];
      }
    }, false);

    try {
      await toggleCompletionAction(habitId, date);
      // Revalidate every habit reader, not just this month's key — Daily Sync and
      // /habits/today must stay in step in both directions (app-cr6i).
      await notifyHabitsChanged();
    } catch (err) {
      console.error("Failed to toggle completion:", err);
      // Revalidate to restore correct state
      await mutate();
      throw err;
    }
  };

  /** Multi-completion +1 / -1 with optimistic cache update. */
  const adjustCompletion = async (habitId: string, date: string, delta: 1 | -1): Promise<void> => {
    if (delta < 0 && getCount(habitId, date) === 0) return;

    mutate((currentData) => {
      const current = currentData ?? [];
      if (delta > 0) {
        return [...current, { id: `opt-${Date.now()}`, habit_id: habitId, user_id: '', date, note: null, created_at: new Date().toISOString(), done_at: null }];
      }
      // remove the last matching row
      const idx = current.map((c) => c.habit_id === habitId && c.date === date).lastIndexOf(true);
      return idx === -1 ? current : [...current.slice(0, idx), ...current.slice(idx + 1)];
    }, false);

    try {
      await adjustCompletionAction(habitId, date, delta);
      await notifyHabitsChanged();
    } catch (err) {
      console.error("Failed to adjust completion:", err);
      await mutate();
      throw err;
    }
  };

  /** Baris yang dinilai untuk hari itu — yang pertama dikerjakan (app-r02c). */
  const getScoredCompletion = (habitId: string, date: string): HabitCompletion | undefined =>
    firstCompletionOfDay(completions, habitId, date);

  /** Koreksi jam dikerjakan pada baris itu. `time` "HH:MM" atau null untuk kembali ke created_at. */
  const setDoneAt = async (completionId: string, time: string | null): Promise<void> => {
    mutate(
      (currentData) =>
        (currentData ?? []).map((c) => (c.id === completionId ? { ...c, done_at: time } : c)),
      false
    );
    try {
      await setCompletionDoneAtAction(completionId, time);
      await notifyHabitsChanged();
    } catch (err) {
      console.error("Failed to set done_at:", err);
      await mutate();
      throw err;
    }
  };

  return {
    completions,
    isLoading,
    getScoredCompletion,
    setDoneAt,
    error: error?.message as string | undefined,
    toggleCompletion,
    adjustCompletion,
    getCount,
    isCompleted,
    mutate,
  };
}
