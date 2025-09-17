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
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);
  
  // 🚀 OPTIMIZED: Prefetch next/prev week data for faster navigation
  const nextWeek = useMemo(() => {
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    return next;
  }, [currentWeek]);
  
  const prevWeek = useMemo(() => {
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    return prev;
  }, [currentWeek]);
  
  // 🚀 OPTIMIZED: Prefetch data for adjacent weeks
  const nextWeekDates = useMemo(() => getWeekDates(nextWeek), [nextWeek]);
  const prevWeekDates = useMemo(() => getWeekDates(prevWeek), [prevWeek]);
  
  // 🚀 TEMPORARY: Use working functions instead of ultra fast
  // Fetch goals and progress data
  const {
    goals,
    goalProgress,
    isLoading: goalsLoading,
    error: goalsError,
    mutate: mutateGoals
  } = useWeeklyGoalsWithProgress(year, weekCalculations.displayWeek);

  // Fetch rules data
  const {
    rules: toDontList,
    isLoading: rulesLoading,
    error: rulesError,
    mutate: mutateRules
  } = useWeeklyRules(year, weekCalculations.displayWeek);

  // Combine loading states
  const ultraFastLoading = goalsLoading || rulesLoading;
  const ultraFastError = goalsError || rulesError;
  const mutateUltraFast = useCallback(() => {
    mutateGoals();
    mutateRules();
  }, [mutateGoals, mutateRules]);


  // 🚀 OPTIMIZED: Process all goals but with lazy item processing
  const processedGoals = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    
    return goals.map((goal: any) => ({
      ...goal,
      items: processGoalItems(goal.items, isMobile)
    }));
  }, [goals, isMobile]);

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
    
    return processedGoals.map((goal: any) => ({
      ...goal,
      items: goal.items.slice(0, maxItemsToShow) // Only limit items per goal, not goals themselves
    }));
  }, [processedGoals, maxItemsToShow]);


  // Memoized refresh handlers
  const handleRefreshGoals = useCallback(() => {
    mutateUltraFast();
  }, [mutateUltraFast]);
  
  const handleRefreshToDontList = useCallback(() => {
    mutateUltraFast();
  }, [mutateUltraFast]);

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
    ultraFastLoading,
    ultraFastError,
    
    // Handlers
    handleRefreshGoals,
    handleRefreshToDontList,
    mutateUltraFast
  };
}
