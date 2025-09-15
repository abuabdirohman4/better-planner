"use server";

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

// Get selectable items (Main Quests and their Milestones) for the current quarter
export async function getSelectableItems(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { quests: [], milestones: [] };

  try {
    // Get committed quests for the quarter
    const { data: quests, error: questError } = await supabase
      .from('quests')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .eq('is_committed', true)
      .order('priority_score', { ascending: false });

    if (questError) throw questError;

    // Get milestones for these quests
    const questIds = quests?.map(q => q.id) || [];
    let milestones: { id: string; title: string; quest_id: string }[] = [];
    
    if (questIds.length > 0) {
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('milestones')
        .select('id, title, quest_id')
        .in('quest_id', questIds)
        .order('display_order', { ascending: true });

      if (milestoneError) throw milestoneError;
      milestones = milestoneData || [];
    }

    return {
      quests: quests || [],
      milestones: milestones || []
    };
  } catch (error) {
    console.error('Error fetching selectable items:', error);
    return { quests: [], milestones: [] };
  }
}

// Remove a weekly goal
export async function removeWeeklyGoal(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  try {
    const { error } = await supabase
      .from('weekly_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Weekly goal removed successfully' };
  } catch (error) {
    console.error('Error removing weekly goal:', error);
    throw new Error('Failed to remove weekly goal');
  }
}

// ===== NEW 3-SLOT TABLE WEEKLY GOALS ACTIONS =====

// Get hierarchical data (Quest -> Milestone -> Task -> Sub-task) for the current quarter - OPTIMIZED VERSION
export async function getHierarchicalData(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // Step 1: Get all committed quests for the quarter
    const { data: quests, error: questError } = await supabase
      .from('quests')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .eq('is_committed', true)
      .order('priority_score', { ascending: false });

    if (questError) throw questError;
    if (!quests || quests.length === 0) return [];

    // Step 2: Get all milestones for all quests in one query
    const questIds = quests.map(q => q.id);
    const { data: allMilestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, title, quest_id')
      .in('quest_id', questIds)
      .order('display_order', { ascending: true });

    if (milestoneError) throw milestoneError;

    // Step 3: Get all parent tasks for all milestones in one query
    const milestoneIds = allMilestones?.map(m => m.id) || [];
    const { data: allParentTasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status, milestone_id')
      .in('milestone_id', milestoneIds)
      .is('parent_task_id', null) // Only parent tasks
      .order('display_order', { ascending: true });

    if (taskError) throw taskError;

    // Step 4: Get all subtasks for all parent tasks in one query
    const parentTaskIds = allParentTasks?.map(t => t.id) || [];
    const { data: allSubtasks, error: subtaskError } = await supabase
      .from('tasks')
      .select('id, title, status, parent_task_id')
      .in('parent_task_id', parentTaskIds)
      .order('display_order', { ascending: true });

    if (subtaskError) throw subtaskError;

    // Step 5: Create lookup maps for efficient data access
    const milestoneMap = new Map<string, typeof allMilestones>();
    const taskMap = new Map<string, typeof allParentTasks>();
    const subtaskMap = new Map<string, typeof allSubtasks>();

    // Group milestones by quest_id
    allMilestones?.forEach(milestone => {
      const questMilestones = milestoneMap.get(milestone.quest_id) || [];
      questMilestones.push(milestone);
      milestoneMap.set(milestone.quest_id, questMilestones);
    });

    // Group tasks by milestone_id
    allParentTasks?.forEach(task => {
      const milestoneTasks = taskMap.get(task.milestone_id) || [];
      milestoneTasks.push(task);
      taskMap.set(task.milestone_id, milestoneTasks);
    });

    // Group subtasks by parent_task_id
    allSubtasks?.forEach(subtask => {
      const taskSubtasks = subtaskMap.get(subtask.parent_task_id) || [];
      taskSubtasks.push(subtask);
      subtaskMap.set(subtask.parent_task_id, taskSubtasks);
    });

    // Step 6: Build hierarchical structure with in-memory mapping
    const hierarchicalData = quests.map(quest => {
      const questMilestones = milestoneMap.get(quest.id) || [];
      
      const milestonesWithTasks = questMilestones.map(milestone => {
        const milestoneTasks = taskMap.get(milestone.id) || [];
        
        const tasksWithSubtasks = milestoneTasks.map(task => {
          const taskSubtasks = subtaskMap.get(task.id) || [];
          
          return {
            ...task,
            subtasks: taskSubtasks
          };
        });

        return {
          ...milestone,
          tasks: tasksWithSubtasks
        };
      });

      return {
        ...quest,
        milestones: milestonesWithTasks
      };
    });

    return hierarchicalData;
  } catch (error) {
    console.error('Error fetching hierarchical data:', error);
    return [];
  }
}

// Get weekly goals for a specific week (3 slots) - OPTIMIZED VERSION
export async function getWeeklyGoals(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_weekly_sync_data', {
    p_user_id: user.id,
    p_year: year,
    p_week_number: weekNumber
  });

  if (error) {
    console.error("Error calling RPC function:", error);
    return [];
  }

  return data || [];
}

