import useSWR from 'swr';

import { getWeeklyGoals, getWeeklyRules, calculateWeeklyGoalsProgress } from '@/app/(admin)/execution/weekly-sync/actions';
import { getUnscheduledTasks, getScheduledTasksForWeek } from '@/app/(admin)/planning/quests/actions';
import { getMobileCacheConfig } from '@/lib/deviceUtils';
import { weeklyGoalKeys, weeklySyncKeys } from '@/lib/swr';

// Import types from WeeklyGoalsTable component
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
 * Get mobile-optimized SWR config
 */
function getMobileOptimizedConfig() {
  const mobileConfig = getMobileCacheConfig();
  return {
    revalidateOnFocus: mobileConfig.revalidateOnFocus,
    revalidateOnReconnect: mobileConfig.revalidateOnReconnect,
    dedupingInterval: mobileConfig.dedupingInterval,
    errorRetryCount: mobileConfig.errorRetryCount,
    errorRetryInterval: mobileConfig.errorRetryInterval,
    keepPreviousData: mobileConfig.keepPreviousData,
    focusThrottleInterval: 10000, // 10 seconds
  };
}

/**
 * Custom hook for fetching unscheduled tasks - MOBILE OPTIMIZED
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
    getMobileOptimizedConfig()
  );

  return {
    unscheduledTasks,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching scheduled tasks for a week - MOBILE OPTIMIZED
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
    getMobileOptimizedConfig()
  );

  return {
    scheduledTasks,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching weekly goals - MOBILE OPTIMIZED
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
    getMobileOptimizedConfig()
  );

  return {
    goals,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching weekly goals with progress - MOBILE OPTIMIZED
 * Uses single RPC call instead of multiple queries for much better performance
 */
export function useWeeklyGoalsWithProgress(year: number, weekNumber: number) {
  const { goals, error, isLoading, mutate } = useWeeklyGoals(year, weekNumber);
  
  const { 
    data: goalProgress = {}, 
    error: progressError, 
    isLoading: progressLoading 
  } = useSWR(
    ['weekly-goals-progress-mobile-optimized', year, weekNumber],
    async () => {
      // ✅ MOBILE OPTIMIZED: Single RPC call with mobile-specific caching
      return await calculateWeeklyGoalsProgress(year, weekNumber);
    },
    getMobileOptimizedConfig()
  );

  return {
    goals,
    goalProgress,
    error: error || progressError,
    isLoading: isLoading || progressLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching weekly rules (to-dont list) - MOBILE OPTIMIZED
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
    getMobileOptimizedConfig()
  );

  return {
    rules,
    error,
    isLoading,
    mutate,
  };
} 