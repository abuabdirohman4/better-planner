import useSWR from 'swr';

import { getTasksForWeek } from '../actions/weeklyTasksActions';
import { dailySyncKeys } from '@/lib/swr';

/**
 * Custom hook for fetching tasks for week selection
 * Fallback for when ultra-fast hook doesn't work
 */
export function useTasksForWeek(year: number, weekNumber: number, selectedDate?: string) {
  const { 
    data: tasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dailySyncKeys.tasksForWeek(year, weekNumber, selectedDate),
    () => getTasksForWeek(year, weekNumber, selectedDate),
    {
      revalidateOnFocus: false, // Disable to prevent revalidate when toast appears
      revalidateIfStale: false, // Disable to prevent revalidate after optimistic updates
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