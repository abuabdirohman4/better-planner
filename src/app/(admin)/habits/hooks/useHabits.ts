"use client";

import useSWR from "swr";
import { habitKeys } from "@/lib/swr";
import {
  getHabits,
  addHabit as addHabitAction,
  updateHabit as updateHabitAction,
  archiveHabit as archiveHabitAction,
  deleteHabit as deleteHabitAction,
} from "../actions/habits/actions";
import type { Habit, HabitFormInput } from "@/types/habit";

export function useHabits(includeArchived = false) {
  const {
    data: habits = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    habitKeys.list(includeArchived),
    () => getHabits(includeArchived),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
      errorRetryCount: 2,
    }
  );

  const addHabit = async (input: HabitFormInput): Promise<Habit> => {
    try {
      const newHabit = await addHabitAction(input);
      mutate((currentData) => [newHabit, ...(currentData ?? [])], false);
      return newHabit;
    } catch (err) {
      console.error("Failed to add habit:", err);
      await mutate();
      throw err;
    }
  };

  const updateHabit = async (
    habitId: string,
    updates: Partial<HabitFormInput>
  ): Promise<Habit> => {
    try {
      const updatedHabit = await updateHabitAction(habitId, updates);
      mutate(
        (currentData) =>
          (currentData ?? []).map((h) => (h.id === habitId ? updatedHabit : h)),
        false
      );
      return updatedHabit;
    } catch (err) {
      console.error("Failed to update habit:", err);
      await mutate();
      throw err;
    }
  };

  const archiveHabit = async (habitId: string): Promise<void> => {
    try {
      await archiveHabitAction(habitId);
      mutate((currentData) => (currentData ?? []).filter((h) => h.id !== habitId), false);
    } catch (err) {
      console.error("Failed to archive habit:", err);
      await mutate();
      throw err;
    }
  };

  const deleteHabit = async (habitId: string): Promise<void> => {
    try {
      await deleteHabitAction(habitId);
      mutate((currentData) => (currentData ?? []).filter((h) => h.id !== habitId), false);
    } catch (err) {
      console.error("Failed to delete habit:", err);
      await mutate();
      throw err;
    }
  };

  return {
    habits,
    isLoading,
    error: error?.message as string | undefined,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    mutate,
  };
}