// ULTRA OPTIMIZED: Get both goals and progress in single call
export async function getWeeklyGoalsWithProgress(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { goals: [], progress: {} };
  }

  try {
    // ✅ ULTRA OPTIMIZED: Parallel RPC calls instead of sequential
    const [goalsResult, progressResult] = await Promise.all([
      supabase.rpc('get_weekly_sync_data', {
        p_user_id: user.id,
        p_year: year,
        p_week_number: weekNumber
      }),
      supabase.rpc('calculate_weekly_goals_progress', {
        p_user_id: user.id,
        p_year: year,
        p_week_number: weekNumber
      })
    ]);

    if (goalsResult.error) {
      console.error("Error calling get_weekly_sync_data:", goalsResult.error);
    }
    
    if (progressResult.error) {
      console.error("Error calling calculate_weekly_goals_progress:", progressResult.error);
    }

    return {
      goals: goalsResult.data || [],
      progress: progressResult.data || {}
    };
  } catch (error) {
    console.error("Error in getWeeklyGoalsWithProgress:", error);
    return { goals: [], progress: {} };
  }
}

// Set weekly goal items for a specific slot
export async function setWeeklyGoalItems(data: {
  year: number;
  weekNumber: number;
  goalSlot: number;
  items: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  try {
    // First, upsert weekly goal record for the slot
    const { data: weeklyGoal, error: goalError } = await supabase
      .from('weekly_goals')
      .upsert({
        user_id: user.id,
        year: data.year,
        week_number: data.weekNumber,
        goal_slot: data.goalSlot
      }, {
        onConflict: 'user_id,year,week_number,goal_slot'
      })
      .select('id')
      .single();

    if (goalError) throw goalError;

    // Second, delete all existing goal items for this slot
    const { error: deleteError } = await supabase
      .from('weekly_goal_items')
      .delete()
      .eq('weekly_goal_id', weeklyGoal.id);

    if (deleteError) throw deleteError;

    // Third, insert new goal items
    if (data.items.length > 0) {
      const goalItemsData = data.items.map(item => ({
        weekly_goal_id: weeklyGoal.id,
        item_id: item.id,
        item_type: item.type
      }));

      const { error: insertError } = await supabase
        .from('weekly_goal_items')
        .insert(goalItemsData);

      if (insertError) throw insertError;
    }

    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Weekly goal items set successfully' };
  } catch (error) {
    console.error('Error setting weekly goal items:', error);
    throw new Error('Failed to set weekly goal items');
  }
}

// Calculate progress for a collection of items - OPTIMIZED VERSION
export async function calculateGoalProgress(items: Array<{ item_id: string; item_type: string }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { completed: 0, total: 0, percentage: 0 };

  try {
    // Group items by type for batch queries
    const taskIds = items.filter(item => item.item_type === 'TASK' || item.item_type === 'SUBTASK').map(item => item.item_id);
    const milestoneIds = items.filter(item => item.item_type === 'MILESTONE').map(item => item.item_id);
    const questIds = items.filter(item => item.item_type === 'QUEST').map(item => item.item_id);
    
    // Single batch queries for each type
    const [taskResults, milestoneResults, questResults] = await Promise.all([
      taskIds.length > 0 ? supabase.from('tasks').select('id,status').in('id', taskIds) : { data: [] },
      milestoneIds.length > 0 ? supabase.from('milestones').select('id,status').in('id', milestoneIds) : { data: [] },
      questIds.length > 0 ? supabase.from('quests').select('id,status').in('id', questIds) : { data: [] }
    ]);
    
    // Create a map for quick status lookup
    const statusMap = new Map();
    [...(taskResults.data || []), ...(milestoneResults.data || []), ...(questResults.data || [])]
      .forEach(item => statusMap.set(item.id, item.status));
    
    // Calculate progress
    let totalCompleted = 0;
    const totalItems = items.length;
    
    for (const item of items) {
      const status = statusMap.get(item.item_id);
      if (status === 'DONE') totalCompleted += 1;
    }
    
    const percentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    return {
      completed: totalCompleted,
      total: totalItems,
      percentage
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return { completed: 0, total: 0, percentage: 0 };
  }
}

/**
 * Calculate progress for all weekly goals in a single batch request
 * @param goals Array of WeeklyGoal (each with goal_slot and items)
 * @returns Object mapping goal_slot to progress { completed, total, percentage }
 */
export async function calculateBatchGoalProgress(goals: Array<{ goal_slot: number; items: Array<{ item_id: string; item_type: string }> }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // Kumpulkan semua item dari semua goals
  const allItems: Array<{ item_id: string; item_type: string; goal_slot: number }> = [];
  goals.forEach(goal => {
    goal.items.forEach(item => {
      allItems.push({ ...item, goal_slot: goal.goal_slot });
    });
  });

  // Group item_ids by type
  const taskIds = allItems.filter(item => item.item_type === 'TASK' || item.item_type === 'SUBTASK').map(item => item.item_id);
  const milestoneIds = allItems.filter(item => item.item_type === 'MILESTONE').map(item => item.item_id);
  const questIds = allItems.filter(item => item.item_type === 'QUEST').map(item => item.item_id);

  // Batch query untuk semua item sekaligus
  const [taskResults, milestoneResults, questResults] = await Promise.all([
    taskIds.length > 0 ? supabase.from('tasks').select('id,status').in('id', taskIds) : { data: [] },
    milestoneIds.length > 0 ? supabase.from('milestones').select('id,status').in('id', milestoneIds) : { data: [] },
    questIds.length > 0 ? supabase.from('quests').select('id,status').in('id', questIds) : { data: [] }
  ]);

  // Buat map status
  const statusMap = new Map();
  [...(taskResults.data || []), ...(milestoneResults.data || []), ...(questResults.data || [])]
    .forEach(item => statusMap.set(item.id, item.status));

  // Hitung progress per goal_slot
  const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
  goals.forEach(goal => {
    const items = goal.items;
    let totalCompleted = 0;
    const totalItems = items.length;
    for (const item of items) {
      const status = statusMap.get(item.item_id);
      if (status === 'DONE') totalCompleted += 1;
    }
    const percentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    progressData[goal.goal_slot] = { completed: totalCompleted, total: totalItems, percentage };
  });

  return progressData;
}

// ========= OPTIMIZED VERSION: Single RPC Call for Progress Calculation =========

/**
 * Calculate progress for all weekly goals using optimized RPC function
 * Replaces calculateBatchGoalProgress with single database call
 * @param year Year
 * @param weekNumber Week number
 * @returns Object mapping goal_slot to progress { completed, total, percentage }
 */
export async function calculateWeeklyGoalsProgress(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  try {
    const { data, error } = await supabase.rpc('calculate_weekly_goals_progress', {
      p_user_id: user.id,
      p_year: year,
      p_week_number: weekNumber
    });

    if (error) {
      console.error("Error calling progress RPC function:", error);
      return {};
    }

    // Convert string keys to number keys for consistency
    const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
    if (data) {
      Object.keys(data).forEach(key => {
        const slot = parseInt(key);
        progressData[slot] = data[key];
      });
    }

    return progressData;
  } catch (error) {
    console.error('Error calculating weekly goals progress:', error);
    return {};
  }
}

// ===== OPTIMIZED BATCHED DATA ACTIONS =====

// ULTRA OPTIMIZED: Get all weekly sync data in single call
export async function getWeeklySyncCompleteData(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      goals: [],
      progress: {},
      rules: [],
      unscheduledTasks: [],
      scheduledTasks: [],
      toDontList: []
    };
  }

  try {
    // OPTIMIZED: Single comprehensive RPC call for all data
    const { data, error } = await supabase.rpc('get_weekly_sync_complete_data', {
      p_user_id: user.id,
      p_year: year,
      p_week_number: weekNumber
    });

    if (error) {
      console.error("Error calling get_weekly_sync_complete_data:", error);
      return {
        goals: [],
        progress: {},
        rules: [],
        unscheduledTasks: [],
        scheduledTasks: [],
        toDontList: []
      };
    }

    return data || {
      goals: [],
      progress: {},
      rules: [],
      unscheduledTasks: [],
      scheduledTasks: [],
      toDontList: []
    };
  } catch (error) {
    console.error("Error in getWeeklySyncCompleteData:", error);
    return {
      goals: [],
      progress: {},
      rules: [],
      unscheduledTasks: [],
      scheduledTasks: [],
      toDontList: []
    };
  }
}

