import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTasksForWeek } from './useDailySync';
import { addSideQuest } from '../actions/sideQuestActions';
import { setDailyPlan, updateDailyPlanItemFocusDuration, updateDailyPlanItemAndTaskStatus } from '../actions/dailyPlanActions';
import { DailyPlanItem } from '../types';
import useSWR from 'swr';
import { dailySyncKeys } from '@/lib/swr';
import { createClient } from '@/lib/supabase/client';

// Helper function to get daily plan with detailed task information
async function getDailyPlan(selectedDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: plan, error } = await supabase
      .from('daily_plans')
      .select('*, daily_plan_items(*)')
      .eq('plan_date', selectedDate)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // If no plan exists, return null
    if (!plan) return null;

    // Fetch detailed information for each daily plan item
    const itemsWithDetails = await Promise.all(
      (plan.daily_plan_items || []).map(async (item: { item_id: string; item_type: string; [key: string]: unknown }) => {
        let title = '';
        let quest_title = '';

        if (item.item_type === 'QUEST') {
          const { data: quest } = await supabase
            .from('quests')
            .select('id, title')
            .eq('id', item.item_id)
            .single();
          title = quest?.title || '';
          quest_title = title;
        } else if (item.item_type === 'MILESTONE') {
          const { data: milestone } = await supabase
            .from('milestones')
            .select('id, title, quest_id')
            .eq('id', item.item_id)
            .single();
          title = milestone?.title || '';
          
          if (milestone?.quest_id) {
            const { data: quest } = await supabase
              .from('quests')
              .select('id, title')
              .eq('id', milestone.quest_id)
              .single();
            quest_title = quest?.title || '';
          }
        } else if (item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
          const { data: task } = await supabase
            .from('tasks')
            .select('id, title, milestone_id')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
          
          if (task?.milestone_id) {
            const { data: milestone } = await supabase
              .from('milestones')
              .select('id, title, quest_id')
              .eq('id', task.milestone_id)
              .single();
            
            if (milestone?.quest_id) {
              const { data: quest } = await supabase
                .from('quests')
                .select('id, title')
                .eq('id', milestone.quest_id)
                .single();
              quest_title = quest?.title || '';
            }
          }
        } else if (item.item_type === 'SIDE_QUEST') {
          const { data: task } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
        }

        return {
          ...item,
          title,
          quest_title
        };
      })
    );

    return {
      ...plan,
      daily_plan_items: itemsWithDetails
    };
  } catch (error) {
    console.error('Error fetching daily plan:', error);
    return null;
  }
}

export function useDailyPlanManagement(
  year: number,
  weekNumber: number,
  selectedDate: string
) {
  // Data fetching
  const { 
    data: dailyPlan, 
    error: dailyPlanError, 
    isLoading: dailyPlanLoading,
    mutate: mutateDailyPlan 
  } = useSWR(
    selectedDate ? dailySyncKeys.dailyPlan(selectedDate) : null,
    () => getDailyPlan(selectedDate),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000,
      errorRetryCount: 1,
    }
  );

  const { 
    tasks: weeklyTasks, 
    error: tasksError, 
    isLoading: tasksLoading,
    mutate: mutateTasks 
  } = useTasksForWeek(year, weekNumber);

  // Combine loading states
  const loading = dailyPlanLoading || tasksLoading;
  const error = dailyPlanError || tasksError;
  
  // Simple mutate function that refreshes both
  const mutate = async () => {
    await Promise.all([mutateDailyPlan(), mutateTasks()]);
  };

  // For now, we'll use empty completed sessions
  const completedSessions: Record<string, number> = {};

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
          item_type: task?.type === 'MAIN_QUEST' ? 'TASK' : task?.type || 'TASK'
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
