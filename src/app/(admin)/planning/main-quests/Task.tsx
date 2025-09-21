import React, { useEffect } from 'react';
import { useTaskState } from './Task/hooks/useTaskState';
import TaskItem from './Task/components/TaskItem';
import { TaskItemSkeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  parent_task_id?: string | null;
  display_order?: number;
}

interface TaskProps {
  milestone: { id: string; title: string };
  milestoneNumber: number;
  onOpenSubtask?: (task: Task) => void;
  activeSubTask: Task | null;
}

export default function Task({ milestone, milestoneNumber, onOpenSubtask, activeSubTask }: TaskProps) {
  const {
    // State
    tasks,
    loadingTasks,
    newTaskInputs,
    setNewTaskInputs,
    newTaskLoading,
    activeTaskIdx,
    setActiveTaskIdx,
    
    // Actions
    fetchTasks,
    handleSaveTask,
    handleTaskEdit,
    handleNavigateUp,
    handleNavigateDown,
  } = useTaskState(milestone.id);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="rounded-lg mb-2">
      <label className="block mb-2 font-semibold">Langkah selanjutnya untuk mecapai Milestone {milestoneNumber} :</label>
      <div className="space-y-2 mb-2">
        {Array.from({ length: 3 }).map((_, idx) => {
            const task = tasks.find(t => t.display_order === idx + 1);
            if (task) {
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  onOpenSubtask={onOpenSubtask ? () => onOpenSubtask(task) : undefined}
                  active={activeSubTask?.id === task.id}
                  orderNumber={idx + 1}
                  onNavigateUp={() => handleNavigateUp(idx)}
                  onNavigateDown={() => handleNavigateDown(idx)}
                  canNavigateUp={idx > 0}
                  canNavigateDown={idx < 2}
                  onEdit={handleTaskEdit}
                  onClearActiveTaskIdx={() => setActiveTaskIdx(-1)}
                />
              );
            } else {
              const slotName = idx === 0 ? 'slot-0' : idx === 1 ? 'slot-1' : 'slot-2';
              return (
                <TaskItemSkeleton
                  key={`empty-task-${milestone.id}-${slotName}`}
                  orderNumber={idx + 1}
                  showButton={true}
                />
              );
            }
          })
        }
      </div>
    </div>
  );
}
