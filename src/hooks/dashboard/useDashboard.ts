import useSWR from 'swr';

import { getDashboardMetrics } from '@/app/(admin)/dashboard/actions';
import { dashboardKeys } from '@/lib/swr';

/**
 * ✅ OPTIMIZED: Single hook for all dashboard metrics
 * Much faster than 4 separate hooks!
 */
export function useDashboardMetrics() {
  const { 
    data = { todayTasks: 0, activeQuests: 0, habitsStreak: 0, weeklyProgress: 0 }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    'dashboard-metrics', // ✅ Single key for all metrics
    () => getDashboardMetrics(), // ✅ Single API call
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes - longer cache
      errorRetryCount: 2, // Reduced retry count
    }
  );

  return {
    todayTasks: data.todayTasks,
    activeQuests: data.activeQuests,
    habitsStreak: data.habitsStreak,
    weeklyProgress: data.weeklyProgress,
    error,
    isLoading,
    mutate,
  };
}

// ✅ KEEP INDIVIDUAL HOOKS for backward compatibility
export function useTodayTasks() {
  const { todayTasks, error, isLoading, mutate } = useDashboardMetrics();
  return { todayTasks, error, isLoading, mutate };
}

export function useActiveQuests() {
  const { activeQuests, error, isLoading, mutate } = useDashboardMetrics();
  return { activeQuests, error, isLoading, mutate };
}

export function useHabitsStreak() {
  const { habitsStreak, error, isLoading, mutate } = useDashboardMetrics();
  return { habitsStreak, error, isLoading, mutate };
}

export function useWeeklyProgress() {
  const { weeklyProgress, error, isLoading, mutate } = useDashboardMetrics();
  return { weeklyProgress, error, isLoading, mutate };
} 