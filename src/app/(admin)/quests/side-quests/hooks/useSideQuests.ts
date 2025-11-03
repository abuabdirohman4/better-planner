"use client";

import useSWR from "swr";
import { getSideQuests, updateSideQuestStatus, updateSideQuest, deleteSideQuest } from '../actions/sideQuestActions';
import { SideQuest } from '../types';

export function useSideQuests() {
  const { 
    data: sideQuests = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    'side-quests',
    () => getSideQuests(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
    }
  );

  const toggleStatus = async (taskId: string, currentStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      await updateSideQuestStatus(taskId, newStatus);
      
      // Optimistic update
      mutate((currentData) => 
        (currentData || []).map(quest => 
          quest.id === taskId 
            ? { ...quest, status: newStatus, updated_at: new Date().toISOString() }
            : quest
        ), 
        false
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      throw err;
    }
  };

  const updateQuest = async (taskId: string, updates: { title?: string; description?: string }) => {
    try {
      await updateSideQuest(taskId, updates);
      
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
      console.error("Failed to update side quest:", err);
      throw err;
    }
  };

  const deleteQuest = async (taskId: string) => {
    try {
      await deleteSideQuest(taskId);
      
      // Optimistic update
      mutate((currentData) => 
        (currentData || []).filter(quest => quest.id !== taskId),
        false
      );
      
      // Refetch to ensure consistency
      await mutate();
    } catch (err) {
      console.error("Failed to delete side quest:", err);
      throw err;
    }
  };

  return {
    sideQuests,
    isLoading,
    error: error?.message,
    refetch: () => mutate(),
    toggleStatus,
    updateQuest,
    deleteQuest
  };
}
