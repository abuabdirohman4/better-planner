"use client";

import React, { useState, useEffect } from "react";
import { useWeek } from "@/hooks/common/useWeek";
import { useWeeklySyncUltraFast } from "@/hooks/execution/useWeeklySync";
import { getDateFromWeek } from "@/lib/quarterUtils";
import { getWeekDates } from "@/lib/dateUtils";

import ToDontListCard from "./ToDontListCard";
import WeeklyGoalsTable from "./Table";
import { useWeekCalculations } from "./Client/useWeekCalculations";
import { useDragEndHandler } from "./Client/useDragEndHandler";
import { WeekSelector } from "./Client/WeekSelector";
import { TaskCalendar } from "./Client/TaskCalendar";
import { TaskPool } from "./Client/TaskPool";

// Helper: pastikan date adalah hari Senin
function ensureMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

declare global {
  interface Window {
    __WEEKLY_SYNC_START__?: number;
  }
}

export default function WeeklySyncClient() {
  const [currentWeek, setCurrentWeek] = useState(() => ensureMonday(new Date()));
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [selectedWeekInQuarter, setSelectedWeekInQuarter] = useState<number | undefined>(undefined);
  const [refreshFlag, setRefreshFlag] = useState(0);
  
  const { year, quarter } = useWeek();
  const weekCalculations = useWeekCalculations(currentWeek, year, quarter, selectedWeekInQuarter);
  
  // 🚀 ULTRA FAST: Single hook instead of multiple separate hooks
  const weekDates = getWeekDates(currentWeek);
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);
  
  // 🚀 ULTRA FAST MODE: Use optimized single hook
  const useUltraFast = true; // Using existing RPC functions for maximum performance
  
  const {
    goals,
    goalProgress,
    unscheduledTasks: taskPool,
    scheduledTasks,
    rules: toDontList,
    weekDates: ultraFastWeekDates,
    isLoading: ultraFastLoading,
    error: ultraFastError,
    mutate: mutateUltraFast
  } = useUltraFast 
    ? useWeeklySyncUltraFast(year, quarter, weekCalculations.displayWeek, startDate, endDate)
    : {
        goals: [],
        goalProgress: {},
        unscheduledTasks: [],
        scheduledTasks: [],
        rules: [],
        weekDates: [],
        isLoading: true,
        error: null,
        mutate: () => {}
      };
  
  // Process scheduled tasks into grouped format (same as before)
  const weekTasks = React.useMemo(() => {
    const grouped: { [date: string]: any[] } = {};
    weekDates.forEach((d: any) => {
      const key = d.toISOString().slice(0, 10);
      grouped[key] = [];
    });
    scheduledTasks.forEach((task: any) => {
      const key = task.scheduled_date?.slice(0, 10);
      if (key && grouped[key]) grouped[key].push(task);
    });
    return grouped;
  }, [scheduledTasks, weekDates]);
  
  // Legacy compatibility - keep old loading states for now
  const loading = ultraFastLoading;
  const toDontListLoading = ultraFastLoading;
  const goalsLoading = ultraFastLoading;

  const { displayWeek, totalWeeks } = weekCalculations;

  // Timer untuk tracking waktu loading halaman (global, akurat)
  const [loadingTime, setLoadingTime] = useState<number | null>(null);
  useEffect(() => {
    if (!loading && !toDontListLoading && !goalsLoading && loadingTime === null) {
      const start = typeof window !== 'undefined' && window.__WEEKLY_SYNC_START__ ? window.__WEEKLY_SYNC_START__ : performance.now();
      const elapsed = (performance.now() - start) / 1000;
      setLoadingTime(Math.round(elapsed * 10) / 10);
      // Reset agar navigasi berikutnya fresh
      if (typeof window !== 'undefined') {
        window.__WEEKLY_SYNC_START__ = performance.now();
      }
    }
  }, [loading, toDontListLoading, goalsLoading, loadingTime]);

  // Handler untuk refresh data dari child - ULTRA FAST: Single mutate call
  const handleRefreshGoals = () => {
    mutateUltraFast(); // Invalidate all data at once
    setRefreshFlag(f => f + 1); // Also trigger refresh flag for other components
  };
  
  const handleRefreshToDontList = () => {
    mutateUltraFast(); // Invalidate all data at once
    setRefreshFlag(f => f + 1); // Also trigger refresh flag for other components
  };

  // Legacy compatibility - create dummy setters for drag handler
  const setTaskPool = () => {}; // SWR handles updates automatically
  const setWeekTasks = () => {}; // SWR handles updates automatically
  const handleDragEnd = useDragEndHandler(taskPool, setTaskPool, weekTasks, setWeekTasks);

  // Handler pilih week dari dropdown
  const handleSelectWeek = (weekIdx: number) => {
    const { startWeek } = weekCalculations;
    const weekNumber = startWeek + weekIdx - 1;
    const monday = ensureMonday(getDateFromWeek(year, weekNumber, 1));
    setCurrentWeek(monday);
    setSelectedWeekInQuarter(weekIdx);
  };

  // Tutup dropdown setelah currentWeek berubah agar label sinkron
  useEffect(() => {
    if (isWeekDropdownOpen) {
      setIsWeekDropdownOpen(false);
    }
  }, [currentWeek, isWeekDropdownOpen]);

  // Reset selectedWeekInQuarter jika navigasi dengan tombol prev/next
  const goPrevWeek = () => {
    if (displayWeek <= 1) return;
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(ensureMonday(prev));
    setSelectedWeekInQuarter(undefined);
  };
  
  const goNextWeek = () => {
    if (displayWeek >= totalWeeks) return;
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(ensureMonday(next));
    setSelectedWeekInQuarter(undefined);
  };

  // 🚀 PROGRESSIVE LOADING: Show content as it loads
  if (ultraFastLoading) {
    return (
      <div className="container mx-auto py-8 pt-0">
        {/* Header: Judul halaman kiri, navigasi minggu kanan */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            Weekly Sync
            <div className="inline-block ml-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton for Goals Table */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center text-xl font-extrabold mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton for To Don't List */}
        <div className="my-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center text-xl font-extrabold mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-2 py-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-6 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile-optimized loading message */}
        <div className="text-center py-8">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading data... This may take a moment on mobile networks.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 pt-0">
      {/* Header: Judul halaman kiri, navigasi minggu kanan */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Weekly Sync{loadingTime !== null ? ` (${loadingTime}s)` : ''}
        </h2>
        <WeekSelector
          displayWeek={displayWeek}
          totalWeeks={totalWeeks}
          isWeekDropdownOpen={isWeekDropdownOpen}
          setIsWeekDropdownOpen={setIsWeekDropdownOpen}
          handleSelectWeek={handleSelectWeek}
          goPrevWeek={goPrevWeek}
          goNextWeek={goNextWeek}
        />
      </div>

      {/* Kolom 3 Goal Mingguan */}
      <WeeklyGoalsTable
        year={year}
        weekNumber={displayWeek}
        goals={goals}
        goalProgress={goalProgress}
        onRefreshGoals={handleRefreshGoals}
      />
      
      {/* === To Don't List Card === */}
      <ToDontListCard
        year={year}
        weekNumber={displayWeek}
        rules={toDontList}
        loading={toDontListLoading}
        onRefresh={handleRefreshToDontList}
      />

      {/* Layout: Kolam Tugas kiri, Kalender Mingguan kanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 hidden">
        <TaskPool taskPool={taskPool} loading={loading} />
        <TaskCalendar weekDates={weekDates} weekTasks={weekTasks} handleDragEnd={handleDragEnd} />
      </div>
    </div>
  );
} 