// ===== NEW HIERARCHICAL WEEKLY FOCUS ACTIONS =====

// Get weekly focus for a specific week - OPTIMIZED VERSION
export async function getWeeklyFocus(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // Step 1: Get weekly focus record
    const { data: weeklyFocus, error: focusError } = await supabase
      .from('weekly_focuses')
      .select('id')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .single();

    if (focusError && focusError.code !== 'PGRST116') throw focusError; // PGRST116 = no rows returned
    if (!weeklyFocus) return null;

    // Step 2: Get all focus items
    const { data: focusItems, error: itemsError } = await supabase
      .from('weekly_focus_items')
      .select('id, item_id, item_type')
      .eq('weekly_focus_id', weeklyFocus.id);

    if (itemsError) throw itemsError;
    if (!focusItems || focusItems.length === 0) {
      return {
        id: weeklyFocus.id,
        items: []
      };
    }

    // Step 3: Group items by type for batch queries
    const questIds: string[] = [];
    const milestoneIds: string[] = [];
    const taskIds: string[] = [];
    const subtaskIds: string[] = [];

    focusItems.forEach(item => {
      if (item.item_type === 'QUEST') {
        questIds.push(item.item_id);
      } else if (item.item_type === 'MILESTONE') {
        milestoneIds.push(item.item_id);
      } else if (item.item_type === 'TASK') {
        taskIds.push(item.item_id);
      } else if (item.item_type === 'SUBTASK') {
        subtaskIds.push(item.item_id);
      }
    });

    // Step 4: Batch queries for all item details
    const [questResults, milestoneResults, taskResults, subtaskResults] = await Promise.all([
      questIds.length > 0 ? supabase.from('quests').select('id, title').in('id', questIds) : { data: [] },
      milestoneIds.length > 0 ? supabase.from('milestones').select('id, title').in('id', milestoneIds) : { data: [] },
      taskIds.length > 0 ? supabase.from('tasks').select('id, title, status').in('id', taskIds) : { data: [] },
      subtaskIds.length > 0 ? supabase.from('tasks').select('id, title, status').in('id', subtaskIds) : { data: [] }
    ]);

    // Step 5: Create lookup maps
    const questMap = new Map((questResults.data || []).map(q => [q.id, q]));
    const milestoneMap = new Map((milestoneResults.data || []).map(m => [m.id, m]));
    const taskMap = new Map([...(taskResults.data || []), ...(subtaskResults.data || [])].map(t => [t.id, t]));

    // Step 6: Build items with details using in-memory mapping
    const itemsWithDetails = focusItems.map(item => {
      let title = '';
      let status = 'TODO';

      if (item.item_type === 'QUEST') {
        const quest = questMap.get(item.item_id);
        title = quest?.title || '';
      } else if (item.item_type === 'MILESTONE') {
        const milestone = milestoneMap.get(item.item_id);
        title = milestone?.title || '';
      } else if (item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
        const task = taskMap.get(item.item_id);
        title = task?.title || '';
        status = task?.status || 'TODO';
      }

      return {
        id: item.id,
        item_id: item.item_id,
        item_type: item.item_type,
        title,
        status
      };
    });

    return {
      id: weeklyFocus.id,
      items: itemsWithDetails
    };
  } catch (error) {
    console.error('Error fetching weekly focus:', error);
    return null;
  }
}

