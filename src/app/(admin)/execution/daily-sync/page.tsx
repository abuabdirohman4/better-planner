"use client";
import React, { useState, useMemo, Suspense, useTransition } from "react";
import DailySyncClient from "./DailySyncClient";
import PomodoroTimer from "./PomodoroTimer";
import { useWeek } from '@/hooks/useWeek';
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from '@/lib/quarterUtils';
import { formatDateIndo, daysOfWeek, getWeekDates } from '@/lib/dateUtils';
import { logActivity } from "./actions";

const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

function DailySyncContent() {
  const { year, quarter } = useWeek();
  const today = getTodayDate();
  const [currentWeek, setCurrentWeek] = useState(today);
  const weekDates = getWeekDates(currentWeek);
  const [activeTask, setActiveTask] = useState<{ id: string; title: string; item_type: string } | null>(null);
  const [, startTransition] = useTransition();

  // Week calculations (mirip WeeklySyncClient)
  const weekCalculations = useMemo(() => {
    const currentWeekNumber = getWeekOfYear(currentWeek);
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    const weekInQuarter = Math.max(1, Math.min(totalWeeks, currentWeekNumber - startWeek + 1));
    const displayWeek = weekInQuarter;
    const weekStartDate = getDateFromWeek(year, startWeek + displayWeek - 1, 1);
    const weekEndDate = getDateFromWeek(year, startWeek + displayWeek - 1, 7);
    const weekRangeLabel = `${formatDateIndo(weekStartDate)} – ${formatDateIndo(weekEndDate)}`;
    return {
      currentWeekNumber,
      startWeek,
      endWeek,
      totalWeeks,
      weekInQuarter,
      displayWeek,
      weekStartDate,
      weekEndDate,
      weekRangeLabel
    };
  }, [currentWeek, year, quarter]);

  const { displayWeek, totalWeeks, weekRangeLabel, startWeek } = weekCalculations;

  // Helper function to determine default day index for a week
  const getDefaultDayIndexForWeek = (weekStartDate: Date) => {
    const weekDateStrs = getWeekDates(weekStartDate).map(d => d.toISOString().slice(0, 10));
    const todayStr = today.toISOString().slice(0, 10);
    const todayIndex = weekDateStrs.indexOf(todayStr);
    
    // If today is in this week, select today, otherwise select Monday (index 0)
    return todayIndex !== -1 ? todayIndex : 0;
  };

  // State hari aktif (default: hari ini jika di minggu ini, else Senin)
  const defaultDayIdx = getDefaultDayIndexForWeek(currentWeek);
  const [selectedDayIdx, setSelectedDayIdx] = useState(defaultDayIdx);
  const selectedDate = weekDates[selectedDayIdx];
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);

  // Week navigation
  const goPrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prev);
    const defaultDayIdx = getDefaultDayIndexForWeek(prev);
    setSelectedDayIdx(defaultDayIdx);
  };
  const goNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(next);
    const defaultDayIdx = getDefaultDayIndexForWeek(next);
    setSelectedDayIdx(defaultDayIdx);
  };

  // Week dropdown
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const handleSelectWeek = (weekIdx: number) => {
    const weekNumber = startWeek + weekIdx - 1;
    const monday = getDateFromWeek(year, weekNumber, 1);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeek(monday);
    const defaultDayIdx = getDefaultDayIndexForWeek(monday);
    setSelectedDayIdx(defaultDayIdx);
    setIsWeekDropdownOpen(false);
  };

  const handleSessionComplete = async (sessionData: {
    taskId: string;
    taskTitle: string;
    duration: number;
    type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  }) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('taskId', sessionData.taskId);
        formData.append('taskTitle', sessionData.taskTitle);
        formData.append('duration', sessionData.duration.toString());
        formData.append('sessionType', sessionData.type);
        formData.append('date', selectedDateStr);
        await logActivity(formData);
      } catch (err) {
        console.error('Error logging session:', err);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Week & Day Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <button onClick={goPrevWeek} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-lg font-bold" disabled={displayWeek <= 1}>&lt;</button>
          <div className="relative">
            <button
              className="flex items-center gap-1 px-6 py-2 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setIsWeekDropdownOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={isWeekDropdownOpen}
            >
              <span>Week {displayWeek}</span>
            </button>
            {isWeekDropdownOpen && (
              <div className="absolute z-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow w-32 mt-2 max-h-64 overflow-y-auto">
                {Array.from({ length: totalWeeks }, (_, i) => (
                  <div
                    key={i + 1}
                    onClick={() => handleSelectWeek(i + 1)}
                    className={`px-4 py-2 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/30 ${displayWeek === i + 1 ? 'bg-brand-100 dark:bg-brand-900/30 font-semibold' : ''}`}
                  >
                    Week {i + 1}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={goNextWeek} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-lg font-bold" disabled={displayWeek >= totalWeeks}>&gt;</button>
          <span className="ml-4 text-gray-500 text-sm">{weekRangeLabel}</span>
        </div>
        {/* Daily Selector */}
        <div className="flex items-center gap-2">
          {weekDates.map((date, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedDayIdx === idx ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/30'}`}
            >
              {daysOfWeek[idx]}
              <span className="block text-xs mt-1">{date.getDate()}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Pomodoro Timer - Prominent position at top */}
      <div className="mb-8">
        <PomodoroTimer 
          activeTask={activeTask}
          onSessionComplete={handleSessionComplete}
        />
      </div>
      
      {/* DailySyncClient dengan props week/day */}
      <DailySyncClient
        year={year}
        quarter={quarter}
        weekNumber={displayWeek}
        selectedDate={selectedDateStr}
        onSetActiveTask={setActiveTask}
      />
    </div>
  );
}

export default function DailySyncPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <DailySyncContent />
    </Suspense>
  );
}
