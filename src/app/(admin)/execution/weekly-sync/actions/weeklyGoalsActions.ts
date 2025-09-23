"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
  quarter: number;
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
        quarter: data.quarter,
        week_number: data.weekNumber,
        goal_slot: data.goalSlot
      }, {
        onConflict: 'user_id,year,quarter,week_number,goal_slot'
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

    if (data.items.length > 0) {
      const goalItemsData = data.items.map(item => ({
        weekly_goal_id: weeklyGoal.id,
        item_id: item.id
        // item_type removed since we deleted that column
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
