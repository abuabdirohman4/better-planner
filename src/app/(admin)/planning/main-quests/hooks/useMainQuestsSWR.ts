"use client";

import useSWR from 'swr';
import { questKeys, milestoneKeys, taskKeys } from '@/lib/swr';
import { getQuests } from '../actions/questActions';
import { getMilestonesForQuest } from '../actions/milestoneActions';
import { getTasksForMilestone } from '../actions/taskActions';
import { getSubtasksForTask } from '../actions/subTaskActions';

/**
 * SWR hook for fetching Main Quests
 */
export function useMainQuests(year: number, quarter: number) {
  const swrKey = questKeys.mainQuests(year, quarter);
  
  
  const { 
    data: quests = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    swrKey,
    () => getQuests(year, quarter, true),
    {
      revalidateOnFocus: false, // ✅ OPTIMIZED: Disabled - quests don't need real-time updates
      revalidateIfStale: true, // Enable revalidation if stale
      revalidateOnReconnect: true,
      dedupingInterval: 2 * 60 * 1000, // ✅ OPTIMIZED: 2 minutes cache - planning data changes less frequently
      errorRetryCount: 3,
    }
  );


  return {
    quests,
    error,
    isLoading,
    mutate,
  };
}

/**
 * SWR hook for fetching Milestones for a Quest
 */
export function useMilestones(questId: string) {
  const swrKey = questId ? milestoneKeys.list(questId) : null;
  
  
  const { 
    data: milestones = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    swrKey,
    () => getMilestonesForQuest(questId),
    {
      revalidateOnFocus: false, // ✅ OPTIMIZED: Disabled - milestones don't need real-time updates
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2 * 60 * 1000, // ✅ OPTIMIZED: 2 minutes cache - planning data changes less frequently
      errorRetryCount: 3,
    }
  );


  return {
    milestones,
    error,
    isLoading,
    mutate,
  };
}

/**
 * SWR hook for fetching Tasks for a Milestone
 */
export function useTasks(milestoneId: string) {
  const swrKey = milestoneId ? taskKeys.mainQuests(milestoneId) : null;
  
  const { 
    data: tasks = [], 
    error, 
    isLoading: swrIsLoading,
    mutate 
  } = useSWR(
    swrKey,
    () => getTasksForMilestone(milestoneId),
    {
      revalidateOnFocus: false, // ✅ OPTIMIZED: Disabled - milestones don't need real-time updates
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2 * 60 * 1000, // ✅ OPTIMIZED: 2 minutes cache - planning data changes less frequently
      errorRetryCount: 3,
    }
  );

  // Custom loading logic: only show loading during initial fetch, not for empty results
  const isLoading = swrIsLoading;

  return {
    tasks,
    error,
    isLoading,
    mutate,
  };
}

/**
 * SWR hook for fetching Subtasks for a Task
 */
export function useSubtasks(taskId: string) {
  const swrKey = taskId ? taskKeys.subtasks(taskId) : null;
  
  
  const { 
    data: subtasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    swrKey,
    () => getSubtasksForTask(taskId),
    {
      revalidateOnFocus: true,     // ✅ Enable focus revalidation for real-time updates
      revalidateIfStale: true,     // ✅ Enable stale revalidation for data freshness
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000, // ✅ Reduce cache time to 10 seconds for better sync
      errorRetryCount: 3,          // ✅ Increase retry count for reliability
    }
  );


  return {
    subtasks,
    error,
    isLoading,
    mutate,
  };
}
