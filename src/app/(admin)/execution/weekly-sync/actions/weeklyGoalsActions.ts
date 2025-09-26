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
  console.log('🚀 setWeeklyGoalItems called with data:', data);
  
  try {
    const supabase = await createClient();
    console.log('✅ Supabase client created');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('✅ User authenticated:', user?.id);
    if (!user) throw new Error('User not found');
    // First, check if weekly goal already exists for this slot
    const { data: existingGoal, error: checkError } = await supabase
      .from('weekly_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('year', data.year)
      .eq('week_number', data.weekNumber)
      .eq('goal_slot', data.goalSlot)
      .single();

    let weeklyGoal;
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingGoal) {
      // Update existing goal
      const { data: updatedGoal, error: updateError } = await supabase
        .from('weekly_goals')
        .update({
          quarter: data.quarter
        })
        .eq('id', existingGoal.id)
        .select('id')
        .single();
      
      if (updateError) throw updateError;
      weeklyGoal = updatedGoal;
    } else {
      // Insert new goal
      const { data: newGoal, error: insertError } = await supabase
        .from('weekly_goals')
        .insert({
          user_id: user.id,
          year: data.year,
          quarter: data.quarter,
          week_number: data.weekNumber,
          goal_slot: data.goalSlot
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      weeklyGoal = newGoal;
    }

    // Second, delete all existing goal items for this slot
    console.log('🗑️ Deleting existing goal items for weekly_goal_id:', weeklyGoal.id);
    const { error: deleteError } = await supabase
      .from('weekly_goal_items')
      .delete()
      .eq('weekly_goal_id', weeklyGoal.id);

    if (deleteError) {
      console.error('❌ Error deleting existing goal items:', deleteError);
      throw deleteError;
    }
    console.log('✅ Successfully deleted existing goal items');

    if (data.items.length > 0) {
      // Remove duplicates from items array
      const uniqueItems = data.items.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      console.log('📝 Inserting new goal items:', {
        uniqueItems: uniqueItems.map(item => ({ id: item.id, type: item.type })),
        weeklyGoalId: weeklyGoal.id
      });

      const goalItemsData = uniqueItems.map(item => ({
        weekly_goal_id: weeklyGoal.id,
        item_id: item.id
        // item_type removed since we deleted that column
      }));

      const { error: insertError } = await supabase
        .from('weekly_goal_items')
        .insert(goalItemsData);

      if (insertError) {
        console.error('❌ Error inserting new goal items:', insertError);
        // If unique constraint violation, ignore it (item already exists)
        if (insertError.code === '23505') {
          console.log('Some items already exist in this weekly goal, skipping duplicates');
        } else {
          throw insertError;
        }
      } else {
        console.log('✅ Successfully inserted new goal items');
      }
    } else {
      console.log('📝 No items to insert, keeping empty goal');
    }

    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Weekly goal items set successfully' };
  } catch (error) {
    console.error('Error setting weekly goal items:', error);
    throw new Error('Failed to set weekly goal items');
  }
}
