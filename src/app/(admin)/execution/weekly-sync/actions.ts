"use server";

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

// ===== OPTIMIZED BATCHED DATA ACTIONS =====

// 🚀 ULTRA FAST: Use existing optimized functions for maximum performance
export async function getWeeklySyncUltraFast(year: number, quarter: number, weekNumber: number, startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      goals: [],
      progress: {},
      rules: [],
      weekDates: []
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_weekly_sync_ultra_fast', {
      p_user_id: user.id,
      p_year: year,
      p_quarter: quarter,
      p_week_number: weekNumber,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error("Error calling get_weekly_sync_ultra_fast:", error);
      return {
        goals: [],
        progress: {},
        rules: [],
        weekDates: []
      };
    }

    // 🚀 OPTIMIZED: Only return data that's actually used
    const optimizedData = {
      goals: data?.goals || [],
      progress: data?.progress || {},
      rules: data?.rules || []
    };

    return optimizedData;
  } catch (error) {
    console.error("Error in getWeeklySyncUltraFast:", error);
    return {
      goals: [],
      progress: {},
      rules: [],
      weekDates: []
    };
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