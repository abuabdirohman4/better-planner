"use client";

import { DndContext, closestCenter, useDroppable, useDraggable, DragEndEvent } from "@dnd-kit/core";
import React, { useState, useEffect, useMemo } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Spinner from '@/components/ui/spinner/Spinner';
import CustomToast from "@/components/ui/toast/CustomToast";
import { useWeek } from "@/hooks/common/useWeek";
import { useUnscheduledTasks, useScheduledTasksForWeek, useWeeklyGoalsWithProgress, useWeeklyRules } from "@/hooks/execution/useWeeklySync";
import { formatDateIndo, daysOfWeek, getWeekDates } from "@/lib/dateUtils";
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from "@/lib/quarterUtils";

import ToDontListCard from "./ToDontListCard";
import WeeklyGoalsTable from "./WeeklyGoalsTable";

type Task = {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  milestone_id: string;
  parent_task_id: string | null;
};

// Import missing functions
const scheduleTask = async (taskId: string, newScheduledDate: string | null) =>
  (await import("../../planning/quests/actions")).scheduleTask(taskId, newScheduledDate);

// Helper: pastikan date adalah hari Senin
function ensureMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Custom hook for week calculations
function useWeekCalculations(currentWeek: Date, year: number, quarter: number, selectedWeekInQuarter: number | undefined) {
  return useMemo(() => {
    const currentWeekNumber = getWeekOfYear(currentWeek);
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    const weekInQuarter = Math.max(1, Math.min(totalWeeks, currentWeekNumber - startWeek + 1));
    const displayWeek = selectedWeekInQuarter ?? weekInQuarter;

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
  }, [currentWeek, year, quarter, selectedWeekInQuarter]);
}

// Custom hook for task data management
function useTaskData(year: number, quarter: number, currentWeek: Date) {
  // Memoize weekDates to prevent infinite re-renders
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);

  // SWR hooks for data fetching
  const { unscheduledTasks, isLoading: unscheduledLoading } = useUnscheduledTasks(year, quarter);
  const { scheduledTasks, isLoading: scheduledLoading } = useScheduledTasksForWeek(startDate, endDate);

  // Process scheduled tasks into grouped format
  const weekTasks = useMemo(() => {
    const grouped: { [date: string]: Task[] } = {};
    weekDates.forEach((d) => {
      const key = d.toISOString().slice(0, 10);
      grouped[key] = [];
    });
    scheduledTasks.forEach((task: Task) => {
      const key = task.scheduled_date?.slice(0, 10);
      if (key && grouped[key]) grouped[key].push(task);
    });
    return grouped;
  }, [scheduledTasks, weekDates]);

  const loading = unscheduledLoading || scheduledLoading;

  return { 
    taskPool: unscheduledTasks, 
    setTaskPool: () => {}, // SWR handles updates automatically
    weekTasks, 
    setWeekTasks: () => {}, // SWR handles updates automatically
    loading, 
    weekDates 
  };
}

// Custom hook for to-dont list
function useToDontList(year: number, displayWeek: number, refreshFlag: number) {
  const { rules: toDontList, isLoading: toDontListLoading, mutate } = useWeeklyRules(year, displayWeek);
  
  // Trigger refresh when refreshFlag changes
  useEffect(() => {
    if (refreshFlag > 0) {
      mutate();
    }
  }, [refreshFlag, mutate]);

  return { toDontList, toDontListLoading, mutate };
}

