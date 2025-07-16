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
      dedupingInterval: 1 * 60 * 1000, // 1 minute
      errorRetryCount: 3,
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