"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryActivityLogById,
  updateActivityLogJournal,
  checkDuplicateLog,
  insertActivityLogWithJournal,
} from './queries';
import { parseJournalFormData, calculateDurationMinutes, sanitizeJournalField } from './logic';

export async function getActivityLogById(activityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return queryActivityLogById(supabase, user.id, activityId);
}

export async function updateActivityJournal(
  activityId: string,
  whatDone: string,
  whatThink: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const data = await updateActivityLogJournal(
    supabase,
    user.id,
    activityId,
    sanitizeJournalField(whatDone),
    sanitizeJournalField(whatThink),
  );

  revalidatePath('/execution/daily-sync');
  return data;
}

export async function logActivityWithJournal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { taskId, sessionType, date, startTime, endTime, whatDone, whatThink } =
    parseJournalFormData(formData);

  const durationInMinutes = calculateDurationMinutes(startTime, endTime);

  const existingSession = await checkDuplicateLog(supabase, user.id, taskId, startTime, endTime);
  if (existingSession) return existingSession;

  const activity = await insertActivityLogWithJournal(supabase, {
    user_id: user.id,
    task_id: taskId,
    type: sessionType,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: durationInMinutes,
    local_date: date,
    what_done: whatDone ?? null,
    what_think: whatThink ?? null,
  });

  revalidatePath('/execution/daily-sync');
  return activity;
}
