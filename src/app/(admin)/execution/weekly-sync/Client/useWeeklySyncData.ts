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
  
  // 🚀 FALLBACK: Use working functions if ultra fast fails
  const {
    goals: ultraFastGoals,
    goalProgress: ultraFastProgress,
    rules: ultraFastRules,
    isLoading: ultraFastLoading,
    error: ultraFastError,
    mutate: mutateUltraFast
  } = useWeeklySyncUltraFast(year, quarter, weekCalculations.displayWeek, startDate, endDate);

  // 🚀 FALLBACK: Use working functions as backup
  const {
    goals: workingGoals,
    goalProgress: workingProgress,
    isLoading: workingGoalsLoading,
    error: workingGoalsError,
    mutate: mutateWorkingGoals
  } = useWeeklyGoalsWithProgress(year, weekCalculations.displayWeek);

  const {
    rules: workingRules,
    isLoading: workingRulesLoading,
    error: workingRulesError,
    mutate: mutateWorkingRules
  } = useWeeklyRules(year, weekCalculations.displayWeek);

  // 🚀 FALLBACK: Use working data if ultra fast data is empty or has no items
  const hasUltraFastData = ultraFastGoals && ultraFastGoals.length > 0 && 
    ultraFastGoals.some((goal: any) => goal.items && goal.items.length > 0);
  
  const hasWorkingData = workingGoals && workingGoals.length > 0 && 
    workingGoals.some((goal: any) => goal.items && goal.items.length > 0);

  console.log('🚀 DEBUG Fallback Check:', {
    hasUltraFastData,
    hasWorkingData,
    ultraFastGoalsLength: ultraFastGoals?.length || 0,
    workingGoalsLength: workingGoals?.length || 0,
    ultraFastHasItems: ultraFastGoals?.some((g: any) => g.items?.length > 0),
    workingHasItems: workingGoals?.some((g: any) => g.items?.length > 0)
  });

  // 🚀 CLEAR DATA SOURCE INDICATOR
  const dataSource = hasUltraFastData ? 'ULTRA FAST RPC' : 'WORKING FUNCTIONS';
  console.log(`🚀 DATA SOURCE: ${dataSource}`);
  console.log(`🚀 PERFORMANCE: ${dataSource === 'ULTRA FAST RPC' ? 'OPTIMIZED (Single RPC Call)' : 'FALLBACK (Multiple SWR Calls)'}`);

  const goals = hasUltraFastData ? ultraFastGoals : workingGoals;
  const goalProgress = ultraFastProgress && Object.keys(ultraFastProgress).length > 0 ? ultraFastProgress : workingProgress;
  const toDontList = ultraFastRules && ultraFastRules.length > 0 ? ultraFastRules : workingRules;
  const isLoading = ultraFastLoading || workingGoalsLoading || workingRulesLoading;
  const error = ultraFastError || workingGoalsError || workingRulesError;
  const mutate = useCallback(() => {
    mutateUltraFast();
    mutateWorkingGoals();
    mutateWorkingRules();
  }, [mutateUltraFast, mutateWorkingGoals, mutateWorkingRules]);

  // 🚀 FIXED: Use real data from working functions
  const goalsWithItems = goals;

  // 🚀 DEBUG: Log data for debugging
  console.log('🚀 DEBUG useWeeklySyncData:', {
    ultraFastGoals: ultraFastGoals?.length || 0,
    workingGoals: workingGoals?.length || 0,
    finalGoals: goals?.length || 0,
    ultraFastProgress: Object.keys(ultraFastProgress || {}).length,
    workingProgress: Object.keys(workingProgress || {}).length,
    finalProgress: Object.keys(goalProgress || {}).length,
    ultraFastRules: ultraFastRules?.length || 0,
    workingRules: workingRules?.length || 0,
    finalRules: toDontList?.length || 0,
    isLoading,
    error: error?.message
  });

  // 🚀 DEBUG: Log detailed goals structure
  console.log('🚀 DEBUG Goals Structure:', {
    goals: goals,
    goalsLength: goals?.length,
    firstGoal: goals?.[0],
    goalSlot: goals?.[0]?.goal_slot,
    items: goals?.[0]?.items,
    itemsLength: goals?.[0]?.items?.length,
    ultraFastGoals: ultraFastGoals,
    workingGoals: workingGoals,
    ultraFastFirstGoal: ultraFastGoals?.[0],
    workingFirstGoal: workingGoals?.[0]
  });

  // 🚀 DEBUG: Check if items exist in original data
  console.log('🚀 DEBUG Items Check:', {
    ultraFastFirstGoalItems: ultraFastGoals?.[0]?.items,
    ultraFastFirstGoalItemsLength: ultraFastGoals?.[0]?.items?.length,
    workingFirstGoalItems: workingGoals?.[0]?.items,
    workingFirstGoalItemsLength: workingGoals?.[0]?.items?.length,
    finalFirstGoalItems: goals?.[0]?.items,
    finalFirstGoalItemsLength: goals?.[0]?.items?.length
  });


  // 🚀 OPTIMIZED: Process all goals but with lazy item processing
  const processedGoals = useMemo(() => {
    if (!goalsWithItems || goalsWithItems.length === 0) return [];
    
    const processed = goalsWithItems.map((goal: any) => {
      // 🚀 DEBUG: Log each goal processing
      console.log(`🚀 DEBUG Processing Goal ${goal.goal_slot}:`, {
        originalItems: goal.items,
        originalItemsLength: goal.items?.length,
        isMobile,
        processedItems: processGoalItems(goal.items, isMobile)
      });
      
      return {
        ...goal,
        items: processGoalItems(goal.items, isMobile)
      };
    });
    
    // 🚀 DEBUG: Log processed goals
    console.log('🚀 DEBUG Processed Goals:', {
      originalGoals: goalsWithItems,
      processedGoals: processed,
      firstProcessedGoal: processed[0],
      firstProcessedItems: processed[0]?.items
    });
    
    return processed;
  }, [goalsWithItems, isMobile]);

  const processedProgress = useMemo(() => {
    return processProgressData(goalProgress);
  }, [goalProgress]);

  const processedRules = useMemo(() => {
    return processRulesData(toDontList);
  }, [toDontList]);

  // 🚀 OPTIMIZED: Mobile optimization with lazy item loading
  const maxItemsToShow = isMobile ? 3 : 5; // 🚀 Reduced initial load
  const mobileOptimizedGoals = useMemo(() => {
    if (!processedGoals || processedGoals.length === 0) return [];
    
    const optimized = processedGoals.map((goal: any) => ({
      ...goal,
      items: goal.items.slice(0, maxItemsToShow) // Only limit items per goal, not goals themselves
    }));
    
    // 🚀 DEBUG: Log mobile optimized goals
    console.log('🚀 DEBUG Mobile Optimized Goals:', {
      processedGoals: processedGoals,
      mobileOptimizedGoals: optimized,
      firstOptimizedGoal: optimized[0],
      firstOptimizedItems: optimized[0]?.items,
      maxItemsToShow,
      isMobile
    });
    
    return optimized;
  }, [processedGoals, maxItemsToShow, isMobile]); // Add isMobile dependency


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
