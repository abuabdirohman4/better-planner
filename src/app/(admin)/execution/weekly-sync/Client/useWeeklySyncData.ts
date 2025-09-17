import { useMemo, useCallback } from 'react';
import { useWeeklySyncUltraFast, useWeeklyGoalsWithProgress, useWeeklyRules } from '@/hooks/execution/useWeeklySync';
import { getWeekDates } from '@/lib/dateUtils';
import { 
  useIsMobile, 
  processGoalItems, 
  processProgressData, 
  processRulesData 
} from '@/lib/performanceUtils';

// Helper: pastikan date adalah hari Senin
function ensureMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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
  
  // 🚀 ULTRA OPTIMIZED: ONLY use ultra fast RPC - no fallback for maximum speed
  const {
    goals: ultraFastGoals,
    goalProgress: ultraFastProgress,
    rules: ultraFastRules,
    isLoading: ultraFastLoading,
    error: ultraFastError,
    mutate: mutateUltraFast
  } = useWeeklySyncUltraFast(year, quarter, weekCalculations.displayWeek, startDate, endDate);

  // 🚀 ULTRA OPTIMIZED: Direct data usage - no fallback overhead
  const goals = ultraFastGoals || [];
  const goalProgress = ultraFastProgress || {};
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

  // 🚀 ULTRA OPTIMIZED: Minimal processing for maximum speed
  const processedGoals = useMemo(() => {
    if (!goalsWithItems || goalsWithItems.length === 0) return [];
    
    // 🚀 ULTRA FAST: Minimal processing - just return data as-is
    return goalsWithItems.map((goal: any) => ({
      ...goal,
      items: goal.items || [] // Ensure items array exists
    }));
  }, [goalsWithItems]);

  const processedProgress = useMemo(() => {
    return goalProgress || {}; // Minimal processing
  }, [goalProgress]);

  const processedRules = useMemo(() => {
    return toDontList || []; // Minimal processing
  }, [toDontList]);

  // 🚀 ULTRA OPTIMIZED: Direct usage - no mobile optimization overhead
  const mobileOptimizedGoals = processedGoals;


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
    goalProgress,
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
    dataSource
  };
}
