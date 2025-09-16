import { useState, useEffect } from 'react';

import { getTasksForMilestone, addTask } from '../quests/actions';

import TaskItem from './TaskItem';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  parent_task_id?: string | null;
}

interface MilestoneItemProps {
  milestone: { id: string; title: string };
  milestoneNumber: number;
  onOpenSubtask?: (task: Task) => void;
  activeSubTask: Task | null;
}

export default function MilestoneItem({ milestone, milestoneNumber, onOpenSubtask, activeSubTask }: MilestoneItemProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskInputs, setNewTaskInputs] = useState(['', '', '']);
  const [newTaskLoading, setNewTaskLoading] = useState([false, false, false]);
  const [lastSubmittedTask, setLastSubmittedTask] = useState(['', '', '']);
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await getTasksForMilestone(milestone.id);
      setTasks((data || []).filter((t: Task) => !t.parent_task_id)); // hanya tugas utama
    } finally {
      setLoadingTasks(false);
    }
  };

  // Debounce submit task utama berbasis useEffect per slot (3 useEffect terpisah)
  useEffect(() => {
    const val = newTaskInputs[0];
    if (!val || val === lastSubmittedTask[0]) return;
    const handler = setTimeout(async () => {
      setNewTaskLoading(l => l.map((v, i) => i === 0 ? true : v));
      try {
        const formData = new FormData();
        formData.append('milestone_id', milestone.id);
        formData.append('title', val);
        await addTask(formData);
        fetchTasks();
        setNewTaskInputs(inputs => inputs.map((v, i) => i === 0 ? '' : v));
        setLastSubmittedTask(vals => vals.map((v, i) => i === 0 ? val : v));
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 0 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[0], milestone.id]);

  useEffect(() => {
    const val = newTaskInputs[1];
    if (!val || val === lastSubmittedTask[1]) return;
    const handler = setTimeout(async () => {
      setNewTaskLoading(l => l.map((v, i) => i === 1 ? true : v));
      try {
        const formData = new FormData();
        formData.append('milestone_id', milestone.id);
        formData.append('title', val);
        await addTask(formData);
        fetchTasks();
        setNewTaskInputs(inputs => inputs.map((v, i) => i === 1 ? '' : v));
        setLastSubmittedTask(vals => vals.map((v, i) => i === 1 ? val : v));
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 1 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[1], milestone.id]);

  useEffect(() => {
    const val = newTaskInputs[2];
    if (!val || val === lastSubmittedTask[2]) return;
    const handler = setTimeout(async () => {
      setNewTaskLoading(l => l.map((v, i) => i === 2 ? true : v));
      try {
        const formData = new FormData();
        formData.append('milestone_id', milestone.id);
        formData.append('title', val);
        await addTask(formData);
        fetchTasks();
        setNewTaskInputs(inputs => inputs.map((v, i) => i === 2 ? '' : v));
        setLastSubmittedTask(vals => vals.map((v, i) => i === 2 ? val : v));
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 2 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[2], milestone.id]);

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone.id]);

  // Navigation functions for keyboard support
  const handleNavigateUp = (currentIdx: number) => {
    if (currentIdx > 0) {
      setActiveTaskIdx(currentIdx - 1);
      // Focus the input in the previous task
      setTimeout(() => {
        const prevInput = document.querySelector(`input[data-task-idx="${currentIdx - 1}"]`) as HTMLInputElement;
        prevInput?.focus();
      }, 0);
    }
  };

  const handleNavigateDown = (currentIdx: number) => {
    if (currentIdx < 2) {
      setActiveTaskIdx(currentIdx + 1);
      // Focus the input in the next task
      setTimeout(() => {
        const nextInput = document.querySelector(`input[data-task-idx="${currentIdx + 1}"]`) as HTMLInputElement;
        nextInput?.focus();
      }, 0);
    }
  };

  return (
    <div className="rounded-lg mb-2">
        <label className="block mb-2 font-semibold">Langkah selanjutnya untuk mecapai Milestone {milestoneNumber} :</label>
        <div className="space-y-2 mb-2">
          {loadingTasks ? (
            <p className="text-gray-400 text-sm">Memuat tugas utama...</p>
          ) : (
            Array.from({ length: 3 }).map((_, idx) => {
              const task = tasks[idx];
              if (task) {
                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onOpenSubtask={onOpenSubtask ? () => onOpenSubtask(task) : undefined}
                    active={activeSubTask?.id === task.id || activeTaskIdx === idx}
                    orderNumber={idx + 1}
                    onNavigateUp={() => handleNavigateUp(idx)}
                    onNavigateDown={() => handleNavigateDown(idx)}
                    canNavigateUp={idx > 0}
                    canNavigateDown={idx < 2}
                  />
                );
              } else {
                const slotName = idx === 0 ? 'slot-0' : idx === 1 ? 'slot-1' : 'slot-2';
                return (
                  <div key={`empty-task-${milestone.id}-${slotName}`} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg mb-3 pl-2 pr-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 transition">
                    <div className='flex gap-2 w-3/4'>
                      <span className="font-medium text-lg w-6 text-center select-none">{idx + 1}.</span>
                      <input
                        key={`input-${milestone.id}-${slotName}`}
                        className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 focus:outline-none focus:ring-0"
                        placeholder="Tambah langkah untuk milestone..."
                        value={newTaskInputs[idx]}
                        onChange={e => {
                          const val = e.target.value;
                          setNewTaskInputs(inputs => inputs.map((v, i) => i === idx ? val : v));
                        }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (idx > 0) {
                              setActiveTaskIdx(idx - 1);
                              setTimeout(() => {
                                const prevInput = document.querySelector(`input[data-task-idx="${idx - 1}"]`) as HTMLInputElement;
                                prevInput?.focus();
                              }, 0);
                            }
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (idx < 2) {
                              setActiveTaskIdx(idx + 1);
                              setTimeout(() => {
                                const nextInput = document.querySelector(`input[data-task-idx="${idx + 1}"]`) as HTMLInputElement;
                                nextInput?.focus();
                              }, 0);
                            }
                          }
                        }}
                        disabled={newTaskLoading[idx]}
                        data-task-idx={idx}
                        />
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
    </div>
  );
} 