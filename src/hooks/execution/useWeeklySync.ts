import useSWR from 'swr';

import { getWeeklyRules, getWeeklySyncUltraFast } from '@/app/(admin)/execution/weekly-sync/actions';
import { weeklySyncKeys } from '@/lib/swr';
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
    () => getWeeklySyncUltraFast(year, quarter, weekNumber, startDate, endDate),
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
        return;
      }
    }
  );

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