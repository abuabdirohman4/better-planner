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
