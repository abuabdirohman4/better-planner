"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryTaskTitlesByIds,
  rpcUpdateTaskStatus,
  updateWeeklyGoalItemsStatus,
} from './queries';
import { buildTitleMap, resolveWeekDate } from './logic';

export async function getTaskTitles(taskIds: string[]): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    if (!taskIds || taskIds.length === 0) return {};
    const tasks = await queryTaskTitlesByIds(supabase, taskIds);
    return buildTitleMap(tasks);
  } catch (error) {
    console.error('Error in getTaskTitles:', error);
    return {};
  }
}

export async function updateWeeklyTaskStatus(
  taskId: string,
  goalSlot: number,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  weekDate?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const resolvedDate = resolveWeekDate(weekDate);
    const data = await rpcUpdateTaskStatus(supabase, taskId, status, user.id, goalSlot, resolvedDate);
    await updateWeeklyGoalItemsStatus(supabase, taskId, status);

    revalidatePath('/execution/weekly-sync');
    revalidatePath('/planning/main-quests');
    revalidatePath('/execution/daily-sync');
    return data;
  } catch (error) {
    console.error('Error in updateWeeklyTaskStatus:', error);
    throw error;
  }
}
