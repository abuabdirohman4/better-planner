"use client";

import useSWR from "swr";
import { getDailyQuests, archiveDailyQuest, updateDailyQuest, deleteDailyQuest } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/dailyQuestActions';
import { DailyQuest } from '../types';
import { dailySyncKeys } from "@/lib/swr";

export function useDailyQuests() {
  const {
    data: dailyQuests = [],
    error,
    isLoading,
    mutate
  } = useSWR(
    dailySyncKeys.dailyQuests(),
    () => getDailyQuests(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
    }
  );

  const updateQuestData = async (taskId: string, updates: Partial<DailyQuest>) => {
    try {
      await updateDailyQuest(taskId, updates);

      // Optimistic update
      mutate((currentData) =>
        (currentData || []).map(quest =>
          quest.id === taskId
            ? { ...quest, ...updates, updated_at: new Date().toISOString() }
            : quest
        ),
        false
      );

      // Refetch to ensure consistency
      await mutate();
    } catch (err) {
      console.error("Failed to update daily quest:", err);
      throw err;
    }
  };

  const archiveQuest = async (taskId: string) => {
    try {
      await archiveDailyQuest(taskId);

      // Optimistic update
      mutate((currentData) =>
        (currentData || []).map(quest =>
          quest.id === taskId ? { ...quest, is_archived: true } : quest
        ),
        false
      );

      // Refetch to ensure consistency
      await mutate();
    } catch (err) {
      console.error("Failed to archive daily quest:", err);
      throw err;
    }
  };

  const deleteQuest = async (taskId: string) => {
    try {
      await deleteDailyQuest(taskId);

      // Optimistic update
      mutate((currentData) =>
        (currentData || []).filter(quest => quest.id !== taskId),
        false
      );

      // Refetch to ensure consistency
      await mutate();
    } catch (err) {
      console.error("Failed to delete daily quest:", err);
      throw err;
    }
  };

  return {
    dailyQuests,
    isLoading,
    error: error?.message,
    refetch: () => mutate(),
    updateQuest: updateQuestData,
    archiveQuest,
    deleteQuest
  };
}