// Component for task item
function TaskItemDraggable({ task, id }: { task: Task; id: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border bg-white dark:bg-gray-800 shadow-sm cursor-move mb-2 transition ${isDragging ? "opacity-60" : ""}`}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
    >
      <span className="font-medium">{task.title}</span>
    </div>
  );
}

// Component for droppable day
function DayDroppable({ date, children }: { date: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] transition rounded-lg ${isOver ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
    >
      {children}
    </div>
  );
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
      <Button size="sm" variant="outline" onClick={goPrevWeek} disabled={displayWeek <= 1}>
        &lt;
      </Button>
      <div className="relative">
        <button
          className="flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
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
      <Button size="sm" variant="outline" onClick={goNextWeek} disabled={displayWeek >= totalWeeks}>
        &gt;
      </Button>
    </div>
  );
}

// Component for task calendar
function TaskCalendar({ 
  weekDates, 
  weekTasks, 
  handleDragEnd 
}: {
  weekDates: Date[];
  weekTasks: { [date: string]: Task[] };
  handleDragEnd: (event: DragEndEvent) => void;
}) {
  return (
    <section>
      <h4 className="text-base font-semibold mb-2">Kalender Mingguan</h4>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid md:grid-rows-7 md:grid-cols-1">
          {weekDates.map((date: Date, idx: number) => {
            const dateStr = date.toISOString().slice(0, 10);
            return (
              <ComponentCard
                key={dateStr}
                title={`${daysOfWeek[idx]}, ${formatDateIndo(date)}`}
              >
                <DayDroppable date={dateStr}>
                  {weekTasks[dateStr] && weekTasks[dateStr].length === 0 ? <div className="text-gray-400">Belum ada tugas</div> : null}
                  {weekTasks[dateStr] ? weekTasks[dateStr].map((task) => (
                      <TaskItemDraggable key={task.id} task={task} id={task.id} />
                    )) : null}
                </DayDroppable>
              </ComponentCard>
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}

// Component for task pool
// Custom hook for drag end handling
function useDragEndHandler(
  taskPool: Task[],
  setTaskPool: (tasks: Task[]) => void,
  weekTasks: { [date: string]: Task[] },
  setWeekTasks: (tasks: { [date: string]: Task[] }) => void
) {
  return async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const overId = over.id as string;
    let movedTask: Task | null = null;
    let fromPool = false;
    let fromDate: string | null = null;
    const poolIdx = taskPool.findIndex((t) => t.id === taskId);
    if (poolIdx !== -1) {
      movedTask = taskPool[poolIdx];
      fromPool = true;
    } else {
      for (const date in weekTasks) {
        const idx = weekTasks[date].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          movedTask = weekTasks[date][idx];
          fromDate = date;
          break;
        }
      }
    }
    if (!movedTask) return;
    let newTaskPool = [...taskPool];
    const newWeekTasks = { ...weekTasks };
    if (overId === "task-pool") {
      if (!fromPool) {
        newTaskPool = [movedTask, ...newTaskPool];
        if (fromDate) {
          newWeekTasks[fromDate] = newWeekTasks[fromDate].filter((t) => t.id !== taskId);
        }
      }
    } else {
      if (fromPool) {
        newTaskPool = newTaskPool.filter((t) => t.id !== taskId);
        newWeekTasks[overId] = [movedTask, ...newWeekTasks[overId]];
      } else if (fromDate && fromDate !== overId) {
        newWeekTasks[fromDate] = newWeekTasks[fromDate].filter((t) => t.id !== taskId);
        newWeekTasks[overId] = [movedTask, ...newWeekTasks[overId]];
      }
    }
    setTaskPool(newTaskPool);
    setWeekTasks(newWeekTasks);
    let newDate: string | null = null;
    if (overId !== "task-pool") newDate = overId;
    const res = await scheduleTask(taskId, newDate);
    if (!res.success) {
      setTaskPool(taskPool);
      setWeekTasks(weekTasks);
      CustomToast.error("Gagal update tugas", res.message);
    } else {
      CustomToast.success("Tugas berhasil dijadwalkan");
    }
  };
}

function TaskPool({ taskPool, loading }: { taskPool: Task[]; loading: boolean }) {
  return (
    <section>
      <h4 className="text-base font-semibold mb-2">Kolam Tugas</h4>
      <ComponentCard title="Kolam Tugas" desc="Tugas yang belum terjadwal">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <DayDroppable date="task-pool">
            {taskPool.length === 0 && <div className="text-gray-400">Tidak ada tugas</div>}
            {taskPool.map((task) => (
              <TaskItemDraggable key={task.id} task={task} id={task.id} />
            ))}
          </DayDroppable>
        )}
      </ComponentCard>
    </section>
  );
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

  if (loading || toDontListLoading) {
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