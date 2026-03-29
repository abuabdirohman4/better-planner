"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { habitKeys } from "@/lib/swr";
import { getCompletionsForMonth, toggleCompletion as toggleCompletionAction } from "../actions/completions/actions";
import { buildCompletionSet } from "../actions/completions/logic";
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

  const completionSet = useMemo(() => buildCompletionSet(completions), [completions]);

  const isCompleted = (habitId: string, date: string): boolean => {
    return completionSet.has(`${habitId}:${date}`);
  };

  const toggleCompletion = async (habitId: string, date: string): Promise<void> => {
    const key = `${habitId}:${date}`;
    const alreadyCompleted = completionSet.has(key);

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
        };
        return [...current, optimistic];
      }
    }, false);

    try {
      await toggleCompletionAction(habitId, date);
      // Revalidate from server after successful mutation
      await mutate();
    } catch (err) {
      console.error("Failed to toggle completion:", err);
      // Revalidate to restore correct state
      await mutate();
      throw err;
    }
  };

  return {
    completions,
    isLoading,
    error: error?.message as string | undefined,
    toggleCompletion,
    isCompleted,
    mutate,
  };
}
