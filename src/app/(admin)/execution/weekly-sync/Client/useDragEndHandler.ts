import { DragEndEvent } from '@dnd-kit/core';
import CustomToast from '@/components/ui/toast/CustomToast';
import type { Task } from '../types';

// Import missing functions
const scheduleTask = async (taskId: string, newScheduledDate: string | null) =>
  (await import("../../../planning/quests/actions")).scheduleTask(taskId, newScheduledDate);

export function useDragEndHandler(
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
