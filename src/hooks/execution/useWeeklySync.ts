import useSWR from 'swr';

import { getWeeklyGoals, getWeeklyRules, calculateWeeklyGoalsProgress } from '@/app/(admin)/execution/weekly-sync/actions';
import { getUnscheduledTasks, getScheduledTasksForWeek } from '@/app/(admin)/planning/quests/actions';
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
 * Custom hook for fetching unscheduled tasks
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
      revalidateOnFocus: false,
      dedupingInterval: 3 * 60 * 1000, // 3 minutes
      errorRetryCount: 3,
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
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
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
 * Custom hook for fetching weekly goals with progress - OPTIMIZED VERSION
 * Uses single RPC call instead of multiple queries for much better performance
 */
export function useWeeklyGoalsWithProgress(year: number, weekNumber: number) {
  const { goals, error, isLoading, mutate } = useWeeklyGoals(year, weekNumber);
  
  const { 
    data: goalProgress = {}, 
    error: progressError, 
    isLoading: progressLoading 
  } = useSWR(
    ['weekly-goals-progress-optimized', year, weekNumber],
    async () => {
      // ✅ OPTIMIZED: Single RPC call instead of multiple queries
      return await calculateWeeklyGoalsProgress(year, weekNumber);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10 * 60 * 1000, // 10 minutes - increased for better caching
      errorRetryCount: 2, // reduced from 3
      errorRetryInterval: 1000, // 1 second
      focusThrottleInterval: 5000, // 5 seconds
    }
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
 * Custom hook for fetching weekly rules (to-dont list)
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
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10 * 60 * 1000, // 10 minutes - increased from 5
      errorRetryCount: 2, // reduced from 3
      errorRetryInterval: 1000, // 1 second
      focusThrottleInterval: 5000, // 5 seconds
    }
  );

  return {
    rules,
    error,
    isLoading,
    mutate,
  };
} 