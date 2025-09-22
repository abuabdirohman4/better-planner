import { useState, useTransition } from 'react';
import { useDailySyncUltraFast, useTasksForWeek } from './useDailySync';
import { addSideQuest } from '../../SideQuest/actions/sideQuestActions';
import { updateDailyPlanItemStatus, setDailyPlan } from '../actions/dailyPlanActions';
import { DailyPlan, DailyPlanItem } from '@/app/(admin)/execution/daily-sync/DailySyncClient/types';

export function useDailyPlanManagement(
  year: number,
  weekNumber: number,
  selectedDate: string
) {
  // Data fetching
  const {
    dailyPlan: optimizedDailyPlan,
    weeklyTasks: optimizedWeeklyTasks,
    completedSessions,
    isLoading: ultraFastLoading,
    mutate
  } = useDailySyncUltraFast(year, weekNumber, selectedDate);

  // Fallback: Use individual hook if optimized data is empty
  const { tasks: fallbackWeeklyTasks } = useTasksForWeek(year, weekNumber);

  // Use optimized data if available, fallback to individual hooks
  const dailyPlan = optimizedDailyPlan;
  const weeklyTasks = (optimizedWeeklyTasks && optimizedWeeklyTasks.length > 0) ? optimizedWeeklyTasks : fallbackWeeklyTasks;
  const loading = ultraFastLoading;
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [, startTransition] = useTransition();

  const getCurrentDailyPlanSelections = () => {
    if (!dailyPlan?.daily_plan_items) return {};
    const selections: Record<string, boolean> = {};
    dailyPlan.daily_plan_items.forEach((item: DailyPlanItem) => {
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
      // Refresh tasks data if mutate function is available
      if (mutate) {
        await mutate();
      }
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
        await setDailyPlan(selectedDate, selectedItems);
        // Trigger refresh of optimized data instead of individual API call
        if (mutate) {
          await mutate();
        }
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
        // Trigger refresh of optimized data instead of individual API call
        if (mutate) {
          await mutate();
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
        // Trigger refresh of optimized data instead of individual API call
        if (mutate) {
          await mutate();
        }
      } catch (err) {
        console.error('Error adding side quest:', err);
      }
    });
  };

  const handleTargetChange = (itemId: string, newTarget: number) => {
    if (!dailyPlan) return;
    // This would need to be handled by the parent component
    // since we don't have direct access to setDailyPlanState
    console.log('Target change:', itemId, newTarget);
  };

  const handleFocusDurationChange = (itemId: string, duration: number) => {
    if (!dailyPlan) return;
    // This would need to be handled by the parent component
    // since we don't have direct access to setDailyPlanState
    console.log('Focus duration change:', itemId, duration);
  };

  return {
    // Data
    dailyPlan,
    weeklyTasks,
    completedSessions,
    loading,
    initialLoading: loading,
    
    // Business logic
    selectedTasks,
    showModal,
    setShowModal,
    modalLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleTargetChange,
    handleFocusDurationChange,
    
    // Utilities
    mutate
  };
}
