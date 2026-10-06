"use client";
import React, { useState, useEffect } from "react";

import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useWeekManagement } from './DateSelector/hooks/useWeekManagement';
import { useTimerManagement } from './PomodoroTimer/hooks/useTimerManagement';
import { useGlobalTimer } from './PomodoroTimer/hooks/useGlobalTimer';
import { useLiveTimerNotification } from './PomodoroTimer/hooks/useLiveTimerNotification';
import { useDailyPlanManagement } from './DailyQuest/hooks/useDailyPlanManagement';
import WeekSelector from './DateSelector/WeekSelector';
import DaySelector from './DateSelector/DaySelector';
import BrainDumpSection from './BrainDump/BrainDumpSection';
import ActivityLog from './ActivityLog/ActivityLog';
import TimerEngine from './PomodoroTimer/TimerEngine';
import DailySyncClient from './DailyQuest/DailySyncClient';
import { getWeekDates, getLocalDateString } from '@/lib/dateUtils';
import CollapsibleCard from '@/components/common/CollapsibleCard';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';

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
  const selectedDateStr = getLocalDateString(selectedDate);

  const { displayWeek, totalWeeks } = weekCalculations;
  const { loading, initialLoading, dailyPlan } = useDailyPlanManagement(year, quarter, displayWeek, selectedDateStr);

  const { handleSetActiveTask, activityLogRefreshKey } = useTimerManagement(selectedDateStr);

  // Card collapse states
  const { cardCollapsed, toggleCardCollapsed } = useUIPreferencesStore();

  // Activity Log calendar mode for dynamic title
  const [activityCalendarMode, setActivityCalendarMode] = useState<'BOTH' | 'PLAN' | 'ACTUAL'>('BOTH');
  const activityTitle = activityCalendarMode === 'PLAN' ? 'Activity Plan'
    : activityCalendarMode === 'ACTUAL' ? 'Activity Log'
      : 'Activity Plan & Log';

  // Global timer - hanya ada 1 interval untuk seluruh aplikasi
  useGlobalTimer();
  // Notifikasi timer di HP
  useLiveTimerNotification();

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DailySyncClient
                year={year}
                quarter={quarter}
                weekNumber={displayWeek}
                selectedDate={selectedDateStr}
                onSetActiveTask={handleSetActiveTask}
                dailyPlan={dailyPlan}
                loading={loading}
                refreshSessionKey={{}}
                forceRefreshTaskId={null}
              />
            </div>
            <div className="flex flex-col gap-6">
              <CollapsibleCard
                isCollapsed={cardCollapsed.activityLog}
                onToggle={() => toggleCardCollapsed('activityLog')}
                className="h-full flex flex-col"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-5 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                  <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">{activityTitle}</h3>
                  <div className="flex-1">
                    <ActivityLog date={selectedDateStr} refreshKey={activityLogRefreshKey} onCalendarModeChange={setActivityCalendarMode} />
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          </div>
          <BrainDumpSection date={selectedDateStr} />
        </>
      )}

      <TimerEngine />
    </div>
  );
}