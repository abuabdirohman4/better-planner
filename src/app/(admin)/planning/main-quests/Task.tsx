import React, { useEffect } from 'react';
import { useTaskState } from './Task/hooks/useTaskState';
import TaskItem from './Task/components/TaskItem';

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
        {!loadingTasks && (
          Array.from({ length: 3 }).map((_, idx) => {
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
                <div 
                  key={`empty-task-${milestone.id}-${slotName}`} 
                  className={`flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg mb-3 pl-2 pr-4 py-2 shadow-sm border transition group hover:shadow-md cursor-pointer ${
                    activeTaskIdx === idx && activeTaskIdx !== -1 ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    // Set active state and close SubTask when clicking empty slot
                    setActiveTaskIdx(idx);
                    if (onOpenSubtask) {
                      onOpenSubtask(null as any);
                    }
                  }}
                >
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
                      onClick={e => {
                        e.stopPropagation();
                        setActiveTaskIdx(idx);
                      }}
                      onFocus={() => {
                        setActiveTaskIdx(idx);
                      }}
                      disabled={newTaskLoading[idx]}
                      data-task-idx={idx}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveTask(idx);
                      }}
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
