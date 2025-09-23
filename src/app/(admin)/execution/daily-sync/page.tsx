"use client";
import React, { useState, useEffect } from "react";

import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useWeekManagement } from './DateSelector/hooks/useWeekManagement';
import { useTimerManagement } from './PomodoroTimer/hooks/useTimerManagement';
import { useGlobalTimer } from './PomodoroTimer/hooks/useGlobalTimer';
import { useDailyPlanManagement } from './DailyQuest/hooks/useDailyPlanManagement';
import WeekSelector from './DateSelector/WeekSelector';
import DaySelector from './DateSelector/DaySelector';
import BrainDumpSection from './BrainDump/BrainDumpSection';
import ActivityLog from './ActivityLog/ActivityLog';
import PomodoroTimer from './PomodoroTimer/PomodoroTimer';
import DailySyncClient from './DailyQuest/DailySyncClient';
import { setDailyPlan } from './DailyQuest/actions/dailyPlanActions';
import { DailyPlan } from './DailyQuest/types';
import { getWeekDates } from '@/lib/dateUtils';

export default function DailySyncPage() {
  const {
    year,
    quarter,
    currentWeek,
    weekCalculations,
    isWeekDropdownOpen,
    setIsWeekDropdownOpen,
    getDefaultDayIndexForWeek,
    goPrevWeek,
    goNextWeek,
    handleSelectWeek
  } = useWeekManagement();

  const weekDates = getWeekDates(currentWeek);
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => getDefaultDayIndexForWeek(currentWeek));
  const selectedDate = weekDates[selectedDayIdx];
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);

  const { displayWeek, totalWeeks } = weekCalculations;

  const { loading, initialLoading, dailyPlan, mutate } = useDailyPlanManagement(year, displayWeek, selectedDateStr);

  const handleSetDailyPlanState = (plan: DailyPlan | null) => {
    // This is a placeholder - the actual state management is handled by SWR
    // The mutate function will handle the data updates
    if (mutate) {
      mutate();
    }
  };

  const { handleSetActiveTask, activityLogRefreshKey } = useTimerManagement(selectedDateStr);
  
  // Global timer - hanya ada 1 interval untuk seluruh aplikasi
  useGlobalTimer();

  useEffect(() => {
    setSelectedDayIdx(getDefaultDayIndexForWeek(currentWeek));
  }, [currentWeek]);

  const handleGoPrevWeek = () => {
    const defaultDayIdx = goPrevWeek();
    setSelectedDayIdx(defaultDayIdx);
  };

  const handleGoNextWeek = () => {
    const defaultDayIdx = goNextWeek();
    setSelectedDayIdx(defaultDayIdx);
  };

  const handleSelectWeekWithDay = (weekIdx: number) => {
    const defaultDayIdx = handleSelectWeek(weekIdx);
    setSelectedDayIdx(defaultDayIdx);
  };

  return (
    <div className="mx-auto">
      {initialLoading ? (
        <DailySyncSkeleton />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-6 gap-4">
            <WeekSelector
              displayWeek={displayWeek}
              totalWeeks={totalWeeks}
              isWeekDropdownOpen={isWeekDropdownOpen}
              setIsWeekDropdownOpen={setIsWeekDropdownOpen}
              handleSelectWeek={handleSelectWeekWithDay}
              goPrevWeek={handleGoPrevWeek}
              goNextWeek={handleGoNextWeek}
            />
            <DaySelector
              weekDates={weekDates}
              selectedDayIdx={selectedDayIdx}
              setSelectedDayIdx={setSelectedDayIdx}
            />
          </div>
          {loading ? (
            <DailySyncSkeleton />
          ) : (
            <>
              <div className="block md:hidden mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Pomodoro Timer</h3>
                  <PomodoroTimer />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DailySyncClient
                    year={year}
                    quarter={quarter}
                    weekNumber={displayWeek}
                    selectedDate={selectedDateStr}
                    onSetActiveTask={handleSetActiveTask}
                    dailyPlan={dailyPlan}
                    setDailyPlanState={handleSetDailyPlanState}
                    setDailyPlanAction={setDailyPlan}
                    loading={loading}
                    refreshSessionKey={{}}
                    forceRefreshTaskId={null}
                  />
                </div>
                <div className="flex flex-col gap-6">
                  <div className="hidden md:block">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 pomodoro-timer relative">
                      <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Pomodoro Timer</h3>
                      <PomodoroTimer />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">Log Aktivitas Hari Ini</h3>
                    <ActivityLog date={selectedDateStr} refreshKey={activityLogRefreshKey} />
                  </div>
                </div>
              </div>
              <BrainDumpSection />
            </>
          )}
        </>
      )}
    </div>
  );
}