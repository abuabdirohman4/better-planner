"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useQuarterStore } from "@/stores/quarterStore";
import { usePerformanceMonitor } from "@/lib/performanceUtils";
import { getQuarterWeekRange, getDateFromWeek, getWeekOfYear } from "@/lib/quarterUtils";

// Custom hooks
import { useWeeklySyncData } from "@/hooks/execution/useWeeklySync";
import { useErrorHandling } from "./Client/useErrorHandling";
import { useLoadingTime } from "./Client/useLoadingTime";
import { useWeekCalculations } from "./Client/useWeekCalculations";

// Components
import { LoadingState } from "./Client/LoadingState";
import { ErrorState } from "./Client/ErrorState";
import { MainContent } from "./Client/MainContent";

export default function WeeklySyncClient() {
  // 🚀 OPTIMIZED: Performance monitoring
  usePerformanceMonitor('WeeklySyncClient');
  
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { year, quarter } = useQuarterStore();
  
  // Memoize today to prevent infinite loops
  const today = useMemo(() => new Date(), []);
  
  // Check if today falls within the selected quarter
  const isTodayInQuarter = useMemo(() => {
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const todayWeek = getWeekOfYear(today);
    return todayWeek >= startWeek && todayWeek <= endWeek;
  }, [year, quarter, today]);
  
  // 🚀 OPTIMIZED: Single week calculation with memoization
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (isTodayInQuarter) {
      // If today is in the selected quarter, use today's week
      const day = today.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    } else {
      // If today is not in the selected quarter, use first week of quarter
      const { startWeek } = getQuarterWeekRange(year, quarter);
      const weekStartDate = getDateFromWeek(year, startWeek, 1);
      const day = weekStartDate.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const monday = new Date(weekStartDate);
      monday.setDate(weekStartDate.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    }
  });
  
  // Update currentWeek when quarter changes
  useEffect(() => {
    if (isTodayInQuarter) {
      // If today is in the selected quarter, use today's week
      const day = today.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      setCurrentWeek(monday);
    } else {
      // If today is not in the selected quarter, use first week of quarter
      const { startWeek } = getQuarterWeekRange(year, quarter);
      const weekStartDate = getDateFromWeek(year, startWeek, 1);
      const day = weekStartDate.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const monday = new Date(weekStartDate);
      monday.setDate(weekStartDate.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      setCurrentWeek(monday);
    }
  }, [year, quarter, isTodayInQuarter, today]);
  
  // 🚀 OPTIMIZED: Single week calculations call
  const weekCalculations = useWeekCalculations(
    currentWeek, 
    year, 
    quarter, 
    undefined
  );
  
  // Week navigation state
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [selectedWeekInQuarter, setSelectedWeekInQuarter] = useState<number | undefined>(undefined);
  
  // 🚀 OPTIMIZED: Week navigation handlers
  const handleSelectWeek = useCallback((weekIdx: number) => {
    const { startWeek } = weekCalculations;
    const weekNumber = startWeek + weekIdx - 1;
    const monday = new Date();
    const day = monday.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeek(monday);
    setSelectedWeekInQuarter(weekIdx);
  }, [weekCalculations.startWeek]);

  const goPrevWeek = useCallback(() => {
    if (weekCalculations.displayWeek <= 1) return;
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prev);
    setSelectedWeekInQuarter(undefined);
  }, [weekCalculations.displayWeek, currentWeek.getTime()]);
  
  const goNextWeek = useCallback(() => {
    if (weekCalculations.displayWeek >= weekCalculations.totalWeeks) return;
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(next);
    setSelectedWeekInQuarter(undefined);
  }, [weekCalculations.displayWeek, weekCalculations.totalWeeks, currentWeek.getTime()]);

  // 🚀 OPTIMIZED: Data fetching with progressive loading
  const {
    mobileOptimizedGoals,
    processedProgress,
    processedRules,
    ultraFastLoading,
    ultraFastError,
    handleRefreshGoals,
    handleRefreshToDontList,
    mutateUltraFast,
    dataSource
  } = useWeeklySyncData(currentWeek, year, quarter, weekCalculations);
  
  // Error handling
  const { error, retryCount, handleRetry } = useErrorHandling(ultraFastError, mutateUltraFast);
  
  // Loading time tracking
  const loadingTime = useLoadingTime(ultraFastLoading, ultraFastLoading, ultraFastLoading);

  // Enhanced refresh handlers with refresh flag
  const enhancedHandleRefreshGoals = () => {
    handleRefreshGoals();
    setRefreshFlag(f => f + 1);
  };
  
  const enhancedHandleRefreshToDontList = () => {
    handleRefreshToDontList();
    setRefreshFlag(f => f + 1);
  };

  // Error state
  if (error) {
    return <ErrorState error={error} retryCount={retryCount} onRetry={handleRetry} />;
  }

  // Loading state
  if (ultraFastLoading) {
    return <LoadingState isMobile={false} />; // Will be detected in the component
  }

  // Main content
  return (
    <MainContent
      displayWeek={weekCalculations.displayWeek}
      totalWeeks={weekCalculations.totalWeeks}
      isWeekDropdownOpen={isWeekDropdownOpen}
      setIsWeekDropdownOpen={setIsWeekDropdownOpen}
      handleSelectWeek={handleSelectWeek}
      goPrevWeek={goPrevWeek}
      goNextWeek={goNextWeek}
      year={year}
      mobileOptimizedGoals={mobileOptimizedGoals}
      processedProgress={processedProgress}
      processedRules={processedRules}
      toDontListLoading={ultraFastLoading}
      handleRefreshGoals={enhancedHandleRefreshGoals}
      handleRefreshToDontList={enhancedHandleRefreshToDontList}
      loadingTime={loadingTime}
      dataSource={dataSource}
    />
  );
}