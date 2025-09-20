"use client";
import React, { useState, useMemo, useTransition, useEffect, useCallback } from "react";

import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useTimer } from '@/stores/timerStore';
import { useQuarterStore } from '@/stores/quarterStore';
import { useDailySyncUltraFast } from './hooks/useDailySync';
import { daysOfWeek, getWeekDates } from '@/lib/dateUtils';
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from '@/lib/quarterUtils';
import { useActivityStore } from '@/stores/activityStore';

import { setDailyPlan } from './actions/dailyPlanActions';
import { logActivity } from './actions/activityLoggingActions';
import ActivityLog from "./ActivityLog";
import DailySyncClient from "./DailySyncClient";
import PomodoroTimer from "./PomodoroTimer";

const getTodayDate = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
};

function ensureMonday(date: Date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}

// Custom hook for week management
function useWeekManagement() {
  const { year, quarter } = useQuarterStore();
  
  // Memoize today to prevent infinite loops
  const today = useMemo(() => getTodayDate(), []);
  
  // Check if today falls within the selected quarter
  const isTodayInQuarter = useMemo(() => {
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const todayWeek = getWeekOfYear(today);
    return todayWeek >= startWeek && todayWeek <= endWeek;
  }, [year, quarter, today]);
  
  // Initialize currentWeek based on whether today is in quarter or not
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (isTodayInQuarter) {
      // If today is in the selected quarter, use today's week
      return ensureMonday(today);
    } else {
      // If today is not in the selected quarter, use first week of quarter
      const { startWeek } = getQuarterWeekRange(year, quarter);
      const weekStartDate = getDateFromWeek(year, startWeek, 1);
      return ensureMonday(weekStartDate);
    }
  });
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);

  // Update currentWeek when quarter changes
  useEffect(() => {
    if (isTodayInQuarter) {
      // If today is in the selected quarter, use today's week
      setCurrentWeek(ensureMonday(today));
    } else {
      // If today is not in the selected quarter, use first week of quarter
      const { startWeek } = getQuarterWeekRange(year, quarter);
      const weekStartDate = getDateFromWeek(year, startWeek, 1);
      setCurrentWeek(ensureMonday(weekStartDate));
    }
  }, [year, quarter, isTodayInQuarter, today]);

  const getDefaultDayIndexForWeek = (weekStartDate: Date) => {
    const weekDateStrs = getWeekDates(weekStartDate).map(d => d.toISOString().slice(0, 10));
    const todayStr = today.toISOString().slice(0, 10);
    const todayIndex = weekDateStrs.indexOf(todayStr);
    return todayIndex !== -1 ? todayIndex : 0;
  };

  const weekCalculations = useMemo(() => {
    const currentWeekNumber = getWeekOfYear(currentWeek);
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    const weekInQuarter = Math.max(1, Math.min(totalWeeks, currentWeekNumber - startWeek + 1));
    const displayWeek = weekInQuarter;
    const weekStartDate = getDateFromWeek(year, startWeek + displayWeek - 1, 1);
    const weekEndDate = getDateFromWeek(year, startWeek + displayWeek - 1, 7);
    return {
      currentWeekNumber,
      startWeek,
      endWeek,
      totalWeeks,
      weekInQuarter,
      displayWeek,
      weekStartDate,
      weekEndDate
    };
  }, [currentWeek, year, quarter]);

  const goPrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    prev.setHours(12, 0, 0, 0);
    const monday = ensureMonday(prev);
    setCurrentWeek(monday);
    return getDefaultDayIndexForWeek(monday);
  };

  const goNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    next.setHours(12, 0, 0, 0);
    const monday = ensureMonday(next);
    setCurrentWeek(monday);
    return getDefaultDayIndexForWeek(monday);
  };

  const handleSelectWeek = (weekIdx: number) => {
    const { startWeek } = weekCalculations;
    const weekNumber = startWeek + weekIdx - 1;
    const rawDate = getDateFromWeek(year, weekNumber, 1);
    rawDate.setHours(12, 0, 0, 0);
    const monday = ensureMonday(rawDate);
    setCurrentWeek(monday);
    setIsWeekDropdownOpen(false);
    return getDefaultDayIndexForWeek(monday);
  };

  return {
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
  };
}

// Custom hook for daily plan management - OPTIMIZED
function useDailyPlanManagement(year: number, weekNumber: number, selectedDateStr: string) {
  const { dailyPlan, isLoading, mutate } = useDailySyncUltraFast(year, weekNumber, selectedDateStr);

  return {
    loading: isLoading,
    initialLoading: isLoading,
    dailyPlan,
    setDailyPlanState: () => mutate()
  };
}

