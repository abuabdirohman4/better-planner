"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getQuarterDates } from "@/lib/quarterUtils";
import { WorkQuestProject, WorkQuestProjectFormData, WorkQuestFormData, WorkQuest } from "../../types";
import {
  queryProjectsByQuarter,
  queryTasksByProjectIds,
  queryProjectById,
  queryTasksByProjectId,
  insertProject,
  updateProjectTitle,
  updateProjectStatus,
  deleteProjectById,
  deleteTasksByProjectId,
  queryTimerSessionIdsByTaskIds,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskIds,
  deleteActivityLogsByTaskIds,
  deleteDailyPlanItemsByTaskIds,
  WorkQuestStatus,
} from "./queries";
import { assembleProjects, toWorkQuestProject, collectAllTaskIds } from "./logic";

const REVALIDATE_PATHS = ['/work-quests', '/execution/daily-sync'] as const;

function revalidateAll() {
  REVALIDATE_PATHS.forEach(p => revalidatePath(p));
}

// ---- READ ----

export async function getWorkQuestProjects(year: number, quarter: number): Promise<WorkQuestProject[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { startDate, endDate } = getQuarterDates(year, quarter);

    // Batch queries — no N+1
    const projectRows = await queryProjectsByQuarter(supabase, user.id, startDate, endDate);
    if (projectRows.length === 0) return [];

    const projectIds = projectRows.map(p => p.id);
    const taskRows = await queryTasksByProjectIds(supabase, projectIds);

    return assembleProjects(projectRows, taskRows);
  } catch (error) {
    console.error(error, 'memuat work quest projects');
    return [];
  }
}

// Legacy alias
export async function getWorkQuests(year: number, quarter: number): Promise<WorkQuest[]> {
  return getWorkQuestProjects(year, quarter);
}

export async function getWorkQuestProjectById(id: string): Promise<WorkQuestProject | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const projectRow = await queryProjectById(supabase, user.id, id);
    if (!projectRow) return null;

    const taskRows = await queryTasksByProjectId(supabase, id);
    return toWorkQuestProject(projectRow, taskRows);
  } catch (error) {
    console.error(error, 'memuat work quest project by id');
    return null;
  }
}

// Legacy alias
export async function getWorkQuestById(id: string): Promise<WorkQuest | null> {
  return getWorkQuestProjectById(id);
}

// ---- CREATE ----

export async function createWorkQuestProject(formData: WorkQuestProjectFormData): Promise<WorkQuestProject> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const projectRow = await insertProject(supabase, user.id, formData.title);
  revalidateAll();

  const created = await getWorkQuestProjectById(projectRow.id);
  if (!created) throw new Error('Failed to retrieve created project');
  return created;
}

// Legacy alias
export async function createWorkQuest(formData: WorkQuestFormData): Promise<WorkQuest> {
  return createWorkQuestProject({ title: formData.title });
}

// ---- UPDATE ----

export async function updateWorkQuestProject(id: string, formData: WorkQuestProjectFormData): Promise<WorkQuestProject> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateProjectTitle(supabase, user.id, id, formData.title);
  revalidateAll();

  const updated = await getWorkQuestProjectById(id);
  if (!updated) throw new Error('Failed to retrieve updated project');
  return updated;
}

// Legacy alias
export async function updateWorkQuest(id: string, formData: WorkQuestFormData): Promise<WorkQuest> {
  return updateWorkQuestProject(id, { title: formData.title });
}

export async function toggleWorkQuestProjectStatus(projectId: string, status: 'TODO' | 'DONE'): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateProjectStatus(supabase, user.id, projectId, status as WorkQuestStatus);
  revalidateAll();
}

// ---- DELETE ----

export async function deleteWorkQuestProject(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Collect all IDs for cascade cleanup
  const { data: taskRows } = await supabase.from('tasks').select('id').eq('parent_task_id', id).eq('user_id', user.id);
  const taskIds = (taskRows || []).map((t: { id: string }) => t.id);
  const allIds = collectAllTaskIds(id, taskIds);

  // Cascade cleanup order: timer_events → timer_sessions → activity_logs → daily_plan_items → tasks → project
  const sessionIds = await queryTimerSessionIdsByTaskIds(supabase, user.id, allIds);
  await deleteTimerEventsBySessionIds(supabase, sessionIds);
  await deleteTimerSessionsByTaskIds(supabase, user.id, allIds);
  await deleteActivityLogsByTaskIds(supabase, user.id, allIds);
  await deleteDailyPlanItemsByTaskIds(supabase, allIds);
  await deleteTasksByProjectId(supabase, user.id, id);
  await deleteProjectById(supabase, user.id, id);

  revalidateAll();
}

// Legacy alias
export async function deleteWorkQuest(id: string): Promise<void> {
  return deleteWorkQuestProject(id);
}
