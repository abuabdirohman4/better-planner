import useSWR from 'swr';

import { getDailyPlan, countCompletedSessions, getTasksForWeek } from '@/app/(admin)/execution/daily-sync/actions';
import { dailyPlanKeys, dailySyncKeys } from '@/lib/swr';

/**
 * Custom hook for fetching daily plan
 */
export function useDailyPlan(date: string) {
  const { 
    data: dailyPlan = null, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    date ? dailyPlanKeys.list(date) : null,
    () => getDailyPlan(date),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
    }
  );

  return {
    dailyPlan,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching completed sessions count
 * ✅ OPTIMIZED: Single hook for all completed sessions
 */
export function useCompletedSessions(taskId: string, date: string) {
  const { 
    data: completedCount = 0, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    taskId && date ? dailySyncKeys.completedSessions(taskId, date) : null,
    () => countCompletedSessions(taskId, date),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // ✅ 5 minutes - longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
    }
  );

  return {
    completedCount,
    error,
    isLoading,
    mutate,
  };
}

/**
 * ✅ NEW: Batch hook for all completed sessions
 * Much more efficient than multiple individual hooks
 */
export function useAllCompletedSessions(taskIds: string[], date: string) {
  const { 
    data = {}, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    taskIds.length > 0 && date ? dailySyncKeys.allCompletedSessions(taskIds, date) : null,
    async () => {
      // ✅ BATCH API CALL - Get all completed sessions at once
      const results: Record<string, number> = {};
      await Promise.all(
        taskIds.map(async (taskId) => {
          try {
            const count = await countCompletedSessions(taskId, date);
            results[taskId] = count;
          } catch (error) {
            console.error(`Failed to get completed sessions for task ${taskId}:`, error);
            results[taskId] = 0;
          }
        })
      );
      return results;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 1,
    }
  );

  return {
    completedSessions: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching tasks for week selection
 */
export function useTasksForWeek(year: number, weekNumber: number) {
  const { 
    data: tasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dailySyncKeys.tasksForWeek(year, weekNumber),
    () => getTasksForWeek(year, weekNumber),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
    }
  );

  return {
    tasks,
    error,
    isLoading,
    mutate,
  };
} 