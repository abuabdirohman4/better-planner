import useSWR from 'swr';

import { getWeeklyGoals, getWeeklyRules, getWeeklyGoalsWithProgress, getWeeklySyncUltraFast } from '@/app/(admin)/execution/weekly-sync/actions';
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
  console.log('🚀 DEBUG: useWeeklySyncUltraFast hook called with:', { year, quarter, weekNumber, startDate, endDate });
  
  const swrKey = ['weekly-sync-ultra-fast', year, quarter, weekNumber, startDate, endDate];
  console.log('🚀 DEBUG: SWR Key:', swrKey);

  // 🚀 ULTRA OPTIMIZED: Simple, fast SWR config for all devices
  const { 
    data = {
      goals: [],
      progress: {},
      rules: []
      // 🚀 OPTIMIZED: Removed unused data (unscheduledTasks, scheduledTasks, weekDates)
    }, 
    error, 
    isLoading,
    mutate,
    isValidating
  } = useSWR(
    swrKey,
    () => {
      console.log('🚀 DEBUG: SWR Fetcher called!');
      return getWeeklySyncUltraFast(year, quarter, weekNumber, startDate, endDate);
    },
    {
      // 🚀 ULTRA FAST: Optimized for speed on all devices
      revalidateOnFocus: false,            // ✅ No revalidation on focus
      revalidateIfStale: false,            // ✅ No revalidation if stale
      revalidateOnReconnect: false,        // ✅ No revalidation on reconnect
      dedupingInterval: 30 * 1000,         // ✅ 30 seconds - short but reasonable
      errorRetryCount: 1,                  // ✅ 1 retry only
      errorRetryInterval: 1000,            // ✅ 1 second retry interval
      focusThrottleInterval: 5000,         // ✅ 5 seconds throttle
      keepPreviousData: true,              // ✅ Keep previous data for smooth UX
      refreshInterval: 0,                  // ✅ No auto refresh
      loadingTimeout: 10000,               // ✅ 10 seconds max - much faster!
      
      // 🚀 ULTRA FAST: Minimal error handling
      onError: (err) => {
        console.warn('SWR Error:', err.message);
        return;
      },
      
      // 🚀 ULTRA FAST: Minimal success handling
      onSuccess: (data) => {
        console.log('🚀 ULTRA FAST RPC:', data?.goals?.length || 0, 'goals');
        return;
      }
    }
  );
  console.log('🚀 DEBUG: SWR Data received:', {
    data,
    isLoading,
    isValidating,
    error,
    goalsLength: data?.goals?.length || 0,
    progressKeys: Object.keys(data?.progress || {}).length,
    rulesLength: data?.rules?.length || 0,
    isFromCache: !isLoading && !isValidating && data?.goals?.length > 0
  });

  // 🚀 DEBUG: Log detailed data structure
  if (data?.goals?.length > 0) {
    console.log('🚀 DEBUG: First Goal Data:', data.goals[0]);
    console.log('🚀 DEBUG: Goal Items:', data.goals[0]?.items?.length || 0, 'items');
  }

  return {
    // Goals data
    goals: data.goals,
    goalProgress: data.progress,
    
    // Rules data
    rules: data.rules,
    
    // Loading states
    isLoading,
    error,
    mutate,
  };
} 