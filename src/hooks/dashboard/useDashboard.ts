import useSWR from 'swr';

import { getDashboardMetrics } from '@/app/(admin)/dashboard/actions';
import { dashboardKeys } from '@/lib/swr';

// ✅ SHARED STATE: Single SWR instance for all dashboard metrics
let sharedDashboardData: any = null;
let sharedDashboardError: any = null;
let sharedDashboardLoading = true;
let sharedDashboardMutate: any = null;

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
      errorRetryCount: 1, // Reduced retry count
    }
  );

  // ✅ SHARED STATE: Update shared variables
  sharedDashboardData = data;
  sharedDashboardError = error;
  sharedDashboardLoading = isLoading;
  sharedDashboardMutate = mutate;

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

// ✅ OPTIMIZED: Individual hooks now use shared state (NO API CALLS!)
export function useTodayTasks() {
  console.warn('⚠️ useTodayTasks is deprecated. Use useDashboardMetrics() instead.');
  return { 
    todayTasks: sharedDashboardData?.todayTasks || 0, 
    error: sharedDashboardError, 
    isLoading: sharedDashboardLoading, 
    mutate: sharedDashboardMutate 
  };
}

export function useActiveQuests() {
  console.warn('⚠️ useActiveQuests is deprecated. Use useDashboardMetrics() instead.');
  return { 
    activeQuests: sharedDashboardData?.activeQuests || 0, 
    error: sharedDashboardError, 
    isLoading: sharedDashboardLoading, 
    mutate: sharedDashboardMutate 
  };
}

export function useHabitsStreak() {
  console.warn('⚠️ useHabitsStreak is deprecated. Use useDashboardMetrics() instead.');
  return { 
    habitsStreak: sharedDashboardData?.habitsStreak || 0, 
    error: sharedDashboardError, 
    isLoading: sharedDashboardLoading, 
    mutate: sharedDashboardMutate 
  };
}

export function useWeeklyProgress() {
  console.warn('⚠️ useWeeklyProgress is deprecated. Use useDashboardMetrics() instead.');
  return { 
    weeklyProgress: sharedDashboardData?.weeklyProgress || 0, 
    error: sharedDashboardError, 
    isLoading: sharedDashboardLoading, 
    mutate: sharedDashboardMutate 
  };
} 