// Set weekly focus items
export async function setWeeklyFocusItems(data: {
  year: number;
  weekNumber: number;
  items: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  try {
    // First, upsert weekly focus record
    const { data: weeklyFocus, error: focusError } = await supabase
      .from('weekly_focuses')
      .upsert({
        user_id: user.id,
        year: data.year,
        week_number: data.weekNumber
      }, {
        onConflict: 'user_id,year,week_number'
      })
      .select('id')
      .single();

    if (focusError) throw focusError;

    // Second, delete all existing focus items
    const { error: deleteError } = await supabase
      .from('weekly_focus_items')
      .delete()
      .eq('weekly_focus_id', weeklyFocus.id);

    if (deleteError) throw deleteError;

    // Third, insert new focus items
    if (data.items.length > 0) {
      const focusItemsData = data.items.map(item => ({
        weekly_focus_id: weeklyFocus.id,
        item_id: item.id,
        item_type: item.type
      }));

      const { error: insertError } = await supabase
        .from('weekly_focus_items')
        .insert(focusItemsData);

      if (insertError) throw insertError;
    }

    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Weekly focus set successfully' };
  } catch (error) {
    console.error('Error setting weekly focus:', error);
    throw new Error('Failed to set weekly focus');
  }
}

type TaskStatus = { status: string };

// Utility: Get quest completion progress
async function getQuestProgress(supabase: SupabaseClient, questId: string): Promise<{completed: number; total: number}> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('quest_id', questId);

  if (error) throw error;

  const total = tasks?.length || 0;
  const completed = tasks?.filter((task: TaskStatus) => task.status === 'DONE').length || 0;

  return { completed, total };
}

