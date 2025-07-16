"use client";
import React, { useState, useTransition } from "react";
import Spinner from '@/components/ui/spinner/Spinner';
import { useActivityStore } from '@/stores/activityStore';
import useSWR from 'swr';
import { getDailyPlan, addSideQuest, updateDailyPlanItemStatus, setDailyPlan, updateDailySessionTarget, getTasksForWeek, countCompletedSessions } from "./actions";

// SWR-based hooks
const useDailyPlan = (date: string) => {
    const { data, error, mutate, isLoading } = useSWR(['dailyPlan', date], () => getDailyPlan(date));
    return { dailyPlan: data, error, mutate, isLoading };
};

const useTasksForWeek = (year: number, weekNumber: number) => {
    const { data, error, mutate, isLoading } = useSWR(['tasksForWeek', year, weekNumber], () => getTasksForWeek(year, weekNumber));
    return { tasks: data, error, mutate, isLoading };
};

const useCompletedSessions = (itemId: string, date: string, lastActivityTimestamp: number) => {
    const { data, error, isLoading, mutate } = useSWR(['completedSessions', itemId, date, lastActivityTimestamp], () => countCompletedSessions(itemId, date));
    return { completedCount: data, error, isLoading, mutate };
};

// Interfaces
interface WeeklyTaskItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  status: string;
  quest_title: string;
  goal_slot: number;
}
export interface DailyPlanItem {
  id: string;
  item_id: string;
  item_type: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  title?: string;
  quest_title?: string;
  daily_session_target?: number;
}
export interface DailyPlan {
  id: string;
  plan_date: string;
  daily_plan_items: DailyPlanItem[];
}
interface DailySyncClientProps {
  year: number;
  quarter: number;
  weekNumber: number;
  selectedDate: string;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string }) => void;
  dailyPlan: DailyPlan | null;
  setDailyPlanState: (plan: DailyPlan | null) => void;
  setDailyPlanAction?: typeof setDailyPlan;
  loading: boolean;
}

// Custom hook for task session management
function useTaskSession(item: DailyPlanItem, selectedDate: string) {
  const [target, setTarget] = React.useState(item.daily_session_target ?? 1);
  const [savingTarget, setSavingTarget] = React.useState(false);
  const lastActivityTimestamp = useActivityStore((state) => state.lastActivityTimestamp);

  const { completedCount, isLoading } = useCompletedSessions(item.id, selectedDate || '', lastActivityTimestamp);
  
  // Update target when item changes
  React.useEffect(() => {
    setTarget(item.daily_session_target ?? 1);
  }, [item.daily_session_target]);

  const handleTargetChange = async (newTarget: number, onTargetChange?: (itemId: string, newTarget: number) => void) => {
    if (newTarget < 1) return;
    setSavingTarget(true);
    setTarget(newTarget);
    try {
      await updateDailySessionTarget(item.id, newTarget);
      if (onTargetChange) onTargetChange(item.id, newTarget);
    } finally {
      setSavingTarget(false);
    }
  };

  return {
    completed: completedCount || 0,
    loading: isLoading,
    target,
    savingTarget,
    handleTargetChange
  };
}

// Component for task card
const TaskCard: React.FC<{
  item: DailyPlanItem;
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string }) => void;
  selectedDate?: string;
  onTargetChange?: (itemId: string, newTarget: number) => void;
}> = ({ item, onStatusChange, onSetActiveTask, selectedDate, onTargetChange }) => {
  const { completed, loading, target, savingTarget, handleTargetChange } = useTaskSession(item, selectedDate || '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {onSetActiveTask ? (
            <button
              className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              onClick={() => onSetActiveTask({
                id: item.item_id,
                title: item.title || `Task ${item.item_id}`,
                item_type: item.item_type
              })}
              title="Mulai Pomodoro"
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15"/>
                <polygon points="8,6 14,10 8,14" fill="currentColor"/>
              </svg>
            </button>
          ) : null}
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
            {item.title || `Task ${item.item_id}`}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1 text-xs">
            {loading ? (
              <span className="text-gray-400"><Spinner size={16} /></span>
            ) : (
              <span className="font-semibold">({completed} / {target})</span>
            )}
            <button
              className="px-1 text-lg text-gray-500 hover:text-brand-600 disabled:opacity-50"
              disabled={savingTarget || target <= 1}
              onClick={() => handleTargetChange(target - 1, onTargetChange)}
              aria-label="Kurangi target"
            >–</button>
            <button
              className="px-1 text-lg text-gray-500 hover:text-brand-600 disabled:opacity-50"
              disabled={savingTarget}
              onClick={() => handleTargetChange(target + 1, onTargetChange)}
              aria-label="Tambah target"
            >+</button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {item.quest_title ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {item.quest_title}
          </div>
        ) : <div />}
        <div className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={item.status === 'DONE'}
            onChange={(e) => onStatusChange(item.item_id, e.target.checked ? 'DONE' : 'TODO')}
            className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-2"
          />
        </div>
      </div>
    </div>
  );
};

