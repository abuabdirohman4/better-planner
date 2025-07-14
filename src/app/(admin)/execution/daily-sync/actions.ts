"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Get tasks available for selection from weekly goals for the current week
export async function getTasksForWeek(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;

  try {
    // Get all weekly goals for the week
    const { data: weeklyGoals, error: wgError } = await supabase
      .from('weekly_goals')
      .select('id, goal_slot')
      .eq('user_id', user_id)
      .eq('year', year)
      .eq('week_number', weekNumber);

    if (wgError) throw wgError;
    if (!weeklyGoals?.length) return [];

    const weeklyGoalIds = weeklyGoals.map(g => g.id);

    // Get all weekly goal items
    const { data: items, error: itemsError } = await supabase
      .from('weekly_goal_items')
      .select('id, weekly_goal_id, item_id, item_type')
      .in('weekly_goal_id', weeklyGoalIds);

    if (itemsError) throw itemsError;
    if (!items?.length) return [];

    // Get details for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        let title = '';
        let status = 'TODO';
        let quest_title = '';
        const goal_slot = weeklyGoals.find(g => g.id === item.weekly_goal_id)?.goal_slot || 0;

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
            .select('id, title, status, milestone_id')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
          status = task?.status || 'TODO';
          
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
        }

        return {
          id: item.item_id,
          type: item.item_type,
          title,
          status,
          quest_title,
          goal_slot
        };
      })
    );

    return itemsWithDetails;
  } catch (error) {
    console.error('Error fetching tasks for week:', error);
    throw error;
  }
}

// Get daily plan for a specific date
export async function getDailyPlan(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;

  try {
    const { data: plan, error } = await supabase
      .from('daily_plans')
      .select('*, daily_plan_items(*)')
      .eq('plan_date', date)
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    
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
    throw error;
  }
}

// Set daily plan with selected items
export async function setDailyPlan(date: string, selectedItems: { item_id: string; item_type: string }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;

  try {
    // Upsert daily_plans
    const { data: plan, error: upsertError } = await supabase
      .from('daily_plans')
      .upsert({ user_id: user_id, plan_date: date }, { onConflict: 'user_id,plan_date' })
      .select()
      .single();

    if (upsertError) throw upsertError;
    const daily_plan_id = plan.id;

    // Delete all existing daily_plan_items
    await supabase.from('daily_plan_items').delete().eq('daily_plan_id', daily_plan_id);

    // Insert new items
    if (selectedItems.length > 0) {
      const itemsToInsert = selectedItems.map((item) => ({ 
        ...item, 
        daily_plan_id,
        status: 'TODO'
      }));
      await supabase.from('daily_plan_items').insert(itemsToInsert);
    }

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error setting daily plan:', error);
    throw error;
  }
}

// Add a side quest directly to daily plan
export async function addSideQuest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const title = formData.get('title')?.toString();
  const date = formData.get('date')?.toString();
  
  if (!title || !date) {
    throw new Error('Title and date are required');
  }

  try {
    // First, create a task for the side quest
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title,
        type: 'SIDE_QUEST',
        status: 'TODO'
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Then add it to daily plan
    const { data: plan, error: planError } = await supabase
      .from('daily_plans')
      .upsert({ user_id: user.id, plan_date: date }, { onConflict: 'user_id,plan_date' })
      .select()
      .single();

    if (planError) throw planError;

    // Add to daily plan items with SIDE_QUEST type
    await supabase.from('daily_plan_items').insert({
      daily_plan_id: plan.id,
      item_id: task.id,
      item_type: 'SIDE_QUEST',
      status: 'TODO'
    });

    revalidatePath('/execution/daily-sync');
    return task;
  } catch (error) {
    console.error('Error adding side quest:', error);
    throw error;
  }
}

// Update status of a daily plan item
export async function updateDailyPlanItemStatus(itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('daily_plan_items')
      .update({ status })
      .eq('item_id', itemId);

    if (error) throw error;
    
    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating daily plan item status:', error);
    throw error;
  }
} 

// Log Pomodoro session activity
export async function logActivity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const taskId = formData.get('taskId')?.toString();
  const taskTitle = formData.get('taskTitle')?.toString(); // tidak dipakai di tabel
  const duration = parseInt(formData.get('duration')?.toString() || '0'); // dalam detik
  const sessionType = formData.get('sessionType')?.toString() as 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  const date = formData.get('date')?.toString(); // format YYYY-MM-DD

  // Logging input
  console.log('[logActivity] input:', { taskId, taskTitle, duration, sessionType, date, userId: user.id });

  if (!taskId || !duration || !sessionType) {
    console.error('[logActivity] Missing required fields', { taskId, duration, sessionType });
    throw new Error('Missing required fields');
  }

  // Hitung waktu
  const now = new Date();
  const end_time = now.toISOString();
  const start_time = new Date(now.getTime() - duration * 1000).toISOString();
  const duration_minutes = Math.round(duration / 60) || 1; // minimal 1 menit

  try {
    const { data: activity, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        task_id: taskId,
        type: sessionType,
        start_time,
        end_time,
        duration_minutes
      })
      .select()
      .single();

    if (error) {
      console.error('[logActivity] Supabase error:', error);
      throw error;
    }
    
    revalidatePath('/execution/daily-sync');
    return activity;
  } catch (error) {
    console.error('[logActivity] Exception:', error);
    throw error;
  }
} 

// Update daily session target for a daily plan item
export async function updateDailySessionTarget(dailyPlanItemId: string, newTarget: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('daily_plan_items')
      .update({ daily_session_target: newTarget })
      .eq('id', dailyPlanItemId);

    if (error) throw error;
    revalidatePath('/execution/daily-sync');
    return { success: true, message: 'Target sesi harian berhasil diupdate.' };
  } catch (error) {
    console.error('Error updating daily session target:', error);
    throw error;
  }
}

// Count completed FOCUS sessions for a daily plan item on a specific date
export async function countCompletedSessions(dailyPlanItemId: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Ambil item_id dari daily_plan_items
    const { data: dailyPlanItem, error: itemError } = await supabase
      .from('daily_plan_items')
      .select('item_id')
      .eq('id', dailyPlanItemId)
      .single();
    if (itemError) throw itemError;
    const itemId = dailyPlanItem?.item_id;
    if (!itemId) throw new Error('Item ID not found');

    // Hitung jumlah sesi FOCUS di activity_logs untuk item_id dan tanggal
    // start_time format: 2025-07-13T10:00:00.000Z, kita filter dengan LIKE '2025-07-13%'
    const { count, error: countError } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('task_id', itemId)
      .eq('type', 'FOCUS')
      .like('start_time', `${date}%`);
    if (countError) throw countError;
    return count || 0;
  } catch (error) {
    console.error('Error counting completed sessions:', error);
    throw error;
  }
} 