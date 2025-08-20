import useSWR from 'swr';

import { getDashboardMetrics } from '@/app/(admin)/dashboard/actions';
import { dashboardKeys } from '@/lib/swr';

/**
 * Custom hook for fetching all dashboard metrics in a single call.
 */
export function useDashboardMetrics() {
  const { 
    data, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dashboardKeys.allMetrics(),
    getDashboardMetrics,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
    }
  );

  return {
    metrics: data || { todayTasks: 0, activeQuests: 0, habitsStreak: 0, weeklyProgress: 0 },
    error,
    isLoading,
    mutate,
  };
} 