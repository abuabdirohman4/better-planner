import useSWR from 'swr';

import { getWeeklyGoals, getWeeklyRules, getWeeklyGoalsWithProgress, getWeeklySyncUltraFast } from '@/app/(admin)/execution/weekly-sync/actions';
import { getUnscheduledTasks, getScheduledTasksForWeek } from '@/app/(admin)/planning/quests/actions';
import { weeklyGoalKeys, weeklySyncKeys } from '@/lib/swr';
interface GoalItem {
  id: string;
  item_id: string;
  item_type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  status: string;
  display_order?: number;
  priority_score?: number;
  quest_id?: string;
  milestone_id?: string;
  parent_task_id?: string;
  parent_quest_id?: string;
  parent_quest_title?: string;
  parent_quest_priority_score?: number;
}

export interface WeeklyGoal {
  id: string;
  goal_slot: number;
  items: GoalItem[];
}

/**
 * Custom hook for fetching unscheduled tasks
 * ✅ OPTIMIZED: Conservative settings for better performance
 */
export function useUnscheduledTasks(year: number, quarter: number) {
  const { 
    data: unscheduledTasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    weeklySyncKeys.unscheduledTasks(year, quarter),
    () => getUnscheduledTasks(year, quarter),
    {
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - much longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
    }
  );

  return {
    unscheduledTasks,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching scheduled tasks for a week
 * ✅ OPTIMIZED: Conservative settings for better performance
 */
export function useScheduledTasksForWeek(startDate: string, endDate: string) {
  const { 
    data: scheduledTasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    startDate && endDate ? weeklySyncKeys.scheduledTasks(startDate, endDate) : null,
    () => getScheduledTasksForWeek(startDate, endDate),
    {
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - much longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
    }
  );

  return {
    scheduledTasks,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching weekly goals
 */
export function useWeeklyGoals(year: number, weekNumber: number) {
  const { 
    data: goals = [] as WeeklyGoal[], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    weeklyGoalKeys.list(year, weekNumber),
    () => getWeeklyGoals(year, weekNumber),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10 * 60 * 1000, // 10 minutes - increased from 4
      errorRetryCount: 2, // reduced from 3
      errorRetryInterval: 1000, // 1 second
      focusThrottleInterval: 5000, // 5 seconds
    }
  );

  return {
    goals,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching weekly goals with progress - ULTRA OPTIMIZED VERSION
 * Uses single optimized function call for both goals and progress data
 * ✅ OPTIMIZED: Conservative settings for better performance
 */
export function useWeeklyGoalsWithProgress(year: number, weekNumber: number) {
  const { 
    data: goalsData = { goals: [], progress: {} }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    ['weekly-goals-with-progress-ultra-optimized', year, weekNumber],
    () => getWeeklyGoalsWithProgress(year, weekNumber),
    {
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      revalidateOnReconnect: false, // ✅ Disabled reconnect revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - much longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
      errorRetryInterval: 2000, // ✅ Slower retry interval
      focusThrottleInterval: 10000, // ✅ 10 seconds - much longer throttle
      keepPreviousData: true, // Keep previous data while revalidating
    }
  );

  return {
    goals: goalsData.goals,
    goalProgress: goalsData.progress,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching weekly rules (to-dont list)
 * ✅ OPTIMIZED: Conservative settings for better performance
 */
export function useWeeklyRules(year: number, weekNumber: number) {
  const { 
    data: rules = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    weeklySyncKeys.weeklyRules(year, weekNumber),
    () => getWeeklyRules(year, weekNumber),
    {
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      revalidateOnReconnect: false, // ✅ Disabled reconnect revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - much longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
      errorRetryInterval: 2000, // ✅ Slower retry interval
      focusThrottleInterval: 10000, // ✅ 10 seconds - much longer throttle
      keepPreviousData: true, // Keep previous data while revalidating
    }
  );

  return {
    rules,
    error,
    isLoading,
    mutate,
  };
}

/**
 * 🚀 ULTRA FAST: Single hook that fetches ALL weekly sync data in one query
 * Replaces multiple separate hooks for maximum performance
 * ✅ OPTIMIZED: Single RPC call instead of 8+ separate queries
 */
export function useWeeklySyncUltraFast(year: number, quarter: number, weekNumber: number, startDate: string, endDate: string) {
  const swrKey = ['weekly-sync-ultra-fast', year, quarter, weekNumber, startDate, endDate];

  const { 
    data = {
      goals: [],
      progress: {},
      rules: [],
      unscheduledTasks: [],
      scheduledTasks: [],
      weekDates: []
    }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    swrKey,
    () => getWeeklySyncUltraFast(year, quarter, weekNumber, startDate, endDate),
    {
      // 🚀 PRODUCTION: Balanced settings for optimal performance
      revalidateOnFocus: true,           // ✅ Revalidate on focus for fresh data
      revalidateIfStale: true,           // ✅ Revalidate if data is stale
      revalidateOnReconnect: true,       // ✅ Revalidate on reconnect
      dedupingInterval: 2 * 60 * 1000,   // ✅ 2 minutes - reasonable cache time
      errorRetryCount: 2,                // ✅ Reduced retry count
      errorRetryInterval: 2000,          // ✅ 2 seconds retry interval
      focusThrottleInterval: 5000,       // ✅ 5 seconds throttle
      keepPreviousData: true,            // ✅ Keep previous data for smooth UX
      refreshInterval: 0,                // ✅ No auto refresh
      
      // 🚀 PRODUCTION: Silent error handling
      onError: (err) => {
        console.warn('SWR Error (silent):', err);
        return;
      },
      
      // 🚀 PRODUCTION: Silent success handling
      onSuccess: (data) => {
        console.log('🚀 ULTRA FAST RPC Success:', data?.goals?.length || 0, 'goals loaded');
        return;
      }
    }
  );

  // 🚀 PRODUCTION: Minimal logging for performance monitoring
  if (data?.goals?.length > 0) {
    console.log('🚀 ULTRA FAST RPC loaded:', data.goals.length, 'goals');
  }

  return {
    // Goals data
    goals: data.goals,
    goalProgress: data.progress,
    
    // Tasks data
    unscheduledTasks: data.unscheduledTasks,
    scheduledTasks: data.scheduledTasks,
    
    // Rules data
    rules: data.rules,
    
    // Week dates
    weekDates: data.weekDates,
    
    // Loading states
    isLoading,
    error,
    mutate,
  };
} 