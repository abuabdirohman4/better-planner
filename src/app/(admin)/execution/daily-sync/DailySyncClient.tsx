"use client";
import React, { useState, useTransition } from "react";

import Spinner from '@/components/ui/spinner/Spinner';
import { useActivityStore } from '@/stores/activityStore';

import { getTasksForWeek, getDailyPlan, addSideQuest, updateDailyPlanItemStatus, setDailyPlan, updateDailySessionTarget, countCompletedSessions } from "./actions";

interface WeeklyTaskItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  status: string;
  quest_title: string;
  goal_slot: number;
}

interface DailyPlanItem {
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
  daily_plan_items?: DailyPlanItem[];
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
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
}

// Custom hook for task session management
function useTaskSession(item: DailyPlanItem, selectedDate: string, refreshKey?: number, forceRefreshTaskId?: string | null) {
  const [completed, setCompleted] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [target, setTarget] = React.useState(item.daily_session_target ?? 1);
  const [savingTarget, setSavingTarget] = React.useState(false);
  const lastActivityTimestamp = useActivityStore((state) => state.lastActivityTimestamp);

  React.useEffect(() => {
    const cancelled = false;
    setLoading(true);
    countCompletedSessions(item.id, selectedDate || '').then((count) => {
      if (!cancelled) {
        setCompleted(count);
        setLoading(false);
      }
    });
  }, [item.id, selectedDate, refreshKey, forceRefreshTaskId, lastActivityTimestamp]);

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
    completed,
    loading,
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
  refreshKey?: number;
  forceRefreshTaskId?: string | null;
}> = ({ item, onStatusChange, onSetActiveTask, selectedDate, onTargetChange, refreshKey, forceRefreshTaskId }) => {
  const { completed, loading, target, savingTarget, handleTargetChange } = useTaskSession(item, selectedDate || '', refreshKey, forceRefreshTaskId);

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
            >
              –
            </button>
            <button
              className="px-1 text-lg text-gray-500 hover:text-brand-600 disabled:opacity-50"
              disabled={savingTarget}
              onClick={() => handleTargetChange(target + 1, onTargetChange)}
              aria-label="Tambah target"
            >
              +
            </button>
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
            className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
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
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
}> = ({ title, items, onStatusChange, onAddSideQuest, onSelectTasks, onSetActiveTask, selectedDate, onTargetChange, refreshSessionKey, forceRefreshTaskId }) => {
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
          >
            + Tambah Side Quest
          </button>
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
            refreshKey={refreshSessionKey?.[item.id]}
            forceRefreshTaskId={forceRefreshTaskId}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {onSelectTasks ? (
              <button
                onClick={onSelectTasks}
                className="text-brand-500 hover:text-brand-600 font-medium"
              >
                + Pilih Task dari Weekly Goals
              </button>
            ) : (
              <p>Tidak ada task</p>
            )}
          </div>
        )}
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

  if (!isOpen) return null;

  const groupedTasks = groupByGoalSlot(tasks);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pilih Task untuk Daily Plan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([goalSlot, slotTasks]) => (
              <div key={goalSlot} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Goal Slot {goalSlot}</h3>
                <div className="space-y-2">
                  {slotTasks.map((task) => (
                    <label key={task.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTasks[task.id] || false}
                        onChange={() => onTaskToggle(task.id)}
                        className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{task.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({task.quest_title})</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
          >
            Simpan
          </button>
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
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskItem[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [, startTransition] = useTransition();

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
      const tasks = await getTasksForWeek(year, weekNumber);
      setWeeklyTasks(tasks);
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
        const task = weeklyTasks.find(t => t.id === taskId);
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
  };
}

// Utility function to group items by type
const groupItemsByType = (items: DailyPlanItem[] = []) => {
  const groups = {
    'MAIN_QUEST': [] as DailyPlanItem[],
    'WORK': [] as DailyPlanItem[],
    'SIDE_QUEST': [] as DailyPlanItem[]
  };
  items.forEach(item => {
    if (item.item_type === 'QUEST' || item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
      groups['MAIN_QUEST'].push(item);
    } else if (item.item_type === 'MILESTONE') {
      groups['WORK'].push(item);
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
  refreshSessionKey, 
  forceRefreshTaskId 
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
            refreshSessionKey={refreshSessionKey}
            forceRefreshTaskId={forceRefreshTaskId}
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
            refreshSessionKey={refreshSessionKey}
            forceRefreshTaskId={forceRefreshTaskId}
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