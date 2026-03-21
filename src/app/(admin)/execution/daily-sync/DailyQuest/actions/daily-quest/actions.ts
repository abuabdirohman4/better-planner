"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getQuarterDates } from '@/lib/quarterUtils';
import {
  insertDailyQuestTask,
  updateDailyQuestArchive,
  queryTimerSessions,
  deleteTimerEvents,
  deleteTimerSessions,
  deleteActivityLogs,
  deleteDailyPlanItems,
  deleteTask,
  queryDailyQuests,
  updateTask,
} from './queries';
import { parseDailyQuestFormData, extractSessionIds } from './logic';

export async function addDailyQuest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { title, focusDuration } = parseDailyQuestFormData(formData);

  const task = await insertDailyQuestTask(supabase, user.id, title, focusDuration);

  revalidatePath('/quests/daily-quests');
  return task;
}

export async function archiveDailyQuest(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateDailyQuestArchive(supabase, taskId);

  revalidatePath('/quests/daily-quests');
  return { success: true };
}

export async function deleteDailyQuest(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const sessions = await queryTimerSessions(supabase, taskId, user.id);

  if (sessions.length > 0) {
    const sessionIds = extractSessionIds(sessions);
    await deleteTimerEvents(supabase, sessionIds);
  }

  await deleteTimerSessions(supabase, taskId, user.id);
  await deleteActivityLogs(supabase, taskId, user.id);
  await deleteDailyPlanItems(supabase, taskId);
  await deleteTask(supabase, taskId, user.id);

  revalidatePath('/quests/daily-quests');
  return { success: true };
}

export async function getDailyQuests(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { startDate, endDate } = getQuarterDates(year, quarter);

  const data = await queryDailyQuests(
    supabase,
    user.id,
    startDate.toISOString(),
    endDate.toISOString()
  );

  return data;
}

export async function updateDailyQuest(taskId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const data = await updateTask(supabase, taskId, updates);

  revalidatePath('/quests/daily-quests');
  return data;
}
