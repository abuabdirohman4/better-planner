import useSWR from 'swr';

import { getTodayTasks, getActiveQuests, getHabitsStreak, getWeeklyProgress } from '@/app/(admin)/dashboard/actions';
import { dashboardKeys } from '@/lib/swr';

/**
 * Custom hook for fetching today's tasks count
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
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
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
 * Custom hook for fetching active quests count
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
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
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
 * Custom hook for fetching habits streak
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
      dedupingInterval: 1 * 60 * 1000, // 1 minute
      errorRetryCount: 3,
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
 * Custom hook for fetching weekly progress
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
      dedupingInterval: 3 * 60 * 1000, // 3 minutes
      errorRetryCount: 3,
    }
  );

  return {
    weeklyProgress,
    error,
    isLoading,
    mutate,
  };
} 