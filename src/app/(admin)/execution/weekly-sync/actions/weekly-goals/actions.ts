"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  deleteWeeklyGoal,
  queryExistingWeeklyGoal,
  updateWeeklyGoalQuarter,
  insertWeeklyGoal,
  queryExistingGoalItems,
  deleteGoalItems,
  upsertGoalItems,
} from './queries';
import { buildExistingStatusMap, deduplicateItems, buildGoalItemsToInsert } from './logic';

export async function removeWeeklyGoal(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  try {
    await deleteWeeklyGoal(supabase, goalId, user.id);
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Weekly goal removed successfully' };
  } catch (error) {
    console.error('Error removing weekly goal:', error);
    throw new Error('Failed to remove weekly goal');
  }
}

export async function setWeeklyGoalItems(data: {
  year: number;
  quarter: number;
  weekNumber: number;
  goalSlot: number;
  items: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const existingGoal = await queryExistingWeeklyGoal(
      supabase,
      user.id,
      data.year,
      data.quarter,
      data.weekNumber,
      data.goalSlot
    );

    let weeklyGoal: { id: string };
    if (existingGoal) {
      weeklyGoal = await updateWeeklyGoalQuarter(supabase, existingGoal.id, data.quarter);
    } else {
      weeklyGoal = await insertWeeklyGoal(
        supabase,
        user.id,
        data.year,
        data.quarter,
        data.weekNumber,
        data.goalSlot
      );
    }

    const existingItems = await queryExistingGoalItems(supabase, weeklyGoal.id);
    const statusMap = buildExistingStatusMap(existingItems);

    const uniqueItems = deduplicateItems(data.items);
    const goalItemsData = buildGoalItemsToInsert(uniqueItems, weeklyGoal.id, statusMap);
    // Upsert dulu, baru hapus sisa — kalau upsert gagal, item lama tetap utuh.
    await upsertGoalItems(supabase, goalItemsData);
    await deleteGoalItems(supabase, weeklyGoal.id, uniqueItems.map((i) => i.id));

    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Weekly goal items set successfully' };
  } catch (error) {
    console.error('Error setting weekly goal items:', error);
    throw new Error('Failed to set weekly goal items');
  }
}
