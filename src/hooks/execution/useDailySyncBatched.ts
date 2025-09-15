import useSWR from 'swr';

import { getDailySyncCompleteData } from '@/app/(admin)/execution/daily-sync/actions';
import { dailySyncKeys } from '@/lib/swr';

/**
 * OPTIMIZED: Batched hook for all daily sync data
 * Reduces multiple API calls to single comprehensive call
 */
export function useDailySyncBatched(year: number, weekNumber: number, selectedDate: string) {
  const { 
    data: syncData = {
      dailyPlan: null,
      weeklyTasks: [],
      completedSessions: {}
    }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dailySyncKeys.dailySyncBatched(year, weekNumber, selectedDate),
    () => getDailySyncCompleteData(year, weekNumber, selectedDate),
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
    dailyPlan: syncData.dailyPlan,
    weeklyTasks: syncData.weeklyTasks,
    completedSessions: syncData.completedSessions,
    error,
    isLoading,
    mutate,
  };
}

/**
 * OPTIMIZED: Conditional loading hook for daily sync
 * Only loads data when component is visible
 */
export function useDailySyncConditional(
  year: number, 
  weekNumber: number, 
  selectedDate: string,
  isVisible: boolean = true
) {
  const { 
    data: syncData = {
      dailyPlan: null,
      weeklyTasks: [],
      completedSessions: {}
    }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    isVisible ? dailySyncKeys.dailySyncConditional(year, weekNumber, selectedDate) : null, // OPTIMIZED: Conditional loading
    () => getDailySyncCompleteData(year, weekNumber, selectedDate),
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
    dailyPlan: syncData.dailyPlan,
    weeklyTasks: syncData.weeklyTasks,
    completedSessions: syncData.completedSessions,
    error,
    isLoading,
    mutate,
  };
}