// Utility: Get milestone completion progress
async function getMilestoneProgress(supabase: SupabaseClient, milestoneId: string): Promise<{completed: number; total: number}> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('milestone_id', milestoneId);

  if (error) throw error;

  const total = tasks?.length || 0;
  const completed = tasks?.filter((task: TaskStatus) => task.status === 'DONE').length || 0;

  return { completed, total };
}

// Utility: Get task completion progress
async function getTaskProgress(supabase: SupabaseClient, taskId: string): Promise<{completed: number; total: number}> {
  const { data: subtasks, error: subtaskError } = await supabase
    .from('tasks')
    .select('status')
    .eq('parent_task_id', taskId);

  if (subtaskError) throw subtaskError;

  if (subtasks && subtasks.length > 0) {
    // Task has subtasks
    const total = subtasks.length;
    const completed = subtasks.filter((task: TaskStatus) => task.status === 'DONE').length;
    return { completed, total };
  } else {
    // Task is standalone
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    const total = 1;
    const completed = task?.status === 'DONE' ? 1 : 0;
    return { completed, total };
  }
}

// Utility: Get subtask completion progress
async function getSubtaskProgress(supabase: SupabaseClient, subtaskId: string): Promise<{completed: number; total: number}> {
  const { data: subtask, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', subtaskId)
    .single();

  if (error) throw error;

  const total = 1;
  const completed = subtask?.status === 'DONE' ? 1 : 0;

  return { completed, total };
}

// Get completion progress for any item type (refactored)
export async function getItemCompletionProgress(itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { completed: 0, total: 0, percentage: 0 };

  try {
    let progress: { completed: number; total: number };

    if (itemType === 'QUEST') {
      progress = await getQuestProgress(supabase, itemId);
    } else if (itemType === 'MILESTONE') {
      progress = await getMilestoneProgress(supabase, itemId);
    } else if (itemType === 'TASK') {
      progress = await getTaskProgress(supabase, itemId);
    } else if (itemType === 'SUBTASK') {
      progress = await getSubtaskProgress(supabase, itemId);
    } else {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    return {
      completed: progress.completed,
      total: progress.total,
      percentage
    };
  } catch (error) {
    console.error('Error calculating completion progress:', error);
    return { completed: 0, total: 0, percentage: 0 };
  }
}

// === TO DON'T LIST (WEEKLY RULES) ACTIONS ===

/**
 * Ambil semua aturan mingguan (To Don't List) untuk user, tahun, dan minggu tertentu
 */
export async function getWeeklyRules(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('weekly_rules')
      .select('id, rule_text, display_order')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching weekly rules:', error);
    return [];
  }
}

/**
 * Tambah aturan baru ke To Don't List minggu ini
 * formData: { rule_text, year, week_number }
 */
export async function addWeeklyRule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  const rule_text = formData.get('rule_text') as string;
  const year = Number(formData.get('year'));
  const week_number = Number(formData.get('week_number'));

  try {
    // Hitung display_order berikutnya
    const { data: existing, error: orderError } = await supabase
      .from('weekly_rules')
      .select('display_order')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', week_number)
      .order('display_order', { ascending: false })
      .limit(1);
    if (orderError) throw orderError;
    const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

    // Insert rule baru, return id
    const { data: inserted, error } = await supabase
      .from('weekly_rules')
      .insert({
        user_id: user.id,
        rule_text,
        year,
        week_number,
        display_order: nextOrder,
      })
      .select('id')
      .single();
    if (error) throw error;
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Aturan berhasil ditambahkan!', id: inserted?.id };
  } catch (error) {
    console.error('Error adding weekly rule:', error);
    return { success: false, message: 'Gagal menambah aturan' };
  }
}

