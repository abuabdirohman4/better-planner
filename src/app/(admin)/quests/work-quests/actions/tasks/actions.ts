"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkQuestTask, WorkQuestTaskFormData } from "@/types/work-quest";
import {
  insertTask,
  updateTaskTitle,
  updateTaskStatus,
  deleteTaskById,
  queryTimerSessionIdsByTaskId,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskId,
  deleteActivityLogsByTaskId,
  deleteDailyPlanItemsByTaskId,
} from "./queries";
import { toWorkQuestTask } from "./logic";

const REVALIDATE_PATHS = ['/work-quests', '/execution/daily-sync'] as const;
function revalidateAll() { REVALIDATE_PATHS.forEach(p => revalidatePath(p)); }

export async function createWorkQuestTask(projectId: string, formData: WorkQuestTaskFormData): Promise<WorkQuestTask> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = await insertTask(supabase, user.id, projectId, formData.title);
  revalidateAll();
  return toWorkQuestTask(row);
}

export async function updateWorkQuestTask(taskId: string, formData: WorkQuestTaskFormData): Promise<WorkQuestTask> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = await updateTaskTitle(supabase, user.id, taskId, formData.title);
  revalidateAll();
  return toWorkQuestTask(row);
}

export async function toggleWorkQuestTaskStatus(taskId: string, status: 'TODO' | 'DONE'): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateTaskStatus(supabase, user.id, taskId, status);
  revalidateAll();
}

export async function deleteWorkQuestTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const sessionIds = await queryTimerSessionIdsByTaskId(supabase, user.id, taskId);
  await deleteTimerEventsBySessionIds(supabase, sessionIds);
  await deleteTimerSessionsByTaskId(supabase, user.id, taskId);
  await deleteActivityLogsByTaskId(supabase, user.id, taskId);
  await deleteDailyPlanItemsByTaskId(supabase, taskId);
  await deleteTaskById(supabase, user.id, taskId);

  revalidateAll();
}
