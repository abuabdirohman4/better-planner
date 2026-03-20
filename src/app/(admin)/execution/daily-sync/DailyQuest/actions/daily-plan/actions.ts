"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  upsertDailyPlan,
  queryExistingPlanItems,
  querySchedulesByPlanItemIds,
  deletePlanItemsByTypes,
  insertPlanItems,
  insertTaskSchedules,
  updatePlanItemField,
  updatePlanItemStatusRpc,
  updateWeeklyGoalItemsStatus,
  deletePlanItem,
  updatePlanItemsDisplayOrderBatch,
} from './queries';
import {
  buildExistingItemsMap,
  getItemTypes,
  getItemIdsToDelete,
  extractScheduleBackups,
  buildItemsToInsert,
  remapSchedules,
} from './logic';

function revalidatePlanning() {
  revalidatePath('/planning/main-quests');
}

export async function setDailyPlan(
  date: string,
  selectedItems: { item_id: string; item_type: string }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const plan = await upsertDailyPlan(supabase, user.id, date);
    const existingItems = await queryExistingPlanItems(supabase, plan.id);
    const existingItemsMap = buildExistingItemsMap(existingItems);
    const itemTypes = getItemTypes(selectedItems);
    const itemIdsToDelete = getItemIdsToDelete(existingItems, itemTypes);

    // Backup schedules before CASCADE delete
    const rawSchedules = await querySchedulesByPlanItemIds(supabase, itemIdsToDelete);
    const backups = extractScheduleBackups(rawSchedules);

    await deletePlanItemsByTypes(supabase, plan.id, itemTypes);

    if (selectedItems.length > 0) {
      const itemsToInsert = buildItemsToInsert(selectedItems, plan.id, existingItemsMap);
      const newItems = await insertPlanItems(supabase, itemsToInsert);

      // Restore schedules with new IDs
      const schedulesToRestore = remapSchedules(backups, newItems);
      await insertTaskSchedules(supabase, schedulesToRestore);
    }

    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error setting daily plan:', error);
    throw error;
  }
}

export async function updateDailyPlanItemFocusDuration(
  dailyPlanItemId: string,
  focusDuration: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await updatePlanItemField(supabase, dailyPlanItemId, { focus_duration: focusDuration });
    revalidatePlanning();
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
    if (!user) throw new Error('User not authenticated');

    const resolvedDate = date ?? new Date().toISOString().split('T')[0];
    const resolvedItemId = dailyPlanItemId.startsWith('virtual-') ? null : dailyPlanItemId;

    const data = await updatePlanItemStatusRpc(supabase, taskId, status, user.id, resolvedDate, resolvedItemId);
    await updateWeeklyGoalItemsStatus(supabase, taskId, status);
    revalidatePlanning();
    return data;
  } catch (error) {
    console.error('Error in updateDailyPlanItemAndTaskStatus:', error);
    throw error;
  }
}

export async function removeDailyPlanItem(dailyPlanItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await deletePlanItem(supabase, dailyPlanItemId);
    revalidatePlanning();
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
    await updatePlanItemField(supabase, dailyPlanItemId, { focus_duration: 0, daily_session_target: 0 });
    revalidatePlanning();
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
    await updatePlanItemField(supabase, dailyPlanItemId, { focus_duration: defaultFocusDuration, daily_session_target: 1 });
    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error converting to quest:', error);
    throw error;
  }
}

export async function updateDailyPlanItemsDisplayOrder(
  items: { id: string; display_order: number }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await updatePlanItemsDisplayOrderBatch(supabase, items);
    revalidatePlanning();
    return { success: true, message: 'Urutan task berhasil diupdate!' };
  } catch (error) {
    console.error('Error updating daily plan items order:', error);
    throw new Error('Gagal update urutan task: ' + ((error as Error).message || ''));
  }
}
