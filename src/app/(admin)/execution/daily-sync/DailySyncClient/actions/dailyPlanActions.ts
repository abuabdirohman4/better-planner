"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

export async function updateDailyPlanItemStatus(itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('daily_plan_items')
      .update({ status })
      .eq('id', itemId);

    if (error) throw error;

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating daily plan item status:', error);
    throw error;
  }
}

export async function updateDailySessionTarget(dailyPlanItemId: string, newTarget: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('daily_plan_items')
      .update({ session_target: newTarget })
      .eq('id', dailyPlanItemId);

    if (error) throw error;

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating daily session target:', error);
    throw error;
  }
}
