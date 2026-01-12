import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTasksForWeek } from './useDailySync';
import { addSideQuest } from '../actions/sideQuestActions';
import { addDailyQuest } from '../actions/dailyQuestActions';
import { setDailyPlan, updateDailyPlanItemFocusDuration, updateDailyPlanItemAndTaskStatus, removeDailyPlanItem, convertToChecklist, convertToQuest } from '../actions/dailyPlanActions';
import { DailyPlanItem } from '../types';
import useSWR, { mutate as globalMutate } from 'swr';
import { dailySyncKeys } from '@/lib/swr';
import { createClient } from '@/lib/supabase/client';
import { useCompletedSessions } from './useCompletedSessions';
import { useTargetFocusStore } from '../../TargetFocus/stores/targetFocusStore';
import { getQuarterDates } from '@/lib/quarterUtils';
import { useQuarterStore } from '@/stores/quarterStore';

// Helper function to get daily plan with detailed task information
async function getDailyPlan(selectedDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // ✅ FIX 406 Error: Split query to avoid complex nested select
    // First, get the daily plan
    const { data: plan, error: planError } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('plan_date', selectedDate)
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle to avoid error when no data

    if (planError && planError.code !== 'PGRST116') throw planError;

    // If no plan exists, return null
    if (!plan) return null;

    // Then, fetch daily_plan_items separately
    const { data: dailyPlanItems, error: itemsError } = await supabase
      .from('daily_plan_items')
      .select('id, item_id, item_type, status, daily_session_target, focus_duration, display_order, created_at, updated_at')
      .eq('daily_plan_id', plan.id)
      .order('display_order', { ascending: true });

    if (itemsError) throw itemsError;

    const allPlanItems = dailyPlanItems || [];

    if (allPlanItems.length === 0) {
      return {
        ...plan,
        daily_plan_items: []
      };
    }

    // ✅ OPTIMIZED: Batch queries by item type instead of N+1 queries
    // Group items by type
    const mainQuestItems = allPlanItems.filter((item: any) => item.item_type === 'MAIN_QUEST');
    const sideQuestItems = allPlanItems.filter((item: any) => item.item_type === 'SIDE_QUEST');
    const workQuestItems = allPlanItems.filter((item: any) => item.item_type === 'WORK_QUEST');
    const dailyQuestItems = allPlanItems.filter((item: any) => item.item_type === 'DAILY_QUEST');

    // Extract all item_ids for batch fetching
    const allItemIds = allPlanItems.map((item: any) => item.item_id);

    // Batch fetch all tasks in one query
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, milestone_id, parent_task_id, status, type, is_archived')
      .in('id', allItemIds);

    if (tasksError) throw tasksError;

    // Create task map for O(1) lookup
    const taskMap = new Map((allTasks || []).map(task => [task.id, task]));

    // For MAIN_QUEST items: Extract milestone_ids and batch fetch milestones
    const mainQuestTaskIds = mainQuestItems.map((item: any) => item.item_id);
    const mainQuestTasks = (allTasks || []).filter(task => mainQuestTaskIds.includes(task.id));
    const milestoneIds = [...new Set(
      mainQuestTasks
        .map(task => task.milestone_id)
        .filter(Boolean)
    )];

    let milestoneMap = new Map();
    let questMap = new Map();

    if (milestoneIds.length > 0) {
      // Batch fetch all milestones
      const { data: allMilestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id, title, quest_id')
        .in('id', milestoneIds);

      if (milestonesError) throw milestonesError;
      milestoneMap = new Map((allMilestones || []).map(m => [m.id, m]));

      // Extract quest_ids and batch fetch quests
      const questIds = [...new Set(
        (allMilestones || [])
          .map(m => m.quest_id)
          .filter(Boolean)
      )];

      if (questIds.length > 0) {
        const { data: allQuests, error: questsError } = await supabase
          .from('quests')
          .select('id, title')
          .in('id', questIds);

        if (questsError) throw questsError;
        questMap = new Map((allQuests || []).map(q => [q.id, q]));
      }
    }

    // For WORK_QUEST items: Extract parent_task_ids and batch fetch projects
    const workQuestTaskIds = workQuestItems.map((item: any) => item.item_id);
    const workQuestTasks = (allTasks || []).filter(task => workQuestTaskIds.includes(task.id));
    const parentTaskIds = [...new Set(
      workQuestTasks
        .map(task => task.parent_task_id)
        .filter(Boolean)
    )];

    let projectMap = new Map();
    if (parentTaskIds.length > 0) {
      const { data: allProjects, error: projectsError } = await supabase
        .from('tasks')
        .select('id, title')
        .in('id', parentTaskIds);

      if (projectsError) throw projectsError;
      projectMap = new Map((allProjects || []).map(p => [p.id, p]));
    }

    // Combine data in-memory (fast, no additional network calls)
    const itemsWithDetails = allPlanItems.map((item: any) => {
      let title = '';
      let quest_title = '';
      let task_status = item.status as string; // Preserve existing status

      const task = taskMap.get(item.item_id);

      if (item.item_type === 'MAIN_QUEST') {
        if (task) {
          title = task.title || '';
          task_status = task.status || (item.status as string);

          if (task.milestone_id) {
            const milestone = milestoneMap.get(task.milestone_id);
            if (milestone && milestone.quest_id) {
              const quest = questMap.get(milestone.quest_id);
              if (quest) {
                quest_title = quest.title || '';
              }
            }
          }
        }
      } else if (item.item_type === 'SIDE_QUEST') {
        if (task) {
          title = task.title || '';
          task_status = task.status || (item.status as string);
        }
      } else if (item.item_type === 'WORK_QUEST') {
        if (task) {
          title = task.title || '';
          task_status = task.status || (item.status as string);

          if (task.parent_task_id) {
            const project = projectMap.get(task.parent_task_id);
            if (project) {
              quest_title = project.title || '';
            }
          }
        }
      } else if (item.item_type === 'DAILY_QUEST') {
        if (task) {
          title = task.title || '';
          // Daily Quest status is independent per day
          task_status = item.status || 'TODO';
        }
      }

      return {
        ...item,
        title,
        quest_title,
        status: task_status, // Use synced status
        is_archived: task?.is_archived
      };
    });

    return {
      ...plan,
      daily_plan_items: itemsWithDetails
    };
  } catch (error) {
    console.error('Error fetching daily plan:', error);
    return null;
  }
}

