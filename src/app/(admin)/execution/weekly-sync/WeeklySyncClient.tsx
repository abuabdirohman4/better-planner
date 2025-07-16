"use client";

import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import MobileSkeleton, { ProgressiveLoadingMessage } from "@/components/common/MobileSkeleton";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Spinner from '@/components/ui/spinner/Spinner';
import { useWeek } from "@/hooks/common/useWeek";
import { useUnscheduledTasks, useScheduledTasksForWeek, useWeeklyGoalsWithProgress, useWeeklyRules } from "@/hooks/execution/useWeeklySync";
import { formatDateIndo, daysOfWeek, getWeekDates } from "@/lib/dateUtils";
import { isMobileDevice } from "@/lib/deviceUtils";
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from "@/lib/quarterUtils";

import ToDontListCard from "./ToDontListCard";
import WeeklyGoalsTable from "./WeeklyGoalsTable";

// Lazy load heavy drag & drop component for better performance
const TaskDragDrop = lazy(() => import("./TaskDragDrop"));

type Task = {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  milestone_id: string;
  parent_task_id: string | null;
};

type LoadingStage = 'initializing' | 'loading-goals' | 'loading-tasks' | 'optimizing' | 'complete';

// Week selector component
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
  setIsWeekDropdownOpen: (open: boolean) => void;
  handleSelectWeek: (weekIdx: number) => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={goPrevWeek}
        disabled={displayWeek <= 1}
      >
        ←
      </Button>
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
          className="dropdown-toggle"
        >
          Minggu {displayWeek} dari {totalWeeks}
        </Button>
        <Dropdown
          isOpen={isWeekDropdownOpen}
          onClose={() => setIsWeekDropdownOpen(false)}
        >
          {Array.from({ length: totalWeeks }, (_, i) => (
            <DropdownItem key={i + 1} onClick={() => handleSelectWeek(i + 1)}>
              Minggu {i + 1}
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={goNextWeek}
        disabled={displayWeek >= totalWeeks}
      >
        →
      </Button>
    </div>
  );
}

// Loading screen component
function LoadingScreen({ loadingStage, isMobile }: {
  loadingStage: LoadingStage;
  isMobile: boolean;
}) {
  return (
    <div className="container mx-auto py-8 pt-0">
      <div className="flex flex-col justify-center items-center min-h-[400px] mb-8">
        <Spinner size={isMobile ? 128 : 164} />
        <div className="mt-4 text-lg font-semibold text-gray-600">
          Loading Weekly Sync...
        </div>
        <div className="mt-4 w-full max-w-md">
          <ProgressiveLoadingMessage stage={loadingStage} isMobile={isMobile} />
        </div>
      </div>
      
      <div className="mt-8 w-full max-w-4xl mx-auto">
        <MobileSkeleton variant="weekly-sync" />
      </div>
    </div>
  );
}

// Mobile-optimized simplified task view (without drag & drop)
function SimplifiedTaskView({ taskPool, weekTasks, weekDates, loading }: {
  taskPool: Task[];
  weekTasks: { [date: string]: Task[] };
  weekDates: Date[];
  loading: boolean;
}) {
  if (loading) {
    return <MobileSkeleton variant="task-list" />;
  }

  return (
    <div className="space-y-6">
      <ComponentCard title="Tugas Belum Terjadwal" className="lg:hidden">
        <div className="space-y-2">
          {taskPool.length === 0 ? (
            <p className="text-gray-500 text-sm">Tidak ada tugas yang belum terjadwal</p>
          ) : (
            taskPool.map((task) => (
              <div key={task.id} className="p-3 bg-gray-50 rounded border">
                <div className="font-medium text-sm">{task.title}</div>
                <div className="text-xs text-gray-500 mt-1">Status: {task.status}</div>
              </div>
            ))
          )}
        </div>
      </ComponentCard>

      <ComponentCard title="Tugas Mingguan" className="lg:hidden">
        <div className="space-y-4">
          {weekDates.map((date) => {
            const dateKey = date.toISOString().slice(0, 10);
            const tasks = weekTasks[dateKey] || [];
            
            return (
              <div key={dateKey} className="border rounded p-3">
                <div className="font-medium text-sm text-center mb-3">
                  {formatDateIndo(date)} - {daysOfWeek[date.getDay()]}
                </div>
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center">Tidak ada tugas</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="p-2 bg-blue-50 rounded text-sm">
                        {task.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ComponentCard>
    </div>
  );
}

// Helper function to ensure Monday as the start of the week
function ensureMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

// Custom hook for week calculations
function useWeekCalculations(currentWeek: Date, year: number, quarter: number, selectedWeekInQuarter?: number) {
  return useMemo(() => {
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    const displayWeek = selectedWeekInQuarter || (getWeekOfYear(currentWeek) - startWeek + 1);
    
    return {
      startWeek,
      totalWeeks,
      displayWeek
    };
  }, [currentWeek, year, quarter, selectedWeekInQuarter]);
}

// Custom hook for task data
function useTaskData(year: number, quarter: number, currentWeek: Date) {
  const [taskPool, setTaskPool] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<{ [date: string]: Task[] }>({});
  
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);
  
  const { unscheduledTasks, isLoading: unscheduledLoading } = useUnscheduledTasks(year, quarter);
  const { scheduledTasks, isLoading: scheduledLoading } = useScheduledTasksForWeek(startDate, endDate);
  
  const loading = unscheduledLoading || scheduledLoading;

  useEffect(() => {
    if (unscheduledTasks) {
      setTaskPool(unscheduledTasks);
    }
  }, [unscheduledTasks]);

  useEffect(() => {
    if (scheduledTasks) {
      const tasksMap: { [date: string]: Task[] } = {};
      scheduledTasks.forEach((task: Task) => {
        if (task.scheduled_date) {
          const date = task.scheduled_date.slice(0, 10);
          if (!tasksMap[date]) tasksMap[date] = [];
          tasksMap[date].push(task);
        }
      });
      setWeekTasks(tasksMap);
    }
  }, [scheduledTasks]);

  return {
    taskPool,
    setTaskPool,
    weekTasks,
    setWeekTasks,
    loading,
    weekDates
  };
}

// Custom hook for weekly goals
function useWeeklyGoals(year: number, weekNumber: number) {
  const { goals, goalProgress } = useWeeklyGoalsWithProgress(year, weekNumber);
  
  return useMemo(() => {
    return { goals: goals || [], goalProgress: goalProgress || {} };
  }, [goals, goalProgress]);
}

// Custom hook for to-don't list
function useToDontList(year: number, weekNumber: number) {
  const { rules: toDontList, isLoading: toDontListLoading } = useWeeklyRules(year, weekNumber);
  
  return { toDontList: toDontList || [], toDontListLoading };
}

// Custom hook for progressive loading
function useProgressiveLoading(loading: boolean, toDontListLoading: boolean, isMobile: boolean): LoadingStage {
  return useMemo(() => {
    if (loading && toDontListLoading) return 'initializing';
    if (loading) return 'loading-goals';
    if (toDontListLoading) return 'loading-tasks';
    if (isMobile) return 'optimizing';
    return 'complete';
  }, [loading, toDontListLoading, isMobile]);
}

// Custom hook for week navigation logic
function useWeekNavigation(year: number, quarter: number, currentWeek: Date, setCurrentWeek: (week: Date) => void) {
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [selectedWeekInQuarter, setSelectedWeekInQuarter] = useState<number | undefined>(undefined);
  
  const weekCalculations = useWeekCalculations(currentWeek, year, quarter, selectedWeekInQuarter);
  const { displayWeek, totalWeeks } = weekCalculations;
  
  const handleSelectWeek = (weekIdx: number) => {
    const { startWeek } = weekCalculations;
    const weekNumber = startWeek + weekIdx - 1;
    const monday = ensureMonday(getDateFromWeek(year, weekNumber, 1));
    setCurrentWeek(monday);
    setSelectedWeekInQuarter(weekIdx);
  };

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

  // Close dropdown after currentWeek changes
  useEffect(() => {
    if (isWeekDropdownOpen) {
      setIsWeekDropdownOpen(false);
    }
  }, [currentWeek, isWeekDropdownOpen]);

  return {
    displayWeek,
    totalWeeks,
    isWeekDropdownOpen,
    setIsWeekDropdownOpen,
    handleSelectWeek,
    goPrevWeek,
    goNextWeek,
    weekCalculations
  };
}

// Main component with reduced complexity
export default function WeeklySyncClient() {
  const [currentWeek, setCurrentWeek] = useState(() => ensureMonday(new Date()));

  const [showDragDrop, setShowDragDrop] = useState(false);
  const [loadingTime, setLoadingTime] = useState<number | null>(null);
  
  const isMobile = isMobileDevice();
  const { year, quarter } = useWeek();
  
  const weekNavigation = useWeekNavigation(year, quarter, currentWeek, setCurrentWeek);
  const { taskPool, setTaskPool, weekTasks, setWeekTasks, loading, weekDates } = useTaskData(year, quarter, currentWeek);
  const { goals, goalProgress } = useWeeklyGoals(year, weekNavigation.displayWeek);
  const { toDontList, toDontListLoading } = useToDontList(year, weekNavigation.displayWeek);
  
  const loadingStage = useProgressiveLoading(loading, toDontListLoading, isMobile);

  // Performance timer tracking
  useEffect(() => {
    if (!loading && !toDontListLoading && loadingTime === null) {
             const windowObj = window as { __WEEKLY_SYNC_START__?: number };
       const start = typeof window !== 'undefined' && windowObj.__WEEKLY_SYNC_START__ 
         ? windowObj.__WEEKLY_SYNC_START__ 
         : performance.now();
       const elapsed = (performance.now() - start) / 1000;
       setLoadingTime(Math.round(elapsed * 10) / 10);
       if (typeof window !== 'undefined') {
         windowObj.__WEEKLY_SYNC_START__ = performance.now();
       }
    }
  }, [loading, toDontListLoading, loadingTime]);

  // Progressive enhancement for desktop drag & drop
  useEffect(() => {
    if (!isMobile && !loading && !toDontListLoading) {
      const timer = setTimeout(() => {
        setShowDragDrop(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, loading, toDontListLoading]);

  const handleRefreshGoals = () => {
    // Refresh will be handled by SWR revalidation
  };
  const handleRefreshToDontList = () => {
    // Refresh will be handled by SWR revalidation
  };

  if (loading || toDontListLoading) {
    return <LoadingScreen loadingStage={loadingStage} isMobile={isMobile} />;
  }

  return (
    <div className="container mx-auto py-8 pt-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Weekly Sync{loadingTime !== null ? ` (${loadingTime}s)` : ''}
          {isMobile ? <span className="text-sm text-gray-500 ml-2">Mobile</span> : null}
        </h2>
        <WeekSelector
          displayWeek={weekNavigation.displayWeek}
          totalWeeks={weekNavigation.totalWeeks}
          isWeekDropdownOpen={weekNavigation.isWeekDropdownOpen}
          setIsWeekDropdownOpen={weekNavigation.setIsWeekDropdownOpen}
          handleSelectWeek={weekNavigation.handleSelectWeek}
          goPrevWeek={weekNavigation.goPrevWeek}
          goNextWeek={weekNavigation.goNextWeek}
        />
      </div>

      <WeeklyGoalsTable
        year={year}
        weekNumber={weekNavigation.displayWeek}
        goals={goals}
        goalProgress={goalProgress}
        onRefreshGoals={handleRefreshGoals}
      />
      
      <ToDontListCard
        year={year}
        weekNumber={weekNavigation.displayWeek}
        rules={toDontList}
        loading={toDontListLoading}
        onRefresh={handleRefreshToDontList}
      />

      {isMobile ? (
        <SimplifiedTaskView
          taskPool={taskPool}
          weekTasks={weekTasks}
          weekDates={weekDates}
          loading={loading}
        />
      ) : (
        <div className="mt-6">
          {!showDragDrop ? (
            <div className="text-center py-8">
              <Button
                onClick={() => setShowDragDrop(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tampilkan Task Scheduler
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Klik untuk mengaktifkan drag & drop task scheduling
              </p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="flex justify-center items-center py-8">
                <Spinner size={32} />
                <span className="ml-2 text-gray-600">Loading task scheduler...</span>
              </div>
            }>
              <TaskDragDrop
                taskPool={taskPool}
                setTaskPool={setTaskPool}
                weekTasks={weekTasks}
                setWeekTasks={setWeekTasks}
                weekDates={weekDates}
                loading={loading}
              />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
} 