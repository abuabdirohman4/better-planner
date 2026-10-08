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
import JournalTab from './Journal/JournalTab';
import ActivityLog from './ActivityLog/ActivityLog';
import TimerEngine from './PomodoroTimer/TimerEngine';
import DailySyncClient from './DailyQuest/DailySyncClient';
import DailyRitualCard from './DailyQuest/components/DailyRitualCard';
import { getWeekDates, getLocalDateString } from '@/lib/dateUtils';

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

  // Halaman kiri buku = Perencanaan, halaman kanan = Jurnal (app-2pxn).
  const [pageTab, setPageTab] = useState<'plan' | 'journal'>('plan');


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

          <div className="mb-4 flex w-full rounded-lg bg-gray-100 p-1 dark:bg-gray-800" role="tablist" data-testid="daily-sync-page-tabs">
            {([['plan', 'Perencanaan'], ['journal', 'Jurnal']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={pageTab === key}
                data-testid={`page-tab-${key}`}
                onClick={() => setPageTab(key)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  pageTab === key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {pageTab === 'journal' ? (
            <JournalTab date={selectedDateStr} />
          ) : (
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
              <DailyRitualCard selectedDate={selectedDateStr} />
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-5 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                  <div className="flex-1">
                    <ActivityLog date={selectedDateStr} refreshKey={activityLogRefreshKey} />
                  </div>
                </div>
            </div>
          </div>
          )}
        </>
      )}

      <TimerEngine />
    </div>
  );
}