// Component for side quest form
function SideQuestForm({ onSubmit, onCancel }: { onSubmit: (title: string) => void; onCancel: () => void }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    startTransition(async () => {
      await onSubmit(newTaskTitle);
      setNewTaskTitle('');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Masukkan judul side quest..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim() || isPending}
          className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
        >
          {isPending ? 'Menambah...' : 'Tambah'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

// Component for task column
const TaskColumn: React.FC<{
  title: string;
  items: DailyPlanItem[];
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onAddSideQuest?: (title: string) => void;
  onSelectTasks?: () => void;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string }) => void;
  selectedDate?: string;
  onTargetChange?: (itemId: string, newTarget: number) => void;
  showAddQuestButton?: boolean;
}> = ({ title, items, onStatusChange, onAddSideQuest, onSelectTasks, onSetActiveTask, selectedDate, onTargetChange, showAddQuestButton }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSideQuest = (title: string) => {
    if (onAddSideQuest) {
      onAddSideQuest(title);
      setShowAddForm(false);
    }
  };

  return (
    <div className="rounded-lg h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
        {onAddSideQuest ? (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          >+ Tambah Side Quest</button>
        ) : null}
      </div>

      {showAddForm && onAddSideQuest ? (
        <SideQuestForm
          onSubmit={handleAddSideQuest}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <TaskCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onSetActiveTask={onSetActiveTask}
            selectedDate={selectedDate}
            onTargetChange={onTargetChange}
          />
        ))}
        {items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-6 py-8">Tidak ada tugas {title.toLowerCase()} hari ini</p>
            {onSelectTasks ? (
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={onSelectTasks}
                  className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
                >Tambah Quest</button>
              </div>
            ) : null}
          </div>
        ) : null}
        
        {showAddQuestButton && items.length > 0 ? (
          <div className="flex justify-center mt-6">
            <button 
              className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
              onClick={onSelectTasks}
            >Tambah Quest</button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Component for task selection modal
const TaskSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tasks: WeeklyTaskItem[];
  selectedTasks: Record<string, boolean>;
  onTaskToggle: (taskId: string) => void;
  onSave: () => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, tasks, selectedTasks, onTaskToggle, onSave, isLoading }) => {
  if (!isOpen) return null;

  const groupByGoalSlot = (tasks: WeeklyTaskItem[]) => {
    const groups: Record<number, WeeklyTaskItem[]> = {};
    tasks.forEach(task => {
      if (!groups[task.goal_slot]) {
        groups[task.goal_slot] = [];
      }
      groups[task.goal_slot].push(task);
    });
    return groups;
  };
  
  const groupedTasks = groupByGoalSlot(tasks);
  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kelola Rencana Harian</h2>
          <p className="text-gray-600 mb-2">
            Tugas yang sudah tercentang adalah yang sudah ada di rencana harian. Anda bisa menambah atau menghapus tugas sesuai kebutuhan.
          </p>
          <p className="text-blue-600 font-medium">
            {selectedCount} tugas dipilih
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([goalSlot, slotTasks]) => (
              <div key={goalSlot} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Goal Mingguan {goalSlot}</h3>
                <div className="space-y-3">
                  {slotTasks.map((task) => {
                    const isSelected = selectedTasks[task.id] || false;
                    return (
                      <div 
                        key={task.id} 
                        className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTaskToggle(task.id)}
                          className={`w-4 h-4 rounded focus:ring-2 ${
                            isSelected
                              ? 'text-blue-600 bg-blue-600 border-blue-600 focus:ring-blue-500'
                              : 'text-brand-500 bg-gray-100 border-gray-300 focus:ring-brand-500'
                          }`}
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium block ${
                            isSelected ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </span>
                          <span className={`text-xs block ${
                            isSelected ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {task.quest_title} • {task.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >Batal</button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 font-medium"
          >Pilih ({selectedCount} Quest)</button>
        </div>
      </div>
    </div>
  );
};

// Custom hook for daily plan management
function useDailyPlanManagement(
  year: number,
  weekNumber: number,
  selectedDate: string,
  dailyPlan: DailyPlan | null,
  setDailyPlanState: (plan: DailyPlan | null) => void,
  setDailyPlanAction?: typeof setDailyPlan
) {
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [, startTransition] = useTransition();
  const { tasks: weeklyTasks, mutate } = useTasksForWeek(year, weekNumber);

  const getCurrentDailyPlanSelections = () => {
    if (!dailyPlan?.daily_plan_items) return {};
    const selections: Record<string, boolean> = {};
    dailyPlan.daily_plan_items.forEach(item => {
      selections[item.item_id] = true;
    });
    return selections;
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    setModalLoading(true);
    const currentSelections = getCurrentDailyPlanSelections();
    setSelectedTasks(currentSelections);
    try {
      await mutate();
    } catch (err) {
      console.error('Error loading weekly tasks:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSaveSelection = async () => {
    const selectedItems = Object.entries(selectedTasks)
      .filter(([, selected]) => selected)
      .map(([taskId]) => {
        const task = weeklyTasks?.find((t: WeeklyTaskItem) => t.id === taskId);
        return {
          item_id: taskId,
          item_type: task?.type || 'TASK'
        };
      });
    if (selectedItems.length === 0) return;
    startTransition(async () => {
      try {
        if (setDailyPlanAction) {
          await setDailyPlanAction(selectedDate, selectedItems);
        }
        const plan = await getDailyPlan(selectedDate);
        setDailyPlanState(plan);
        setShowModal(false);
      } catch (err) {
        console.error('Error saving daily plan:', err);
      }
    });
  };

  const handleStatusChange = async (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    startTransition(async () => {
      try {
        await updateDailyPlanItemStatus(itemId, status);
        if (dailyPlan) {
          setDailyPlanState({
            ...dailyPlan,
            daily_plan_items: dailyPlan.daily_plan_items?.map((item: DailyPlanItem) =>
              item.item_id === itemId ? { ...item, status } : item
            )
          });
        }
      } catch (err) {
        console.error('Error updating task status:', err);
      }
    });
  };

  const handleAddSideQuest = async (title: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('date', selectedDate);
        await addSideQuest(formData);
        const plan = await getDailyPlan(selectedDate);
        setDailyPlanState(plan);
      } catch (err) {
        console.error('Error adding side quest:', err);
      }
    });
  };

  const handleTargetChange = (itemId: string, newTarget: number) => {
    if (!dailyPlan) return;
    setDailyPlanState({
      ...dailyPlan,
      daily_plan_items: dailyPlan.daily_plan_items?.map((item: DailyPlanItem) =>
        item.id === itemId ? { ...item, daily_session_target: newTarget } : item
      )
    });
  };

  return {
    weeklyTasks: weeklyTasks || [],
    selectedTasks,
    showModal,
    setShowModal,
    modalLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleTargetChange
  };
}

const groupItemsByType = (items: DailyPlanItem[] = []) => {
  const groups = {
    'MAIN_QUEST': [] as DailyPlanItem[],
    'SIDE_QUEST': [] as DailyPlanItem[]
  };
  items.forEach(item => {
    if (['QUEST', 'TASK', 'SUBTASK'].includes(item.item_type)) {
      groups['MAIN_QUEST'].push(item);
    } else if (item.item_type === 'SIDE_QUEST') {
      groups['SIDE_QUEST'].push(item);
    }
  });
  return groups;
};

const DailySyncClient: React.FC<DailySyncClientProps> = ({ 
  year, 
  weekNumber, 
  selectedDate, 
  onSetActiveTask, 
  dailyPlan, 
  setDailyPlanState, 
  setDailyPlanAction, 
  loading, 
}) => {
  const {
    weeklyTasks,
    selectedTasks,
    showModal,
    setShowModal,
    modalLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleTargetChange
  } = useDailyPlanManagement(year, weekNumber, selectedDate, dailyPlan, setDailyPlanState, setDailyPlanAction);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
        <Spinner size={164} />
      </div>
    );
  }

  const groupedItems = groupItemsByType(dailyPlan?.daily_plan_items);

  return (
    <div className="mx-auto relative">
      <div className="flex flex-col gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <TaskColumn
            title="Main Quest"
            items={groupedItems['MAIN_QUEST']}
            onStatusChange={handleStatusChange}
            onSelectTasks={handleOpenModal}
            onSetActiveTask={onSetActiveTask}
            selectedDate={selectedDate}
            onTargetChange={handleTargetChange}
            showAddQuestButton={true}
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <TaskColumn
            title="Side Quest"
            items={groupedItems['SIDE_QUEST']}
            onStatusChange={handleStatusChange}
            onAddSideQuest={handleAddSideQuest}
            onSetActiveTask={onSetActiveTask}
            selectedDate={selectedDate}
            onTargetChange={handleTargetChange}
          />
        </div>
      </div>
      
      <TaskSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tasks={weeklyTasks}
        selectedTasks={selectedTasks}
        onTaskToggle={handleTaskToggle}
        onSave={handleSaveSelection}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default DailySyncClient; 