/**
 * Update rule_text dari sebuah aturan berdasarkan id
 */
export async function updateWeeklyRule(id: string, newText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  try {
    const { error } = await supabase
      .from('weekly_rules')
      .update({ rule_text: newText })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Aturan berhasil diupdate!' };
  } catch (error) {
    console.error('Error updating weekly rule:', error);
    return { success: false, message: 'Gagal update aturan' };
  }
}

/**
 * Hapus aturan dari To Don't List berdasarkan id
 */
export async function deleteWeeklyRule(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  try {
    const { error } = await supabase
      .from('weekly_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Aturan berhasil dihapus!' };
  } catch (error) {
    console.error('Error deleting weekly rule:', error);
    return { success: false, message: 'Gagal menghapus aturan' };
  }
} 

/**
 * Update urutan (display_order) beberapa aturan sekaligus
 * @param rules Array of { id, display_order }
 */
export async function updateWeeklyRuleOrder(rules: { id: string; display_order: number }[]) {
  const supabase = await createClient();
  try {
    // Update setiap rule satu per satu (bisa dioptimasi dengan upsert jika perlu)
    for (const rule of rules) {
      const { error } = await supabase
        .from('weekly_rules')
        .update({ display_order: rule.display_order })
        .eq('id', rule.id);
      if (error) throw error;
    }
    revalidatePath('/execution/weekly-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating weekly rule order:', error);
    return { success: false, message: 'Gagal update urutan aturan' };
  }
} 