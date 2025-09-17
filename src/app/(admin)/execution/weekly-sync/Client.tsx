"use client";

import React, { useState, useEffect } from "react";
import Spinner from '@/components/ui/spinner/Spinner';
import { useWeek } from "@/hooks/common/useWeek";
import { useWeeklyGoalsWithProgress } from "@/hooks/execution/useWeeklySync";
import { getDateFromWeek } from "@/lib/quarterUtils";

import ToDontListCard from "./ToDontListCard";
import WeeklyGoalsTable from "./Table";
import { useWeekCalculations } from "./Client/useWeekCalculations";
import { useTaskData } from "./Client/useTaskData";
import { useToDontList } from "./Client/useToDontList";
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
  const { taskPool, setTaskPool, weekTasks, setWeekTasks, loading, weekDates } = useTaskData(year, quarter, currentWeek);
  const { goals, goalProgress, isLoading: goalsLoading, mutate: mutateGoals } = useWeeklyGoalsWithProgress(year, weekCalculations.displayWeek);
  const { toDontList, toDontListLoading, mutate: mutateToDontList } = useToDontList(year, weekCalculations.displayWeek, refreshFlag);

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

  // Handler untuk refresh data dari child - FIXED: Invalidate all relevant caches
  const handleRefreshGoals = () => {
    mutateGoals(); // Invalidate goals cache immediately
    setRefreshFlag(f => f + 1); // Also trigger refresh flag for other components
  };
  
  const handleRefreshToDontList = () => {
    mutateToDontList(); // Invalidate to-dont list cache immediately
    setRefreshFlag(f => f + 1); // Also trigger refresh flag for other components
  };

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

  if (loading || toDontListLoading || goalsLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[600px]">
        <Spinner size={164} />
        <div className="mt-4 text-lg font-semibold text-gray-600">
          Loading Weekly Sync...
        </div>
        {/* Skeleton loading for better UX */}
        <div className="mt-8 w-full max-w-4xl space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
              ))}
            </div>
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