// Custom hook for timer management
function useTimerManagement(selectedDateStr: string) {
  const { startFocusSession, timerState, secondsElapsed, activeTask: activeTaskCtx, lastSessionComplete, setLastSessionComplete } = useTimer();
  const [activityLogRefreshKey, setActivityLogRefreshKey] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const defaultTitle = 'Daily Sync | Better Planner';
    function formatTime(secs: number) {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
    if (timerState === 'FOCUSING' && activeTaskCtx) {
      document.title = `${formatTime(secondsElapsed)} ${activeTaskCtx.title}`;
    } else {
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    };
  }, [timerState, secondsElapsed, activeTaskCtx]);

  const handleSessionComplete = useCallback(async (sessionData: {
    taskId: string;
    taskTitle: string;
    type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
    startTime: string;
    endTime: string;
  }) => {
    startTransition(async () => {
      try {
        if (!sessionData.taskId || !sessionData.type || !sessionData.startTime || !sessionData.endTime) {
          console.error('Missing required fields', sessionData);
          return;
        }
        const formData = new FormData();
        formData.append('taskId', sessionData.taskId);
        formData.append('taskTitle', sessionData.taskTitle);
        formData.append('sessionType', sessionData.type);
        formData.append('date', selectedDateStr);
        formData.append('startTime', sessionData.startTime);
        formData.append('endTime', sessionData.endTime);
        await logActivity(formData);
        setActivityLogRefreshKey((k) => k + 1);
        useActivityStore.getState().triggerRefresh();
      } catch (err) {
        console.error('Error logging session:', err);
      }
    });
  }, [selectedDateStr, setActivityLogRefreshKey]);

      const handleSetActiveTask = (task: { id: string; title: string; item_type: string }) => {
      startFocusSession(task);
    };

  useEffect(() => {
    if (lastSessionComplete) {
      handleSessionComplete(lastSessionComplete);
      setLastSessionComplete(null);
    }
  }, [lastSessionComplete, handleSessionComplete, setLastSessionComplete]);

  return {
    handleSetActiveTask,
    activityLogRefreshKey
  };
}

// Component for week selector
function WeekSelector({ 
  displayWeek, 
  totalWeeks, 
  isWeekDropdownOpen, 
  setIsWeekDropdownOpen, 
  handleSelectWeek, 
  goPrevWeek, 
  goNextWeek 
}: {
  displayWeek: number;
  totalWeeks: number;
  isWeekDropdownOpen: boolean;
  setIsWeekDropdownOpen: (value: boolean) => void;
  handleSelectWeek: (weekIdx: number) => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" className="!py-5" variant="outline" onClick={goPrevWeek} disabled={displayWeek <= 1}>
        &lt;
      </Button>
      <div className="relative">
        <button
          className="flex items-center justify-center gap-1 px-8 py-4 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
          aria-haspopup="listbox"
          aria-expanded={isWeekDropdownOpen}
        >
          <span>Week {displayWeek}</span>
        </button>
        <Dropdown className="w-28 !right-1" isOpen={isWeekDropdownOpen} onClose={() => setIsWeekDropdownOpen(false)}>
          <div className="max-h-64 overflow-y-auto">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <DropdownItem
                key={i + 1}
                onClick={() => handleSelectWeek(i + 1)}
                className={displayWeek === i + 1 ? "bg-brand-100 dark:bg-brand-900/30 font-semibold !text-center" : "!text-center"}
              >
                Week {i + 1}
              </DropdownItem>
            ))}
          </div>
        </Dropdown>
      </div>
      <Button size="sm" className="!py-5" variant="outline" onClick={goNextWeek} disabled={displayWeek >= totalWeeks}>
        &gt;
      </Button>
    </div>
  );
}

// Component for day selector
function DaySelector({ 
  weekDates, 
  selectedDayIdx, 
  setSelectedDayIdx 
}: {
  weekDates: Date[];
  selectedDayIdx: number;
  setSelectedDayIdx: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {weekDates.map((date, idx) => (
        <button
          key={`day-${date.toISOString()}`}
          onClick={() => setSelectedDayIdx(idx)}
          className={`w-24 min-w-[110px] px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center ${selectedDayIdx === idx ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/30'}`}
        >
          {daysOfWeek[idx]}
          <span className="block text-xs mt-1 whitespace-nowrap">
            {date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })} {date.getFullYear()}
          </span>
        </button>
      ))}
    </div>
  );
}

// Component for brain dump section
function BrainDumpSection() {
  return (
    <div className="mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Brain Dump</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          [Brain Dump Placeholder]
        </div>
      </div>
    </div>
  );
}

function DailySyncContent() {
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

  const { loading, initialLoading, dailyPlan, setDailyPlanState } = useDailyPlanManagement(year, displayWeek, selectedDateStr);

  const { handleSetActiveTask, activityLogRefreshKey } = useTimerManagement(selectedDateStr);

  useEffect(() => {
    setSelectedDayIdx(getDefaultDayIndexForWeek(currentWeek));
  }, [currentWeek, getDefaultDayIndexForWeek]);

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
    <div className="mx-auto py-8 px-4">
      {initialLoading ? (
        <DailySyncSkeleton />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DailySyncClient
                    year={year}
                    quarter={quarter}
                    weekNumber={displayWeek}
                    selectedDate={selectedDateStr}
                    onSetActiveTask={handleSetActiveTask}
                    dailyPlan={dailyPlan}
                    setDailyPlanState={setDailyPlanState}
                    setDailyPlanAction={setDailyPlan}
                    loading={loading}
                    refreshSessionKey={{}}
                    forceRefreshTaskId={null}
                  />
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <PomodoroTimer />
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] flex flex-col">
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

export default function DailySyncPage() {
  return <DailySyncContent />;
}