"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

    // Get existing items to preserve their status and type
    const { data: existingItems } = await supabase
      .from('daily_plan_items')
      .select('item_id, status, item_type, daily_session_target, focus_duration')
      .eq('daily_plan_id', daily_plan_id);

    // Create a map of existing items for quick lookup
    const existingItemsMap = new Map();
    existingItems?.forEach(item => {
      existingItemsMap.set(item.item_id, item);
    });

    // Delete all existing daily_plan_items
    await supabase.from('daily_plan_items').delete().eq('daily_plan_id', daily_plan_id);

    // Insert new items with preserved status and type
    if (selectedItems.length > 0) {
      const itemsToInsert = selectedItems.map((item) => {
        const existingItem = existingItemsMap.get(item.item_id);
        return { 
          ...item, 
          daily_plan_id,
          status: existingItem?.status || 'TODO', // Preserve existing status
          daily_session_target: existingItem?.daily_session_target || 1, // Preserve existing target
          focus_duration: existingItem?.focus_duration || 10 // Default 10 seconds for testing
        };
      });
      await supabase.from('daily_plan_items').insert(itemsToInsert);
    }

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error setting daily plan:', error);
    throw error;
  }
}

export async function updateDailyPlanItemFocusDuration(dailyPlanItemId: string, focusDuration: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('daily_plan_items')
      .update({ focus_duration: focusDuration })
      .eq('id', dailyPlanItemId);

    if (error) throw error;

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating focus duration:', error);
    throw error;
  }
}

export async function updateDailyPlanItemAndTaskStatus(
  dailyPlanItemId: string, 
  taskId: string, 
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Update both tables in parallel
    const [dailyPlanResult, taskResult] = await Promise.all([
      supabase
        .from('daily_plan_items')
        .update({ status })
        .eq('id', dailyPlanItemId),
      supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
    ]);

    if (dailyPlanResult.error) throw dailyPlanResult.error;
    if (taskResult.error) throw taskResult.error;
    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}
