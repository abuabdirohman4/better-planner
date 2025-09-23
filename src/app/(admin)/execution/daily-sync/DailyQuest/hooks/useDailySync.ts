import useSWR from 'swr';

import { getTasksForWeek } from '../actions/weeklyTasksActions';
import { dailySyncKeys } from '@/lib/swr';

/**
 * Custom hook for fetching tasks for week selection
 * Fallback for when ultra-fast hook doesn't work
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
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2 * 60 * 1000,
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