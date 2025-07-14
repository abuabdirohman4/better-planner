"use client";
import React, { useState, useMemo, Suspense, useTransition } from "react";
import DailySyncClient from "./DailySyncClient";
import PomodoroTimer from "./PomodoroTimer";
import { useWeek } from '@/hooks/useWeek';
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from '@/lib/quarterUtils';
import { daysOfWeek, getWeekDates } from '@/lib/dateUtils';
import { logActivity } from "./actions";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

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
  const [shouldStartTimer, setShouldStartTimer] = useState(false);
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

  const { displayWeek, totalWeeks, startWeek } = weekCalculations;

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

  // Ganti onSetActiveTask agar set shouldStartTimer true
  const handleSetActiveTask = (task: { id: string; title: string; item_type: string }) => {
    setActiveTask(task);
    setShouldStartTimer(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Week & Day Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <Button size="sm" className="!py-5" variant="outline" onClick={goPrevWeek} disabled={displayWeek <= 1}>
            &lt;
          </Button>
          {/* Dropdown Week Selector */}
          <div className="relative">
            <button
              className="flex items-center justify-center gap-1 px-8 py-4 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setIsWeekDropdownOpen((v) => !v)}
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
        {/* Daily Selector */}
        <div className="flex items-center gap-2">
          {weekDates.map((date, idx) => (
            <button
              key={idx}
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
      </div>
      
      {/* DailySyncClient dengan props week/day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom kiri: Task board saja */}
        <div>
          <DailySyncClient
            year={year}
            quarter={quarter}
            weekNumber={displayWeek}
            selectedDate={selectedDateStr}
            onSetActiveTask={handleSetActiveTask}
          />
        </div>
        {/* Kolom kanan: PomodoroTimer + Log Aktivitas */}
        <div className="flex flex-col gap-2 mt-4">
          <PomodoroTimer 
            activeTask={activeTask}
            shouldStart={shouldStartTimer}
            onStarted={() => setShouldStartTimer(false)}
            onSessionComplete={handleSessionComplete}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Log Aktivitas</h3>
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              [Log Aktivitas Placeholder]
            </div>
          </div>
        </div>
      </div>
      {/* Brain Dump di bawah 2 kolom */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Brain Dump</h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            [Brain Dump Placeholder]
          </div>
        </div>
      </div>
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
