import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTasksForWeek } from './useDailySync';
import { addSideQuest } from '../actions/sideQuestActions';
import { setDailyPlan, updateDailyPlanItemFocusDuration, updateDailyPlanItemAndTaskStatus } from '../actions/dailyPlanActions';
import { DailyPlanItem } from '../types';
import useSWR, { mutate as globalMutate } from 'swr';
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
      .select('*, daily_plan_items(id, item_id, item_type, status, daily_session_target, focus_duration, created_at, updated_at)')
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
        let task_status = item.status; // Preserve existing status

        if (item.item_type === 'MAIN_QUEST') {
          const { data: task } = await supabase
            .from('tasks')
            .select('id, title, milestone_id, status')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
          task_status = task?.status || item.status; // Use task status if available
          
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
            .select('id, title, status')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
          task_status = task?.status || item.status; // Use task status if available
        }

        return {
          ...item,
          title,
          quest_title,
          status: task_status // Use synced status
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
      revalidateOnFocus: true, // ✅ ENABLED - Allow revalidation on focus for fresh data
      revalidateIfStale: true, // ✅ ENABLED - Allow revalidation of stale data
      revalidateOnReconnect: true,
      dedupingInterval: 30 * 1000, // ✅ REDUCED - 30 seconds for fresher data
      errorRetryCount: 3,
    }
  );

  const { 
    tasks: weeklyTasks, 
    error: tasksError, 
    isLoading: tasksLoading,
    mutate: mutateTasks 
  } = useTasksForWeek(year, weekNumber, selectedDate);

  // Combine loading states
  const loading = dailyPlanLoading || tasksLoading;
  const error = dailyPlanError || tasksError;
  
  // Enhanced mutate function that refreshes both and invalidates related caches
  const mutate = async () => {
    await Promise.all([
      mutateDailyPlan(),
      mutateTasks(),
      // ✅ CRITICAL: Invalidate all related caches for cross-tab synchronization
      globalMutate((key) => {
        if (Array.isArray(key) && key[0] === 'daily-sync') {
          return true; // Invalidate all daily-sync related caches
        }
        return false;
      })
    ]);
  };

  // For now, we'll use empty completed sessions
  const completedSessions: Record<string, number> = {};

  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false); // Loading untuk konten (skeleton)
  const [savingLoading, setSavingLoading] = useState(false); // Loading untuk button (spinner)

  // ✅ CRITICAL: Periodic revalidation for cross-environment synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      // Revalidate every 30 seconds to catch changes from other tabs/environments
      mutate();
    }, 30000);

    return () => clearInterval(interval);
  }, [mutate]);

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
    setSavingLoading(true); // Gunakan savingLoading untuk button
    
    try {
      const selectedItems = Object.entries(selectedTasks)
        .filter(([, selected]) => selected)
        .map(([taskId]) => {
          const task = weeklyTasks.find((t: any) => t.id === taskId);
          // Preserve existing item type or determine from task type
          const existingItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.item_id === taskId);
          const itemType = existingItem?.item_type || (task?.type === 'SIDE_QUEST' ? 'SIDE_QUEST' : 'MAIN_QUEST');
          return {
            item_id: taskId,
            item_type: itemType
          };
        });

      // Also include existing side quests that are not in weeklyTasks
      const existingSideQuests = dailyPlan?.daily_plan_items?.filter((item: DailyPlanItem) => 
        item.item_type === 'SIDE_QUEST' && 
        !weeklyTasks.some((t: any) => t.id === item.item_id)
      ) || [];

      // Add existing side quests to selectedItems
      existingSideQuests.forEach((item: DailyPlanItem) => {
        if (!selectedItems.some(selected => selected.item_id === item.item_id)) {
          selectedItems.push({
            item_id: item.item_id,
            item_type: item.item_type
          });
        }
      });
      
      if (selectedItems.length === 0) return;
      
      await setDailyPlan(selectedDate, selectedItems);
      
      // ✅ CRITICAL: Force re-fetch both daily plan and weekly tasks to ensure UI updates
      await Promise.all([
        mutateDailyPlan(),
        mutateTasks()
      ]);
      
      setShowModal(false);
    } catch (err) {
      console.error('Error saving daily plan:', err);
      throw err; // Re-throw error so it can be caught by the calling function
    } finally {
      setSavingLoading(false); // Gunakan savingLoading untuk button
    }
  };

  const handleStatusChange = async (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      // Find the daily plan item to get the task_id
      const dailyPlanItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.id === itemId);
      if (!dailyPlanItem) {
        throw new Error('Daily plan item not found');
      }

      // Update both daily_plan_items and tasks status
      await updateDailyPlanItemAndTaskStatus(itemId, dailyPlanItem.item_id, status);
      
      // Force re-fetch from database to get updated data
      await mutateDailyPlan();
      
      // Show success toast
      const statusText = status === 'DONE' ? 'Selesai' : status === 'IN_PROGRESS' ? 'Sedang Dikerjakan' : 'Belum Dimulai';
      toast.success(`Status tugas diubah menjadi: ${statusText}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Gagal mengubah status tugas. Silakan coba lagi.');
      throw err; // Re-throw error so it can be caught by the calling function
    }
  };

  const handleAddSideQuest = async (title: string) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('date', selectedDate);
      await addSideQuest(formData);
      
      // ✅ CRITICAL: Force re-fetch daily plan to show new side quest
      await mutateDailyPlan();
    } catch (err) {
      console.error('Error adding side quest:', err);
      throw err; // Re-throw error so it can be caught by the calling function
    }
  };

  const handleFocusDurationChange = async (itemId: string, duration: number) => {
    try {
      await updateDailyPlanItemFocusDuration(itemId, duration);
      
      // Force re-fetch from database to get updated data
      await mutateDailyPlan();
      
      // Show success toast
      toast.success(`Durasi fokus diubah menjadi: ${duration} menit`);
    } catch (err) {
      console.error('Error updating focus duration:', err);
      toast.error('Gagal mengubah durasi fokus. Silakan coba lagi.');
      throw err; // Re-throw error so it can be caught by the calling function
    }
  };

  const handleTargetChange = async (itemId: string, newTarget: number) => {
    try {
      // Update daily session target in database
      const supabase = await createClient();
      const { error } = await supabase
        .from('daily_plan_items')
        .update({ daily_session_target: newTarget })
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      // ✅ CRITICAL: Force re-fetch daily plan to show updated target
      await mutateDailyPlan();
    } catch (err) {
      console.error('Error updating session target:', err);
      toast.error('Gagal mengubah target sesi. Silakan coba lagi.');
      throw err; // Re-throw error so it can be caught by the calling function
    }
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
    modalLoading, // Loading untuk konten (skeleton)
    savingLoading, // Loading untuk button (spinner)
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