// Hook to fetch daily quests available for selection
function useDailyQuestsForSelection(year: number, quarter: number) {
  const supabase = createClient();

  const { data: dailyQuests, isLoading, error } = useSWR(
    dailySyncKeys.dailyQuests(year, quarter),
    async () => {
      // Get current user for RLS filter
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get date range for the quarter
      const { startDate, endDate } = getQuarterDates(year, quarter);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'DAILY_QUEST')
        .eq('is_archived', false)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  );

  return { dailyQuests: dailyQuests || [], isLoading, error };
}

export function useDailyPlanManagement(
  year: number,
  weekNumber: number,
  selectedDate: string
) {
  // ✅ NEW: Get optimistic update functions from TargetFocus store
  const { updateChecklistModeOptimistically, removeItemOptimistically } = useTargetFocusStore();

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
      revalidateOnFocus: false, // ✅ OPTIMIZED: Disabled - daily plan doesn't need focus revalidation
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

  // ✅ NEW: Get completed sessions from activity_logs
  const dailyPlanItems = dailyPlan?.daily_plan_items || [];
  const { completedSessions, isLoading: completedSessionsLoading } = useCompletedSessions({
    selectedDate,
    dailyPlanItems
  });

  // Combine loading states
  const loading = dailyPlanLoading || tasksLoading || completedSessionsLoading;
  const error = dailyPlanError || tasksError;

  // Enhanced mutate function that refreshes both and invalidates related caches
  const mutate = async () => {
    await Promise.all([
      mutateDailyPlan(),
      mutateTasks(),
      // ✅ CRITICAL: Invalidate all related caches for cross-tab synchronization
      globalMutate((key) => {
        if (Array.isArray(key)) {
          // Invalidate daily-sync, weekly-sync, and main-quests related caches
          return key[0] === 'daily-sync' ||
            key[0] === 'weekly-sync' ||
            key[0] === 'main-quests' ||
            key[0] === 'quests' ||
            key[0] === 'milestones' ||
            key[0] === 'tasks';
        }
        return false;
      })
    ]);
  };

  // Add Daily Quest selection state
  const [isDailyQuestModalOpen, setIsDailyQuestModalOpen] = useState(false);
  // Use quarterStore directly (same pattern as SideQuestModal) for consistent quarter context
  const { year: quarterYear, quarter } = useQuarterStore();
  const { dailyQuests, isLoading: isLoadingDailyQuests } = useDailyQuestsForSelection(quarterYear, quarter);
  const [selectedDailyQuestIds, setSelectedDailyQuestIds] = useState<Record<string, boolean>>({});
  const [isSavingDailyQuests, setIsSavingDailyQuests] = useState(false);

  // Initialize selectedDailyQuestIds when modal opens
  useEffect(() => {
    if (isDailyQuestModalOpen && dailyPlan?.daily_plan_items) {
      const selections: Record<string, boolean> = {};
      dailyPlan.daily_plan_items.forEach((item: any) => {
        if (item.item_type === 'DAILY_QUEST') {
          selections[item.item_id] = true;
        }
      });
      setSelectedDailyQuestIds(selections);
    }
  }, [isDailyQuestModalOpen, dailyPlan]);

  const handleDailyQuestToggle = (taskId: string) => {
    setSelectedDailyQuestIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Unified modal state
  const [modalState, setModalState] = useState({
    showModal: false,
    modalType: 'main' as 'main' | 'work' | 'daily',
    modalLoading: false,
    savingLoading: false
  });

  // Unified selection state - using same structure for both quest types
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [selectedWorkQuests, setSelectedWorkQuests] = useState<string[]>([]);
  const [selectedDailyQuests, setSelectedDailyQuests] = useState<string[]>([]);

  // ✅ CRITICAL: Periodic revalidation for cross-environment synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      // Revalidate every 30 seconds to catch changes from other tabs/environments
      mutate();
    }, 30000);

    return () => clearInterval(interval);
  }, [mutate]);

  const getCurrentDailyPlanSelections = (questType: 'main' | 'work' | 'daily' = 'main') => {
    if (!dailyPlan?.daily_plan_items) return (questType === 'main' ? {} : []);

    if (questType === 'main') {
      const selections: Record<string, boolean> = {};
      dailyPlan.daily_plan_items.forEach((item: DailyPlanItem) => {
        if (item.item_type === 'MAIN_QUEST') {
          selections[item.item_id] = true;
        }
      });
      return selections;
    } else if (questType === 'work') {
      return dailyPlan.daily_plan_items
        .filter((item: DailyPlanItem) => item.item_type === 'WORK_QUEST')
        .map((item: DailyPlanItem) => item.item_id);
    } else {
      return dailyPlan.daily_plan_items
        .filter((item: DailyPlanItem) => item.item_type === 'DAILY_QUEST')
        .map((item: DailyPlanItem) => item.item_id);
    }
  };

  const handleOpenModal = async (modalType: 'main' | 'work' | 'daily' = 'main') => {
    setModalState(prev => ({
      ...prev,
      showModal: true,
      modalType,
      modalLoading: modalType !== 'daily' // daily fetched via server action possibly, or we can use custom loader
    }));

    const currentSelections = getCurrentDailyPlanSelections(modalType);

    if (modalType === 'main') {
      setSelectedTasks(currentSelections as Record<string, boolean>);
    } else if (modalType === 'work') {
      setSelectedWorkQuests(currentSelections as string[]);
    } else {
      setSelectedDailyQuests(currentSelections as string[]);
    }

    if (modalType === 'main') {
      try {
        // Refresh tasks data if mutate function is available
        if (mutate) {
          await mutate();
        }
      } catch (err) {
        console.error('Error loading weekly tasks:', err);
      } finally {
        setModalState(prev => ({ ...prev, modalLoading: false }));
      }
    }
  };

  const handleTaskToggle = (taskId: string, questType: 'main' | 'work' | 'daily' = 'main') => {
    if (questType === 'main') {
      setSelectedTasks(prev => ({
        ...prev,
        [taskId]: !prev[taskId]
      }));
    } else if (questType === 'work') {
      setSelectedWorkQuests(prev =>
        prev.includes(taskId)
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      );
    } else if (questType === 'daily') {
      setSelectedDailyQuests(prev =>
        prev.includes(taskId)
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      );
    }
  };

  const handleSaveSelection = async (newItems: { item_id: string; item_type: string }[], preserveOtherTypes: boolean = true) => {
    setModalState(prev => ({ ...prev, savingLoading: true }));

    try {
      let allItems = [...newItems];

      if (preserveOtherTypes) {
        // Preserve existing items of other types
        const existingMainQuests = dailyPlan?.daily_plan_items?.filter((item: DailyPlanItem) =>
          item.item_type === 'MAIN_QUEST'
        ) || [];

        const existingSideQuests = dailyPlan?.daily_plan_items?.filter((item: DailyPlanItem) =>
          item.item_type === 'SIDE_QUEST'
        ) || [];

        const existingWorkQuests = dailyPlan?.daily_plan_items?.filter((item: DailyPlanItem) =>
          item.item_type === 'WORK_QUEST'
        ) || [];

        const existingDailyQuests = dailyPlan?.daily_plan_items?.filter((item: DailyPlanItem) =>
          item.item_type === 'DAILY_QUEST'
        ) || [];

        // Get the types of new items to determine what to preserve
        const newItemTypes = [...new Set(newItems.map(item => item.item_type))];

        // Preserve items that are NOT in the new items types
        const itemsToPreserve = [
          ...(newItemTypes.includes('MAIN_QUEST') ? [] : existingMainQuests),
          ...(newItemTypes.includes('SIDE_QUEST') ? [] : existingSideQuests),
          ...(newItemTypes.includes('WORK_QUEST') ? [] : existingWorkQuests),
          ...(newItemTypes.includes('DAILY_QUEST') ? [] : existingDailyQuests)
        ];

        allItems = [
          ...itemsToPreserve.map((item: DailyPlanItem) => ({
            item_id: item.item_id,
            item_type: item.item_type
          })),
          ...newItems
        ];
      }

      if (allItems.length === 0) return;

      await setDailyPlan(selectedDate, allItems);

      // ✅ CRITICAL: Force re-fetch both daily plan and weekly tasks to ensure UI updates
      await Promise.all([
        mutateDailyPlan(),
        mutateTasks()
      ]);

      setModalState(prev => ({ ...prev, showModal: false }));
    } catch (err) {
      console.error('Error saving selection:', err);
      throw err; // Re-throw error so it can be caught by the calling function
    } finally {
      setModalState(prev => ({ ...prev, savingLoading: false }));
    }
  };

  const handleSaveDailyQuestSelection = async () => {
    setIsSavingDailyQuests(true);
    try {
      const selectedItems = Object.entries(selectedDailyQuestIds)
        .filter(([_, selected]) => selected)
        .map(([taskId]) => ({
          item_id: taskId,
          item_type: 'DAILY_QUEST'
        }));

      await handleSaveSelection(selectedItems, true);
      setIsDailyQuestModalOpen(false);
      toast.success('Daily quests updated successfully');
    } catch (error) {
      console.error('Error saving daily quests:', error);
      toast.error('Failed to save daily quests');
    } finally {
      setIsSavingDailyQuests(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      // Find the daily plan item to get the task_id
      const dailyPlanItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.id === itemId);
      if (!dailyPlanItem) {
        throw new Error('Daily plan item not found');
      }

      // Update status with item_type and date for proper DAILY_QUEST handling
      await updateDailyPlanItemAndTaskStatus(
        itemId,
        dailyPlanItem.item_id,
        status,
        dailyPlanItem.item_type,
        selectedDate
      );

      // Force re-fetch from database to get updated data
      await mutateDailyPlan();

      // ✅ CRITICAL: Invalidate weekly-sync SWR cache to ensure status updates are reflected
      // Weekly-sync SWR key format: ['weekly-sync', year, quarter, weekNumber, startDate, endDate]
      await globalMutate((key) => {
        if (Array.isArray(key) && key.length >= 1) {
          // Invalidate all weekly-sync cache entries regardless of parameters
          return key[0] === 'weekly-sync';
        }
        return false;
      }, undefined, { revalidate: true });

      // Show success toast
      const statusText = status === 'DONE' ? 'Selesai' : 'Belum Selesai';
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

  const handleRemoveItem = async (itemId: string) => {
    try {
      // ✅ CRITICAL: Find the item_id (task_id) from dailyPlan to pass to optimistic update
      const dailyPlanItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.id === itemId);
      const taskItemId = dailyPlanItem?.item_id;

      // ✅ OPTIMISTIC: Update Zustand store immediately for instant UI feedback
      if (taskItemId) {
        removeItemOptimistically(taskItemId);
      }

      await removeDailyPlanItem(itemId);

      // ✅ CRITICAL: Wait a bit for database commit to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ CRITICAL: Invalidate TargetFocus cache BEFORE refreshing daily plan
      await Promise.all([
        // Invalidate specific TargetFocus cache with forced revalidation
        globalMutate((key) => {
          if (Array.isArray(key) && key.length >= 2) {
            return key[0] === 'daily-sync' && key[1] === 'target-focus';
          }
          return false;
        }, undefined, {
          revalidate: true,
        }),
        // Also invalidate actualFocusTime cache
        globalMutate((key) => {
          if (Array.isArray(key) && key.length >= 3) {
            return key[0] === 'daily-sync' && key[1] === 'actual-focus-time';
          }
          return false;
        }, undefined, {
          revalidate: true,
        }),
      ]);

      await mutateDailyPlan(); // Refresh data
      toast.success('Item berhasil dihapus dari plan hari ini');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Gagal menghapus item');
      // ✅ OPTIMISTIC: Note - we can't easily revert removal, but SWR will sync when it refetches
      throw error;
    }
  };

  const handleConvertToChecklist = async (itemId: string) => {
    try {
      // ✅ CRITICAL: Find the item_id (task_id) from dailyPlan to pass to optimistic update
      const dailyPlanItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.id === itemId);
      const taskItemId = dailyPlanItem?.item_id;

      // ✅ OPTIMISTIC: Update Zustand store immediately for instant UI feedback
      if (taskItemId) {
        updateChecklistModeOptimistically(taskItemId, true); // true = convert to checklist
      }

      await convertToChecklist(itemId);

      // ✅ CRITICAL: Wait a bit for database commit to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ CRITICAL: Invalidate TargetFocus cache BEFORE refreshing daily plan
      // This ensures fresh data is fetched when daily plan refreshes
      await Promise.all([
        // Invalidate specific TargetFocus cache with forced revalidation
        globalMutate((key) => {
          if (Array.isArray(key) && key.length >= 2) {
            return key[0] === 'daily-sync' && key[1] === 'target-focus';
          }
          return false;
        }, undefined, {
          revalidate: true,
        }),
        // ✅ CRITICAL: Invalidate ALL actualFocusTime caches (regardless of taskIds)
        // Because taskIds might change after conversion, we need to invalidate all variations
        globalMutate((key) => {
          if (Array.isArray(key) && key.length >= 3) {
            // Match pattern: ['daily-sync', 'actual-focus-time', date, ...taskIds]
            return key[0] === 'daily-sync' && key[1] === 'actual-focus-time';
          }
          return false;
        }, undefined, {
          revalidate: true,
        }),
      ]);

      // Then refresh daily plan
      await mutateDailyPlan();

      toast.success('Task berhasil diubah menjadi checklist');
    } catch (error) {
      console.error('Error converting to checklist:', error);
      toast.error('Gagal mengubah ke checklist');
      // ✅ OPTIMISTIC: Revert optimistic update on error
      if (dailyPlan?.daily_plan_items) {
        const dailyPlanItem = dailyPlan.daily_plan_items.find((item: DailyPlanItem) => item.id === itemId);
        const taskItemId = dailyPlanItem?.item_id;
        if (taskItemId) {
          updateChecklistModeOptimistically(taskItemId, false); // Revert to quest mode
        }
      }
      throw error;
    }
  };

  const handleConvertToQuest = async (itemId: string) => {
    try {
      // ✅ CRITICAL: Find the item_id (task_id) from dailyPlan to pass to optimistic update
      const dailyPlanItem = dailyPlan?.daily_plan_items?.find((item: DailyPlanItem) => item.id === itemId);
      const taskItemId = dailyPlanItem?.item_id;

      // ✅ OPTIMISTIC: Update Zustand store immediately for instant UI feedback
      if (taskItemId) {
        updateChecklistModeOptimistically(taskItemId, false); // false = convert to quest
      }

      await convertToQuest(itemId);

      // ✅ CRITICAL: Wait a bit for database commit to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ CRITICAL: Invalidate TargetFocus cache BEFORE refreshing daily plan
      // This ensures fresh data is fetched when daily plan refreshes
      await Promise.all([
        // Invalidate specific TargetFocus cache with forced revalidation
        globalMutate((key) => {
          if (Array.isArray(key) && key.length >= 2) {
            return key[0] === 'daily-sync' && key[1] === 'target-focus';
          }
          return false;
        }, undefined, {
          revalidate: true,
        }),
        // ✅ CRITICAL: Invalidate ALL actualFocusTime caches (regardless of taskIds)
        // Because taskIds might change after conversion, we need to invalidate all variations
        globalMutate((key) => {
          if (Array.isArray(key) && key.length >= 3) {
            // Match pattern: ['daily-sync', 'actual-focus-time', date, ...taskIds]
            return key[0] === 'daily-sync' && key[1] === 'actual-focus-time';
          }
          return false;
        }, undefined, {
          revalidate: true,
        }),
      ]);

      // Then refresh daily plan
      await mutateDailyPlan();

      toast.success('Task berhasil diubah menjadi quest');
    } catch (error) {
      console.error('Error converting to quest:', error);
      toast.error('Gagal mengubah ke quest');
      // ✅ OPTIMISTIC: Revert optimistic update on error
      if (dailyPlan?.daily_plan_items) {
        const dailyPlanItem = dailyPlan.daily_plan_items.find((item: DailyPlanItem) => item.id === itemId);
        const taskItemId = dailyPlanItem?.item_id;
        if (taskItemId) {
          updateChecklistModeOptimistically(taskItemId, true); // Revert to checklist mode
        }
      }
      throw error;
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
    showModal: modalState.showModal,
    setShowModal: (show: boolean) => setModalState(prev => ({ ...prev, showModal: show })),
    modalLoading: modalState.modalLoading,
    savingLoading: modalState.savingLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleTargetChange,
    handleFocusDurationChange,
    handleRemoveItem, // NEW: Handler untuk remove item
    handleConvertToChecklist, // NEW: Handler untuk convert to checklist
    handleConvertToQuest,

    // Daily Quest selection state
    isDailyQuestModalOpen,
    setIsDailyQuestModalOpen,
    dailyQuests,
    selectedDailyQuestIds,
    handleDailyQuestToggle,
    handleSaveDailyQuestSelection,
    isLoadingDailyQuests,
    isSavingDailyQuests,

    // Work Quest state (unified)
    modalState,
    selectedWorkQuests,
    selectedDailyQuests,

    // Utilities
    mutate
  };
}
