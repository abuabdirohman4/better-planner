"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  checkDuplicateActivityLog,
  insertActivityLog,
  queryActivityLogs,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
} from './queries';
import {
  parseActivityFormData,
  calculateDurationMinutes,
  enrichLogsWithHierarchy,
} from './logic';

export async function logActivity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { taskId, sessionType, date, startTime, endTime, whatDone, whatThink } =
    parseActivityFormData(formData);

  const durationInMinutes = calculateDurationMinutes(startTime, endTime);

  const existingSession = await checkDuplicateActivityLog(
    supabase,
    user.id,
    taskId,
    startTime,
    endTime,
  );
  if (existingSession) return existingSession;

  const activity = await insertActivityLog(supabase, {
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

export async function getTodayActivityLogs(date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const logs = await queryActivityLogs(supabase, user.id, date);
  if (logs.length === 0) return [];

  const taskIds = [...new Set(logs.map((log) => log.task_id).filter(Boolean))] as string[];
  if (taskIds.length === 0) {
    return enrichLogsWithHierarchy(logs, [], [], []);
  }

  const allTasks = await queryTasksByIds(supabase, taskIds);
  const milestoneIds = [
    ...new Set(allTasks.map((t) => t.milestone_id).filter(Boolean)),
  ] as string[];
  const allMilestones = await queryMilestonesByIds(supabase, milestoneIds);
  const questIds = [
    ...new Set(allMilestones.map((m) => m.quest_id).filter(Boolean)),
  ] as string[];
  const allQuests = await queryQuestsByIds(supabase, questIds);

  return enrichLogsWithHierarchy(logs, allTasks, allMilestones, allQuests);
}
