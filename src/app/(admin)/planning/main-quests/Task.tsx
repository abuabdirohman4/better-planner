import { useState, useEffect, useRef } from 'react';

import { getTasksForMilestone, addTask, updateTask } from '../quests/actions';

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

interface TaskItemInlineProps {
  task: Task;
  onOpenSubtask?: () => void;
  orderNumber?: number;
  active?: boolean;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  canNavigateUp?: boolean;
  canNavigateDown?: boolean;
  onEdit: (taskId: string, newTitle: string) => void;
}

// Inline TaskItem component - simplified version
function TaskItemInline({ 
  task, 
  onOpenSubtask, 
  orderNumber, 
  active, 
  onNavigateUp, 
  onNavigateDown, 
  canNavigateUp = true, 
  canNavigateDown = true,
  onEdit
}: TaskItemInlineProps) {
  const [editValue, setEditValue] = useState(task.title);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasChanges(newValue.trim() !== task.title);
  };

  const handleSave = async () => {
    if (editValue.trim() === task.title) {
      setHasChanges(false);
      return; // No changes
    }
    
    setIsSaving(true);
    try {
      await onEdit(task.id, editValue.trim());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className={`flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg mb-3 pl-2 pr-4 py-2 shadow-sm border transition group hover:shadow-md cursor-pointer ${active ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
      onClick={() => onOpenSubtask?.()}
    >
      <div className='flex gap-2 w-full items-center'>
        {orderNumber ? <span className="font-medium text-lg w-6 text-center select-none">{orderNumber}.</span> : null}
        <input
          className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 font-medium focus:outline-none transition-all"
          value={editValue}
          onChange={handleEditChange}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (canNavigateUp && onNavigateUp) {
                onNavigateUp();
              }
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (canNavigateDown && onNavigateDown) {
                onNavigateDown();
              }
            }
          }}
          onBlur={() => {
            if (hasChanges) {
              handleSave();
            }
          }}
          onClick={e => {
            e.stopPropagation();
            onOpenSubtask?.();
          }}
          onFocus={() => {
            onOpenSubtask?.();
          }}
          ref={editInputRef}
          data-task-idx={orderNumber ? orderNumber - 1 : 0}
          placeholder=""
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={!hasChanges || isSaving}
          className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 w-16 justify-center"
          title="Klik untuk menyimpan atau tekan Enter"
        >
          {isSaving ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Editing...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Task({ milestone, milestoneNumber, onOpenSubtask, activeSubTask }: TaskProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskInputs, setNewTaskInputs] = useState(['', '', '']);
  const [newTaskLoading, setNewTaskLoading] = useState([false, false, false]);
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await getTasksForMilestone(milestone.id);
      // Filter dan urutkan berdasarkan display_order
      const filteredTasks = (data || []).filter((t: Task) => !t.parent_task_id);
      const sortedTasks = filteredTasks.sort((a: Task, b: Task) => (a.display_order || 0) - (b.display_order || 0));
      setTasks(sortedTasks);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Function to save new task
  const handleSaveTask = async (idx: number) => {
    const val = newTaskInputs[idx];
    if (!val.trim()) return;

    setNewTaskLoading(l => l.map((v, i) => i === idx ? true : v));
    try {
      const formData = new FormData();
      formData.append('milestone_id', milestone.id);
      formData.append('title', val.trim());
      formData.append('display_order', String(idx + 1)); // Kirim posisi yang sesuai (1-based)
      await addTask(formData);
      fetchTasks();
      setNewTaskInputs(inputs => inputs.map((v, i) => i === idx ? '' : v));
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setNewTaskLoading(l => l.map((v, i) => i === idx ? false : v));
    }
  };

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

  // Task editing functions
  const handleTaskEdit = async (taskId: string, newTitle: string) => {
    try {
      await updateTask(taskId, newTitle.trim());
      // Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: newTitle.trim() } : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="rounded-lg mb-2">
        <label className="block mb-2 font-semibold">Langkah selanjutnya untuk mecapai Milestone {milestoneNumber} :</label>
        <div className="space-y-2 mb-2">
          {!loadingTasks && (
            Array.from({ length: 3 }).map((_, idx) => {
              const task = tasks.find(t => t.display_order === idx + 1);
              if (task) {
                return (
                  <TaskItemInline
                    key={task.id}
                    task={task}
                    onOpenSubtask={onOpenSubtask ? () => onOpenSubtask(task) : undefined}
                    active={activeSubTask?.id === task.id || activeTaskIdx === idx}
                    orderNumber={idx + 1}
                    onNavigateUp={() => handleNavigateUp(idx)}
                    onNavigateDown={() => handleNavigateDown(idx)}
                    canNavigateUp={idx > 0}
                    canNavigateDown={idx < 2}
                    onEdit={handleTaskEdit}
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
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveTask(idx);
                          } else if (e.key === 'ArrowUp') {
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveTask(idx)}
                        disabled={!newTaskInputs[idx].trim() || newTaskLoading[idx]}
                        className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 w-16 justify-center"
                      >
                        {newTaskLoading[idx] ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save
                          </>
                        )}
                      </button>
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