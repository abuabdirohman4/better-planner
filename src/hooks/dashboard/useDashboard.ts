import useSWR from 'swr';

import { getTodayTasks, getActiveQuests, getHabitsStreak, getWeeklyProgress } from '@/app/(admin)/dashboard/actions';
import { dashboardKeys } from '@/lib/swr';

/**
 * OPTIMIZED: Custom hook for fetching today's tasks count
 * Reduced deduping interval for better performance
 */
export function useTodayTasks() {
  const { 
    data: todayTasks = 0, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dashboardKeys.todayTasks(),
    () => getTodayTasks(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // Increased from 2 minutes to 5 minutes
      errorRetryCount: 2, // Reduced from 3 to 2
      revalidateOnReconnect: false, // Disabled to reduce unnecessary requests
    }
  );

  return {
    todayTasks,
    error,
    isLoading,
    mutate,
  };
}

/**
 * OPTIMIZED: Custom hook for fetching active quests count
 * Reduced deduping interval for better performance
 */
export function useActiveQuests() {
  const { 
    data: activeQuests = 0, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dashboardKeys.activeQuests(),
    () => getActiveQuests(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // Increased from 5 minutes to 10 minutes
      errorRetryCount: 2, // Reduced from 3 to 2
      revalidateOnReconnect: false, // Disabled to reduce unnecessary requests
    }
  );

  return {
    activeQuests,
    error,
    isLoading,
    mutate,
  };
}

/**
 * OPTIMIZED: Custom hook for fetching habits streak
 * Reduced deduping interval for better performance
 */
export function useHabitsStreak() {
  const { 
    data: habitsStreak = 0, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dashboardKeys.habitsStreak(),
    () => getHabitsStreak(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // Increased from 1 minute to 5 minutes
      errorRetryCount: 2, // Reduced from 3 to 2
      revalidateOnReconnect: false, // Disabled to reduce unnecessary requests
    }
  );

  return {
    habitsStreak,
    error,
    isLoading,
    mutate,
  };
}

/**
 * OPTIMIZED: Custom hook for fetching weekly progress
 * Reduced deduping interval for better performance
 */
export function useWeeklyProgress() {
  const { 
    data: weeklyProgress = 0, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dashboardKeys.weeklyProgress(),
    () => getWeeklyProgress(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // Increased from 3 minutes to 10 minutes
      errorRetryCount: 2, // Reduced from 3 to 2
      revalidateOnReconnect: false, // Disabled to reduce unnecessary requests
    }
  );

  return {
    weeklyProgress,
    error,
    isLoading,
    mutate,
  };
} 