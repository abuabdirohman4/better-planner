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
  queryWeeklyGoalIdsForWeek,
  deletePlanItem,
  updatePlanItemsDisplayOrderBatch,
  queryRecurringDailyQuests,
  claimRoutineSeeding,
} from './queries';
import {
  buildExistingItemsMap,
  getItemTypes,
  getItemIdsToDelete,
  extractScheduleBackups,
  buildItemsToInsert,
  remapSchedules,
  dayOfWeek,
  pickRoutinesToSeed,
} from './logic';
import { getQuarterDates, quarterOfDate } from '@/lib/quarterUtils';

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
  date?: string,
  year?: number,
  quarter?: number,
  weekNumber?: number
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const resolvedDate = date ?? new Date().toISOString().split('T')[0];
    const resolvedItemId = dailyPlanItemId.startsWith('virtual-') ? null : dailyPlanItemId;

    const data = await updatePlanItemStatusRpc(supabase, taskId, status, user.id, resolvedDate, resolvedItemId);

    // Scope update ke minggu yang sedang aktif menggunakan year+quarter+weekNumber dari caller
    // weekNumber di sini adalah week-of-quarter (1-13), konsisten dengan yang tersimpan di DB
    if (year !== undefined && quarter !== undefined && weekNumber !== undefined) {
      const weeklyGoalIds = await queryWeeklyGoalIdsForWeek(supabase, user.id, year, weekNumber);
      await updateWeeklyGoalItemsStatus(supabase, taskId, status, weeklyGoalIds);
    }

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

/**
 * Isi rutin terjadwal ke rencana `date`, SEKALI per rencana (app-fj81). Rutin yang Abu hapus
 * tidak muncul lagi hari itu. Tanggal lampau tidak diisi.
 */
export async function seedRecurringRoutines(date: string): Promise<{ added: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { added: 0 };

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  if (date < today) return { added: 0 };

  const { year, quarter } = quarterOfDate(new Date(`${date}T12:00:00+07:00`));
  const { startDate, endExclusive } = getQuarterDates(year, quarter);
  const recurring = await queryRecurringDailyQuests(supabase, user.id, startDate.toISOString(), endExclusive.toISOString());
  const dow = dayOfWeek(date);
  if (!recurring.some((t) => t.repeat_days?.includes(dow))) return { added: 0 };

  const plan = await upsertDailyPlan(supabase, user.id, date);
  if (!(await claimRoutineSeeding(supabase, plan.id))) return { added: 0 };

  const existing = await queryExistingPlanItems(supabase, plan.id);
  const ids = pickRoutinesToSeed(recurring, date, new Set(existing.map((i) => i.item_id)));
  if (ids.length === 0) return { added: 0 };

  await insertPlanItems(
    supabase,
    buildItemsToInsert(ids.map((item_id) => ({ item_id, item_type: 'DAILY_QUEST' })), plan.id, buildExistingItemsMap(existing))
  );
  return { added: ids.length };
}

/** Rencana Siklus Kerja hari itu (app-mgsb): [{ minutes, item_id }]. Disimpan utuh, bukan per baris. */
export async function saveCyclePlan(date: string, rows: { minutes: number; item_id: string | null }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const clean = rows.slice(0, 12).map((r) => ({
    minutes: Math.min(240, Math.max(1, Math.round(Number(r.minutes) || 60))),
    item_id: typeof r.item_id === 'string' && r.item_id ? r.item_id : null,
  }));
  const plan = await upsertDailyPlan(supabase, user.id, date);
  const { error } = await supabase.from('daily_plans').update({ cycle_plan: clean }).eq('id', plan.id).eq('user_id', user.id);
  if (error) throw error;
  return { success: true };
}
