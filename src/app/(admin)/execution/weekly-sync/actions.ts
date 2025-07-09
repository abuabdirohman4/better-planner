"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

// Get hierarchical data (Quest -> Milestone -> Task -> Sub-task) for the current quarter
export async function getHierarchicalData(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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

    // Build hierarchical structure
    const hierarchicalData = await Promise.all(
      (quests || []).map(async (quest) => {
        // Get milestones for this quest
        const { data: milestones, error: milestoneError } = await supabase
          .from('milestones')
          .select('id, title')
          .eq('quest_id', quest.id)
          .order('display_order', { ascending: true });

        if (milestoneError) throw milestoneError;

        // Get tasks for each milestone
        const milestonesWithTasks = await Promise.all(
          (milestones || []).map(async (milestone) => {
            const { data: tasks, error: taskError } = await supabase
              .from('tasks')
              .select('id, title, status')
              .eq('milestone_id', milestone.id)
              .is('parent_task_id', null) // Only parent tasks
              .order('display_order', { ascending: true });

            if (taskError) throw taskError;

            // Get subtasks for each task
            const tasksWithSubtasks = await Promise.all(
              (tasks || []).map(async (task) => {
                const { data: subtasks, error: subtaskError } = await supabase
                  .from('tasks')
                  .select('id, title, status')
                  .eq('parent_task_id', task.id)
                  .order('display_order', { ascending: true });

                if (subtaskError) throw subtaskError;

                return {
                  ...task,
                  subtasks: subtasks || []
                };
              })
            );

            return {
              ...milestone,
              tasks: tasksWithSubtasks
            };
          })
        );

        return {
          ...quest,
          milestones: milestonesWithTasks
        };
      })
    );

    return hierarchicalData;
  } catch (error) {
    console.error('Error fetching hierarchical data:', error);
    return [];
  }
}

