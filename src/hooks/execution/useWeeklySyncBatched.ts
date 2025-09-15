import useSWR from 'swr';

import { getWeeklySyncCompleteData } from '@/app/(admin)/execution/weekly-sync/actions';
import { weeklySyncKeys } from '@/lib/swr';

/**
 * OPTIMIZED: Batched hook for all weekly sync data
 * Reduces multiple API calls to single comprehensive call
 */
export function useWeeklySyncBatched(year: number, weekNumber: number) {
  const { 
    data: syncData = {
      goals: [],
      progress: {},
      rules: [],
      unscheduledTasks: [],
      scheduledTasks: [],
      toDontList: []
    }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    weeklySyncKeys.weeklySyncBatched(year, weekNumber),
    () => getWeeklySyncCompleteData(year, weekNumber),
    {
      revalidateOnFocus: false, // OPTIMIZED: Disable aggressive revalidation
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // OPTIMIZED: 5 minutes
      errorRetryCount: 2,
      errorRetryInterval: 2000,
      keepPreviousData: true, // OPTIMIZED: Keep previous data while revalidating
    }
  );

  return {
    goals: syncData.goals,
    goalProgress: syncData.progress,
    rules: syncData.rules,
    unscheduledTasks: syncData.unscheduledTasks,
    scheduledTasks: syncData.scheduledTasks,
    toDontList: syncData.toDontList,
    error,
    isLoading,
    mutate,
  };
}

/**
 * OPTIMIZED: Conditional loading hook
 * Only loads data when component is visible
 */
export function useWeeklySyncConditional(
  year: number, 
  weekNumber: number, 
  isVisible: boolean = true
) {
  const { 
    data: syncData = {
      goals: [],
      progress: {},
      rules: [],
      unscheduledTasks: [],
      scheduledTasks: [],
      toDontList: []
    }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    isVisible ? weeklySyncKeys.weeklySyncConditional(year, weekNumber) : null, // OPTIMIZED: Conditional loading
    () => getWeeklySyncCompleteData(year, weekNumber),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000,
      errorRetryCount: 2,
      errorRetryInterval: 2000,
      keepPreviousData: true,
    }
  );

  return {
    goals: syncData.goals,
    goalProgress: syncData.progress,
    rules: syncData.rules,
    unscheduledTasks: syncData.unscheduledTasks,
    scheduledTasks: syncData.scheduledTasks,
    toDontList: syncData.toDontList,
    error,
    isLoading,
    mutate,
  };
}
