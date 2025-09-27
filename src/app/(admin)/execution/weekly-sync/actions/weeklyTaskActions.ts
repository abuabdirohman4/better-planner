"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateWeeklyTaskStatus(
  taskId: string,
  goalSlot: number,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('update_task_and_daily_plan_status', {
      p_task_id: taskId,
      p_status: status,
      p_user_id: user.id,
      p_goal_slot: goalSlot,
      p_date: new Date().toISOString().split('T')[0], // Today's date
      p_daily_plan_item_id: null // Not used for weekly sync
    });

    if (error) {
      throw error;
    }

    revalidatePath('/execution/weekly-sync');
    return data;
  } catch (error) {
    console.error("Error in updateWeeklyTaskStatus:", error);
    throw error;
  }
}
