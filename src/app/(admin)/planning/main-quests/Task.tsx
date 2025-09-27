import React, { useEffect } from 'react';
import { useTasks } from './hooks/useMainQuestsSWR';
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
  showCompletedTasks: boolean;
}

export default function Task({ milestone, milestoneNumber, onOpenSubtask, activeSubTask, showCompletedTasks }: TaskProps) {
  const {
    tasks,
    isLoading: loadingTasks,
    mutate: refetchTasks,
  } = useTasks(milestone.id);
  

  // For now, keep the old state management for task editing
  // TODO: Migrate task editing to use SWR and RPC
  const [newTaskInputs, setNewTaskInputs] = React.useState(['', '', '']);
  const [newTaskLoading, setNewTaskLoading] = React.useState([false, false, false]);
  const [activeTaskIdx, setActiveTaskIdx] = React.useState(0);

  // Import task actions for editing
  const { handleSaveTask, handleTaskEdit, handleNavigateUp, handleNavigateDown } = React.useMemo(() => {
    // This is a temporary solution - we'll migrate these to RPC later
    return {
      handleSaveTask: async (idx: number) => {
        // Placeholder - will be implemented with RPC
      },
      handleTaskEdit: async (taskId: string, newTitle: string) => {
        // Placeholder - will be implemented with RPC
      },
      handleNavigateUp: (currentIdx: number) => {
        if (currentIdx > 0) {
          setActiveTaskIdx(currentIdx - 1);
        }
      },
      handleNavigateDown: (currentIdx: number) => {
        if (currentIdx < 2) {
          setActiveTaskIdx(currentIdx + 1);
        }
      },
    };
  }, []);

  // Filter tasks based on showCompletedTasks state
  const filteredTasks = showCompletedTasks 
    ? tasks 
    : tasks.filter((task: any) => task.status !== 'DONE');

  return (
    <div className="rounded-lg mb-2">
      <label className="block mb-2 font-semibold">Langkah selanjutnya untuk mecapai Milestone {milestoneNumber} :</label>
      <div className="space-y-2 mb-2">
        {Array.from({ length: 3 }).map((_, idx) => {
            const task = filteredTasks.find((t: any) => t.display_order === idx + 1);
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
