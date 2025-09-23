import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useDailySyncUltraFast, useTasksForWeek } from './useDailySync';
import { addSideQuest } from '../actions/sideQuestActions';
import { setDailyPlan, updateDailyPlanItemFocusDuration, updateDailyPlanItemAndTaskStatus } from '../actions/dailyPlanActions';
import { DailyPlanItem } from '../types';

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
        const task = weeklyTasks.find((t: any) => t.id === taskId);
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
        // Find the daily plan item to get the task_id
        const dailyPlanItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.id === itemId);
        if (!dailyPlanItem) {
          throw new Error('Daily plan item not found');
        }

        // Update both daily_plan_items and tasks status
        await updateDailyPlanItemAndTaskStatus(itemId, dailyPlanItem.item_id, status);
        
        // Trigger refresh of optimized data instead of individual API call
        if (mutate) {
          await mutate();
        }
        
        // Show success toast
        const statusText = status === 'DONE' ? 'Selesai' : status === 'IN_PROGRESS' ? 'Sedang Dikerjakan' : 'Belum Dimulai';
        toast.success(`Status tugas diubah menjadi: ${statusText}`);
      } catch (err) {
        console.error('Error updating task status:', err);
        toast.error('Gagal mengubah status tugas. Silakan coba lagi.');
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


  const handleFocusDurationChange = async (itemId: string, duration: number) => {
    startTransition(async () => {
      try {
        await updateDailyPlanItemFocusDuration(itemId, duration);
        // Trigger refresh of optimized data instead of individual API call
        if (mutate) {
          await mutate();
        }
        
        // Show success toast
        toast.success(`Durasi fokus diubah menjadi: ${duration} menit`);
      } catch (err) {
        console.error('Error updating focus duration:', err);
        toast.error('Gagal mengubah durasi fokus. Silakan coba lagi.');
      }
    });
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
    handleFocusDurationChange,
    
    // Utilities
    mutate
  };
}
