"use client";

import { DndContext, closestCenter, useDroppable, useDraggable, DragEndEvent } from "@dnd-kit/core";
import React, { useMemo } from "react";

import { scheduleTask } from "@/app/(admin)/planning/quests/actions";
import ComponentCard from "@/components/common/ComponentCard";
import CustomToast from "@/components/ui/toast/CustomToast";
import { formatDateIndo, daysOfWeek } from "@/lib/dateUtils";

type Task = {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  milestone_id: string;
  parent_task_id: string | null;
};

interface TaskDragDropProps {
  taskPool: Task[];
  setTaskPool: (tasks: Task[]) => void;
  weekTasks: { [date: string]: Task[] };
  setWeekTasks: (tasks: { [date: string]: Task[] }) => void;
  weekDates: Date[];
  loading: boolean;
}

// Droppable component for task pool
function TaskPoolDroppable({ taskPool, loading }: { taskPool: Task[], loading: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'task-pool',
  });

  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <ComponentCard title="Kolam Tugas" className="h-[600px] overflow-y-auto">
      <div ref={setNodeRef} style={style} className="space-y-2">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        ) : taskPool.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Semua tugas sudah terjadwal
          </div>
        ) : (
          taskPool.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))
        )}
      </div>
    </ComponentCard>
  );
}

// Draggable component for individual task
function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-white dark:bg-gray-800 rounded border cursor-move hover:shadow-md transition-shadow"
    >
      <div className="font-medium text-sm">{task.title}</div>
      <div className="text-xs text-gray-500 mt-1">
        Status: {task.status}
      </div>
    </div>
  );
}

// Droppable component for each day
function DayDroppable({ date, tasks }: { date: Date, tasks: Task[] }) {
  const { isOver, setNodeRef } = useDroppable({
    id: date.toISOString().slice(0, 10),
  });

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
  };

  return (
    <div className="border rounded p-3 min-h-[120px]" style={style}>
      <div ref={setNodeRef} className="space-y-2">
        <div className="font-medium text-sm text-center">
          {formatDateIndo(date)}
        </div>
        <div className="text-xs text-gray-500 text-center">
          {daysOfWeek[date.getDay()]}
        </div>
        <div className="space-y-1">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Task calendar component
function TaskCalendar({ weekDates, weekTasks, handleDragEnd }: {
  weekDates: Date[];
  weekTasks: { [date: string]: Task[] };
  handleDragEnd: (event: DragEndEvent) => void;
}) {
  const weekTasksArray = useMemo(() => {
    return weekDates.map((date) => {
      const dateKey = date.toISOString().slice(0, 10);
      return {
        date,
        tasks: weekTasks[dateKey] || [],
      };
    });
  }, [weekDates, weekTasks]);

  return (
    <ComponentCard title="Kalender Mingguan" className="h-[600px] overflow-y-auto">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-3">
          {weekTasksArray.map(({ date, tasks }) => (
            <DayDroppable
              key={date.toISOString()}
              date={date}
              tasks={tasks}
            />
          ))}
        </div>
      </DndContext>
    </ComponentCard>
  );
}

// Main Task Pool component
function TaskPool({ taskPool, loading }: { taskPool: Task[], loading: boolean }) {
  return <TaskPoolDroppable taskPool={taskPool} loading={loading} />;
}

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

    // Find the task being moved
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

    // Create new state
    let newTaskPool = [...taskPool];
    const newWeekTasks = { ...weekTasks };

    if (overId === "task-pool") {
      // Moving to task pool
      if (!fromPool) {
        newTaskPool = [movedTask, ...newTaskPool];
        if (fromDate) {
          newWeekTasks[fromDate] = newWeekTasks[fromDate].filter((t) => t.id !== taskId);
        }
      }
    } else {
      // Moving to a specific date
      if (fromPool) {
        newTaskPool = newTaskPool.filter((t) => t.id !== taskId);
        newWeekTasks[overId] = [movedTask, ...newWeekTasks[overId]];
      } else if (fromDate && fromDate !== overId) {
        newWeekTasks[fromDate] = newWeekTasks[fromDate].filter((t) => t.id !== taskId);
        newWeekTasks[overId] = [movedTask, ...newWeekTasks[overId]];
      }
    }

    // Update state optimistically
    setTaskPool(newTaskPool);
    setWeekTasks(newWeekTasks);

    // Make API call
    let newDate: string | null = null;
    if (overId !== "task-pool") newDate = overId;

    const res = await scheduleTask(taskId, newDate);
    if (!res.success) {
      // Revert on error
      setTaskPool(taskPool);
      setWeekTasks(weekTasks);
      CustomToast.error("Gagal update tugas", res.message);
    } else {
      CustomToast.success("Tugas berhasil dijadwalkan");
    }
  };
}

export default function TaskDragDrop({
  taskPool,
  setTaskPool,
  weekTasks,
  setWeekTasks,
  weekDates,
  loading,
}: TaskDragDropProps) {
  const handleDragEnd = useDragEndHandler(taskPool, setTaskPool, weekTasks, setWeekTasks);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TaskPool taskPool={taskPool} loading={loading} />
      <TaskCalendar weekDates={weekDates} weekTasks={weekTasks} handleDragEnd={handleDragEnd} />
    </div>
  );
} 