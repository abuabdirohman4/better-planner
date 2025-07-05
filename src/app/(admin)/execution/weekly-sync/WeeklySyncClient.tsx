"use client";

import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import CustomToast from "@/components/ui/toast/CustomToast";
import QuarterSelector from "@/components/common/QuarterSelector";
import { Suspense } from "react";
import { useQuarter } from "@/hooks/useQuarter";
import { DndContext, closestCenter, useDroppable, useDraggable, DragEndEvent } from "@dnd-kit/core";
import { formatDateIndo, daysOfWeek, getWeekDates } from "@/lib/dateUtils";
// Dynamic import server actions
const getUnscheduledTasks = async (year: number, quarter: number) =>
  (await import("../../planning/quests/actions")).getUnscheduledTasks(year, quarter);
const getScheduledTasksForWeek = async (startDate: string, endDate: string) =>
  (await import("../../planning/quests/actions")).getScheduledTasksForWeek(startDate, endDate);
const scheduleTask = async (taskId: string, newScheduledDate: string | null) =>
  (await import("../../planning/quests/actions")).scheduleTask(taskId, newScheduledDate);

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

export default function WeeklySyncClient() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [taskPool, setTaskPool] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<{ [date: string]: Task[] }>({});
  const [loading, setLoading] = useState(false);
  const quarterData = useQuarter();
  const weekDates = getWeekDates(currentWeek);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const startDate = weekDates[0].toISOString().slice(0, 10);
      const endDate = weekDates[6].toISOString().slice(0, 10);
      try {
        const [unscheduled, scheduled]: [Task[], Task[]] = await Promise.all([
          getUnscheduledTasks(quarterData.year, quarterData.quarter),
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
  }, [currentWeek, quarterData.year, quarterData.quarter]);

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

  const goPrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prev);
  };
  const goNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(next);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header dengan Quarter Selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Weekly Sync</h2>
        <Suspense fallback={<div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
          <QuarterSelector />
        </Suspense>
      </div>
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-sm">
          <strong>Debug:</strong> Quarter: {quarterData.quarterString}, 
          Week: {weekDates[0].toISOString().slice(0, 10)} - {weekDates[6].toISOString().slice(0, 10)}
        </p>
        <p className="text-sm">Loading: {loading ? "Yes" : "No"}, Task Pool: {taskPool.length} tasks</p>
      </div>
      <div className="flex items-center justify-between mb-6">
        <Button size="sm" variant="outline" onClick={goPrevWeek}>
          &lt;
        </Button>
        <h3 className="text-lg font-semibold">Minggu Ini</h3>
        <Button size="sm" variant="outline" onClick={goNextWeek}>
          &gt;
        </Button>
      </div>
      {/* Layout: Kolam Tugas kiri, Kalender Mingguan kanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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