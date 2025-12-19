"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';

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

    // Get the item types from selectedItems to determine what to delete
    const itemTypesToUpdate = [...new Set(selectedItems.map(item => item.item_type))];

    // Delete only existing items of the same types as selectedItems
    if (itemTypesToUpdate.length > 0) {
      await supabase
        .from('daily_plan_items')
        .delete()
        .eq('daily_plan_id', daily_plan_id)
        .in('item_type', itemTypesToUpdate);
    }

    // Insert new items with preserved status and type
    if (selectedItems.length > 0) {
      const itemsToInsert = selectedItems.map((item) => {
        const existingItem = existingItemsMap.get(item.item_id);
        return {
          ...item,
          daily_plan_id,
          status: existingItem?.status || 'TODO', // Preserve existing status
          daily_session_target: existingItem?.daily_session_target || 1, // Preserve existing target
          focus_duration: existingItem?.focus_duration || 25 // Default 25 minutes
        };
      });
      await supabase.from('daily_plan_items').insert(itemsToInsert);
    }

    // ✅ CRITICAL: Revalidate all daily sync related paths
    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');

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

    // ✅ CRITICAL: Revalidate daily sync paths to ensure UI updates
    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');

    return { success: true };
  } catch (error) {
    console.error('Error updating focus duration:', error);
    throw error;
  }
}

export async function updateDailyPlanItemAndTaskStatus(
  dailyPlanItemId: string,
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  itemType?: string,
  date?: string
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
      p_goal_slot: null, // Not used for daily sync
      p_date: date || new Date().toISOString().split('T')[0],
      p_daily_plan_item_id: dailyPlanItemId.startsWith('virtual-') ? null : dailyPlanItemId
    });

    if (error) {
      throw error;
    }

    // ✅ CRITICAL: Also update weekly_goal_items.status for all weekly goals containing this task
    // This ensures weekly-sync page reflects the updated status even when p_goal_slot is null
    const { error: weeklyGoalItemsError } = await supabase
      .from('weekly_goal_items')
      .update({ status })
      .eq('item_id', taskId);

    if (weeklyGoalItemsError) {
      // Log error but don't throw - task status is already updated
      console.warn('Error updating weekly_goal_items status:', weeklyGoalItemsError);
    }

    // ✅ CRITICAL: Revalidate multiple paths to ensure cross-page synchronization
    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');
    revalidatePath('/planning/main-quests');
    revalidatePath('/execution/weekly-sync');

    return data;
  } catch (error) {
    console.error("Error in updateDailyPlanItemAndTaskStatus:", error);
    throw error;
  }
}


export async function removeDailyPlanItem(dailyPlanItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('daily_plan_items')
      .delete()
      .eq('id', dailyPlanItemId);

    if (error) throw error;

    // ✅ CRITICAL: Revalidate all daily sync related paths
    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');

    return { success: true };
  } catch (error) {
    console.error('Error removing daily plan item:', error);
    throw error;
  }
}

export async function convertToChecklist(dailyPlanItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // ✅ FIXED: Update both focus_duration AND daily_session_target to 0 for checklist mode
    const { error } = await supabase
      .from('daily_plan_items')
      .update({
        focus_duration: 0,
        daily_session_target: 0  // ✅ NEW: Also update daily_session_target
      })
      .eq('id', dailyPlanItemId);

    if (error) throw error;

    // ✅ CRITICAL: Revalidate paths untuk update TargetFocus dan DailySync
    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');

    return { success: true };
  } catch (error) {
    console.error('Error converting to checklist:', error);
    throw error;
  }
}

export async function convertToQuest(dailyPlanItemId: string, defaultFocusDuration: number = 25) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // ✅ NEW: Update focus_duration back to default and restore daily_session_target to 1
    const { error } = await supabase
      .from('daily_plan_items')
      .update({
        focus_duration: defaultFocusDuration,
        daily_session_target: 1  // Restore to default
      })
      .eq('id', dailyPlanItemId);

    if (error) throw error;

    // ✅ CRITICAL: Revalidate paths untuk update TargetFocus dan DailySync
    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');

    return { success: true };
  } catch (error) {
    console.error('Error converting to quest:', error);
    throw error;
  }
}

// Update display_order for multiple daily plan items (batch update)
export async function updateDailyPlanItemsDisplayOrder(
  items: { id: string; display_order: number }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Batch update all items
    for (const item of items) {
      const { error } = await supabase
        .from('daily_plan_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id);

      if (error) throw error;
    }

    revalidatePath('/execution/daily-sync');
    revalidatePath('/execution');
    return { success: true, message: 'Urutan task berhasil diupdate!' };
  } catch (error) {
    console.error('Error updating daily plan items order:', error);
    throw new Error('Gagal update urutan task: ' + ((error as Error).message || ''));
  }
}
