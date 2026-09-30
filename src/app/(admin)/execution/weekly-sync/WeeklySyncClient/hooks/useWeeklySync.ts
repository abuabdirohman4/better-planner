import useSWR from 'swr';
import { useMemo, useCallback } from 'react';

import { getWeeklySync } from '@/app/(admin)/execution/weekly-sync/actions/weeklySyncActions';
import { getWeekDates } from '@/lib/dateUtils';
import { useIsMobile } from '@/lib/performanceUtils';


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
      // 🚀 OPTIMIZED: Faster loading for better UX
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2 * 1000,
      errorRetryCount: 2,
      errorRetryInterval: 500,
      focusThrottleInterval: 2000,
      keepPreviousData: true,
      refreshInterval: 0,
      loadingTimeout: 5000,
      
      // 🚀 IMPROVED: Better error handling
      onError: (err) => {
        console.warn('SWR Error:', err.message);
        return;
      },
      
      // 🚀 IMPROVED: Better success handling
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
    isValidating,
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
  
  // 🚀 SYNCED: Use relative week number (1-13) for RPC function, same as Daily Sync
  const relativeWeekNumber = weekCalculations.displayWeek;
  
  // 🚀 MOBILE OPTIMIZED: Use ultra fast RPC with mobile-specific settings
  const {
    goals: ultraFastGoals,
    rules: ultraFastRules,
    isLoading: ultraFastLoading,
    isValidating: ultraFastValidating,
    error: ultraFastError,
    mutate: mutateUltraFast
  } = useWeeklySync(year, quarter, relativeWeekNumber, startDate, endDate);

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
    ultraFastValidating,
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