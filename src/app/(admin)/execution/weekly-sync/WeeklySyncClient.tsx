"use client";

import React, { useState, useEffect, useMemo } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import CustomToast from "@/components/ui/toast/CustomToast";
import { useWeek } from "@/hooks/useWeek";
import { DndContext, closestCenter, useDroppable, useDraggable, DragEndEvent } from "@dnd-kit/core";
import { formatDateIndo, daysOfWeek, getWeekDates } from "@/lib/dateUtils";
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from "@/lib/quarterUtils";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import WeeklyGoalsTable from "./WeeklyGoalsTable";
import ToDontListCard from "./ToDontListCard";
import Spinner from '@/components/ui/spinner/Spinner';
import { getWeeklyGoals, calculateGoalProgress, getWeeklyRules } from './actions';
import type { Rule } from './ToDontListCard';
import type { WeeklyGoal } from './WeeklyGoalsTable';

type Task = {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  milestone_id: string;
  parent_task_id: string | null;
};

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

// Import missing functions
const getUnscheduledTasks = async (year: number, quarter: number) =>
  (await import("../../planning/quests/actions")).getUnscheduledTasks(year, quarter);
const getScheduledTasksForWeek = async (startDate: string, endDate: string) =>
  (await import("../../planning/quests/actions")).getScheduledTasksForWeek(startDate, endDate);
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

export default function WeeklySyncClient() {
  const [currentWeek, setCurrentWeek] = useState(() => ensureMonday(new Date()));
  const [taskPool, setTaskPool] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<{ [date: string]: Task[] }>({});
  const [loading, setLoading] = useState(false);
  const { year, quarter } = useWeek();
  const weekDates = getWeekDates(currentWeek);
  // State untuk dropdown week
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [selectedWeekInQuarter, setSelectedWeekInQuarter] = useState<number | undefined>(undefined);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<{ [key: number]: { completed: number; total: number; percentage: number } }>({});
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [toDontList, setToDontList] = useState<Rule[]>([]);
  const [toDontListLoading, setToDontListLoading] = useState(true);

  // Optimized calculations using useMemo
  const weekCalculations = useMemo(() => {
    const currentWeekNumber = getWeekOfYear(currentWeek);
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    const weekInQuarter = Math.max(1, Math.min(totalWeeks, currentWeekNumber - startWeek + 1));
    const displayWeek = selectedWeekInQuarter ?? weekInQuarter;

    // Calculate week range using getDateFromWeek for consistency
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

  // Destructure for easier access
  const { displayWeek, totalWeeks, weekRangeLabel } = weekCalculations;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const startDate = weekDates[0].toISOString().slice(0, 10);
      const endDate = weekDates[6].toISOString().slice(0, 10);
      try {
        const [unscheduled, scheduled]: [Task[], Task[]] = await Promise.all([
          getUnscheduledTasks(year, quarter),
          getScheduledTasksForWeek(startDate, endDate),
        ]);
        setTaskPool(unscheduled);
        const grouped: { [date: string]: Task[] } = {};
        weekDates.forEach((d) => {
          const key = d.toISOString().slice(0, 10);
          grouped[key] = [];
        });
        scheduled.forEach((task: Task) => {
          const key = task.scheduled_date?.slice(0, 10);
          if (key && grouped[key]) grouped[key].push(task);
        });
        setWeekTasks(grouped);
      } catch (e: unknown) {
        const msg = typeof e === 'object' && e && 'message' in e ? (e as { message: string }).message : 'Unknown error';
        CustomToast.error("Gagal memuat data", msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek, year, quarter]);

  useEffect(() => {
    setToDontListLoading(true);
    getWeeklyRules(year, displayWeek).then(data => {
      setToDontList(data);
      setToDontListLoading(false);
    });
  }, [year, displayWeek, refreshFlag]);

  useEffect(() => {
    const fetchGoals = async () => {
      const fetchedGoals = await getWeeklyGoals(year, displayWeek);
      setGoals(fetchedGoals);
      // Hitung progress untuk setiap goal slot
      const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
      await Promise.all(
        fetchedGoals.map(async (goal) => {
          if (goal.items.length > 0) {
            const progress = await calculateGoalProgress(goal.items);
            progressData[goal.goal_slot as number] = progress;
          } else {
            progressData[goal.goal_slot as number] = { completed: 0, total: 0, percentage: 0 };
          }
        })
      );
      setGoalProgress(progressData);
    };
    fetchGoals();
  }, [year, displayWeek, refreshFlag]);

  // Handler untuk refresh data dari child
  const handleRefreshGoals = () => setRefreshFlag(f => f + 1);
  const handleRefreshToDontList = () => setRefreshFlag(f => f + 1);

  const handleDragEnd = async (event: DragEndEvent) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

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
      <div className="flex justify-center items-center min-h-[600px]">
        <Spinner size={164} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 pt-0">
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hidden">
        <div className="text-sm">
          <strong>Debug:</strong>
          <div>
            Quarter: {quarter} <br />
            Week: {weekDates[0].toISOString().slice(0, 10)} - {weekDates[6].toISOString().slice(0, 10)} <br/> <br/>
            Week {displayWeek} <br/>
            {weekRangeLabel}
            {/* <div className="text-xs text-gray-500 mt-1 text-center">
            </div> */}
          </div>
        </div>
        <div className="text-sm">Loading: {loading ? "Yes" : "No"}, Task Pool: {taskPool.length} tasks</div>
      </div>

      {/* Header: Judul halaman kiri, navigasi minggu kanan */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Weekly Sync</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={goPrevWeek} disabled={displayWeek <= 1}>
            &lt;
          </Button>
          {/* Dropdown Week Selector */}
          <div className="relative">
            <button
              className="flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
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
          <Button size="sm" variant="outline" onClick={goNextWeek} disabled={displayWeek >= totalWeeks}>
            &gt;
          </Button>
        </div>
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
        {/* Kolom Kiri: Kolam Tugas */}
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
        {/* Kolom Kanan: Kalender Mingguan */}
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
                      {weekTasks[dateStr] && weekTasks[dateStr].length === 0 && (
                        <div className="text-gray-400">Belum ada tugas</div>
                      )}
                      {weekTasks[dateStr] &&
                        weekTasks[dateStr].map((task) => (
                          <TaskItemDraggable key={task.id} task={task} id={task.id} />
                        ))}
                    </DayDroppable>
                  </ComponentCard>
                );
              })}
            </div>
          </DndContext>
        </section>
      </div>
    </div>
  );
} 