// Get weekly goals for a specific week (3 slots)
export async function getWeeklyGoals(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // Get all 3 goal slots for the week
    const { data: weeklyGoals, error } = await supabase
      .from('weekly_goals')
      .select('id, goal_slot')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .order('goal_slot', { ascending: true });

    if (error) throw error;

    // Get items for each goal slot
    const goalsWithItems = await Promise.all(
      (weeklyGoals || []).map(async (goal) => {
        const { data: goalItems, error: itemsError } = await supabase
          .from('weekly_goal_items')
          .select('id, item_id, item_type')
          .eq('weekly_goal_id', goal.id);

        if (itemsError) throw itemsError;

        // Get details for each item
        const itemsWithDetails = await Promise.all(
          (goalItems || []).map(async (item) => {
            let title = '';
            let status = 'TODO';
            let priority_score: number | undefined = undefined;
            let display_order: number | undefined = undefined;
            let quest_id: string | undefined = undefined;
            let milestone_id: string | undefined = undefined;
            let parent_task_id: string | undefined = undefined;

            // New: parent quest info
            let parent_quest_id: string | undefined = undefined;
            let parent_quest_title: string | undefined = undefined;
            let parent_quest_priority_score: number | undefined = undefined;

            if (item.item_type === 'QUEST') {
              const { data: quest } = await supabase
                .from('quests')
                .select('id, title, priority_score')
                .eq('id', item.item_id)
                .single();
              title = quest?.title || '';
              priority_score = quest?.priority_score;
              quest_id = quest?.id;
              // Parent quest info
              parent_quest_id = quest?.id;
              parent_quest_title = quest?.title;
              parent_quest_priority_score = quest?.priority_score;
            } else if (item.item_type === 'MILESTONE') {
              const { data: milestone } = await supabase
                .from('milestones')
                .select('title, display_order, quest_id')
                .eq('id', item.item_id)
                .single();
              title = milestone?.title || '';
              display_order = milestone?.display_order;
              quest_id = milestone?.quest_id;
              // Parent quest info
              if (milestone?.quest_id) {
                const { data: quest } = await supabase
                  .from('quests')
                  .select('id, title, priority_score')
                  .eq('id', milestone.quest_id)
                  .single();
                parent_quest_id = quest?.id;
                parent_quest_title = quest?.title;
                parent_quest_priority_score = quest?.priority_score;
              }
            } else if (item.item_type === 'TASK') {
              const { data: task } = await supabase
                .from('tasks')
                .select('title, status, display_order, milestone_id, parent_task_id')
                .eq('id', item.item_id)
                .single();
              title = task?.title || '';
              status = task?.status || 'TODO';
              display_order = task?.display_order;
              milestone_id = task?.milestone_id;
              parent_task_id = task?.parent_task_id;
              // Parent quest info
              if (task?.milestone_id) {
                const { data: milestone } = await supabase
                  .from('milestones')
                  .select('id, quest_id')
                  .eq('id', task.milestone_id)
                  .single();
                if (milestone?.quest_id) {
                  const { data: quest } = await supabase
                    .from('quests')
                    .select('id, title, priority_score')
                    .eq('id', milestone.quest_id)
                    .single();
                  parent_quest_id = quest?.id;
                  parent_quest_title = quest?.title;
                  parent_quest_priority_score = quest?.priority_score;
                }
              }
            } else if (item.item_type === 'SUBTASK') {
              const { data: subtask } = await supabase
                .from('tasks')
                .select('title, status, display_order, milestone_id, parent_task_id')
                .eq('id', item.item_id)
                .single();
              title = subtask?.title || '';
              status = subtask?.status || 'TODO';
              display_order = subtask?.display_order;
              milestone_id = subtask?.milestone_id;
              parent_task_id = subtask?.parent_task_id;
              // Parent quest info
              if (subtask?.milestone_id) {
                const { data: milestone } = await supabase
                  .from('milestones')
                  .select('id, quest_id')
                  .eq('id', subtask.milestone_id)
                  .single();
                if (milestone?.quest_id) {
                  const { data: quest } = await supabase
                    .from('quests')
                    .select('id, title, priority_score')
                    .eq('id', milestone.quest_id)
                    .single();
                  parent_quest_id = quest?.id;
                  parent_quest_title = quest?.title;
                  parent_quest_priority_score = quest?.priority_score;
                }
              }
            }

            return {
              id: item.id,
              item_id: item.item_id,
              item_type: item.item_type,
              title,
              status,
              priority_score,
              display_order,
              quest_id,
              milestone_id,
              parent_task_id,
              parent_quest_id,
              parent_quest_title,
              parent_quest_priority_score
            };
          })
        );

        return {
          id: goal.id,
          goal_slot: goal.goal_slot,
          items: itemsWithDetails
        };
      })
    );

    return goalsWithItems;
  } catch (error) {
    console.error('Error fetching weekly goals:', error);
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

// Calculate progress for a collection of items
export async function calculateGoalProgress(items: Array<{ item_id: string; item_type: string }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { completed: 0, total: 0, percentage: 0 };

  try {
    let totalCompleted = 0;
    let totalItems = 0;

    for (const item of items) {
      let status: string | undefined = undefined;
      try {
        if (item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
          const { data: task } = await supabase
            .from('tasks')
            .select('status')
            .eq('id', item.item_id)
            .single();
          status = task?.status;
          if (!task) {
            console.error('Task/Subtask not found for item_id', item.item_id);
          }
        } else if (item.item_type === 'MILESTONE') {
          const { data: milestone } = await supabase
            .from('milestones')
            .select('status')
            .eq('id', item.item_id)
            .single();
          status = milestone?.status;
          if (!milestone) {
            console.error('Milestone not found for item_id', item.item_id);
          }
        } else if (item.item_type === 'QUEST') {
          const { data: quest } = await supabase
            .from('quests')
            .select('status')
            .eq('id', item.item_id)
            .single();
          status = quest?.status;
          if (!quest) {
            console.error('Quest not found for item_id', item.item_id);
          }
        }
      } catch (e) {
        console.error('Error fetching status for item', item, e);
      }
      totalItems += 1;
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

// ===== NEW HIERARCHICAL WEEKLY FOCUS ACTIONS =====

// Get weekly focus for a specific week
export async function getWeeklyFocus(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // Get weekly focus record
    const { data: weeklyFocus, error: focusError } = await supabase
      .from('weekly_focuses')
      .select('id')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .single();

    if (focusError && focusError.code !== 'PGRST116') throw focusError; // PGRST116 = no rows returned

    if (!weeklyFocus) return null;

    // Get focus items
    const { data: focusItems, error: itemsError } = await supabase
      .from('weekly_focus_items')
      .select('id, item_id, item_type')
      .eq('weekly_focus_id', weeklyFocus.id);

    if (itemsError) throw itemsError;

    // Get details for each item
    const itemsWithDetails = await Promise.all(
      (focusItems || []).map(async (item) => {
        let title = '';
        let status = 'TODO';

        if (item.item_type === 'QUEST') {
          const { data: quest } = await supabase
            .from('quests')
            .select('title')
            .eq('id', item.item_id)
            .single();
          title = quest?.title || '';
        } else if (item.item_type === 'MILESTONE') {
          const { data: milestone } = await supabase
            .from('milestones')
            .select('title')
            .eq('id', item.item_id)
            .single();
          title = milestone?.title || '';
        } else if (item.item_type === 'TASK') {
          const { data: task } = await supabase
            .from('tasks')
            .select('title, status')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
          status = task?.status || 'TODO';
        } else if (item.item_type === 'SUBTASK') {
          const { data: subtask } = await supabase
            .from('tasks')
            .select('title, status')
            .eq('id', item.item_id)
            .single();
          title = subtask?.title || '';
          status = subtask?.status || 'TODO';
        }

        return {
          id: item.id,
          item_id: item.item_id,
          item_type: item.item_type,
          title,
          status
        };
      })
    );

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

// Get completion progress for any item type
export async function getItemCompletionProgress(itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { completed: 0, total: 0, percentage: 0 };

  try {
    let completed = 0;
    let total = 0;

    if (itemType === 'QUEST') {
      // For quests, count all tasks under all milestones of this quest
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('quest_id', itemId);

      if (error) throw error;

      total = tasks?.length || 0;
      completed = tasks?.filter(task => task.status === 'DONE').length || 0;
    } else if (itemType === 'MILESTONE') {
      // For milestones, count all tasks under this milestone (including subtasks)
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('milestone_id', itemId);

      if (error) throw error;

      total = tasks?.length || 0;
      completed = tasks?.filter(task => task.status === 'DONE').length || 0;
    } else if (itemType === 'TASK') {
      // For tasks, count subtasks if any, otherwise just the task itself
      const { data: subtasks, error: subtaskError } = await supabase
        .from('tasks')
        .select('status')
        .eq('parent_task_id', itemId);

      if (subtaskError) throw subtaskError;

      if (subtasks && subtasks.length > 0) {
        // Task has subtasks
        total = subtasks.length;
        completed = subtasks.filter(task => task.status === 'DONE').length;
      } else {
        // Task is standalone
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('status')
          .eq('id', itemId)
          .single();

        if (taskError) throw taskError;

        total = 1;
        completed = task?.status === 'DONE' ? 1 : 0;
      }
    } else if (itemType === 'SUBTASK') {
      // For subtasks, just check the subtask itself
      const { data: subtask, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      total = 1;
      completed = subtask?.status === 'DONE' ? 1 : 0;
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
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