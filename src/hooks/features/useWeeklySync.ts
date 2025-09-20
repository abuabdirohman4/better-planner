import useSWR from 'swr';
import { useMemo, useCallback } from 'react';

import { getWeeklySync } from '@/app/(admin)/execution/weekly-sync/actions/weeklySyncActions';
import { getWeekDates } from '@/lib/dateUtils';
import { useIsMobile } from '@/lib/performanceUtils';
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
 * 🚀 ULTRA FAST: Single hook that fetches ALL weekly sync data in one query
 * Replaces multiple separate hooks for maximum performance
 * ✅ OPTIMIZED: Single RPC call instead of 8+ separate queries
 */
export function useWeeklySync(year: number, quarter: number, weekNumber: number, startDate: string, endDate: string) {
  const swrKey = ['weekly-sync', year, quarter, weekNumber, startDate, endDate];

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
    () => getWeeklySync(year, quarter, weekNumber, startDate, endDate),
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
    
    // Rules data
    rules: data.rules,
    
    // Loading states
    isLoading,
    error,
    mutate,
  };
}

/**
 * 🚀 CONSOLIDATED: Enhanced hook that combines useWeeklySync + useWeeklySyncData logic
 * Single hook for all weekly sync data processing
 */
export function useWeeklySyncData(
  currentWeek: Date,
  year: number,
  quarter: number,
  weekCalculations: any
) {
  const isMobile = useIsMobile();
  
  // 🚀 OPTIMIZED: Calculate week dates with memoization
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek.getTime()]);
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);
  
  // 🚀 MOBILE OPTIMIZED: Use ultra fast RPC with mobile-specific settings
  const {
    goals: ultraFastGoals,
    rules: ultraFastRules,
    isLoading: ultraFastLoading,
    error: ultraFastError,
    mutate: mutateUltraFast
  } = useWeeklySync(year, quarter, weekCalculations.displayWeek, startDate, endDate);

  // 🚀 ULTRA OPTIMIZED: Direct data usage - no fallback overhead
  const goals = ultraFastGoals || [];
  const toDontList = ultraFastRules || [];
  const isLoading = ultraFastLoading;
  const error = ultraFastError;
  const mutate = useCallback(() => {
    mutateUltraFast();
  }, [mutateUltraFast]);

  // 🚀 ULTRA OPTIMIZED: Always ULTRA FAST RPC
  const dataSource = 'ULTRA FAST RPC';

  // 🚀 FIXED: Use real data from working functions
  const goalsWithItems = goals;

  // 🚀 ULTRA OPTIMIZED: Minimal processing for all devices
  const processedGoals = useMemo(() => {
    if (!goalsWithItems || goalsWithItems.length === 0) return [];
    
    // 🚀 ULTRA FAST: Minimal processing for speed
    return goalsWithItems.map((goal: any) => ({
      ...goal,
      items: goal.items || [] // Ensure items array exists
    }));
  }, [goalsWithItems]);

  // 🚀 OPTIMIZED: Progress calculation moved to client-side in Table.tsx
  const processedProgress = useMemo(() => {
    return {}; // Progress will be calculated in Table.tsx using useWeeklyGoalsProgress
  }, []);

  const processedRules = useMemo(() => {
    return toDontList || []; // Minimal processing for speed
  }, [toDontList]);

  // 🚀 ULTRA OPTIMIZED: Simple goal optimization
  const mobileOptimizedGoals = useMemo(() => {
    return processedGoals; // No additional processing for speed
  }, [processedGoals]);

  // Memoized refresh handlers
  const handleRefreshGoals = useCallback(() => {
    mutate();
  }, [mutate]);
  
  const handleRefreshToDontList = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    // Raw data
    goals,
    toDontList,
    
    // Processed data
    processedGoals,
    processedProgress,
    processedRules,
    mobileOptimizedGoals,
    
    // Loading states
    ultraFastLoading: isLoading,
    ultraFastError: error,
    
    // Handlers
    handleRefreshGoals,
    handleRefreshToDontList,
    mutateUltraFast: mutate,
    
    // Data source indicator
    dataSource,
    
    // Mobile detection
    isMobile
  };
} 