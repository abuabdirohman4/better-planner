"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getQuarterDates } from "@/lib/quarterUtils";
import type { SideQuest } from "../../types";
import {
  querySideQuests,
  updateSideQuestStatusField,
  updateSideQuestFields,
  queryTimerSessionsByTask,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTask,
  deleteActivityLogsByTask,
  deleteDailyPlanItemsByTask,
  deleteSideQuestTask,
} from "./queries";
import { buildSideQuestUpdateData } from "./logic";

export async function getSideQuests(year: number, quarter: number): Promise<SideQuest[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { startDate, endDate } = getQuarterDates(year, quarter);
    return querySideQuests(supabase, user.id, startDate, endDate);
  } catch (error) {
    console.error("Error fetching side quests:", error);
    return [];
  }
}

export async function updateSideQuestStatus(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "DONE"
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  await updateSideQuestStatusField(supabase, taskId, user.id, status);
  revalidatePath("/quests/side-quests");
}

export async function updateSideQuest(
  taskId: string,
  updates: { title?: string; description?: string }
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  const updateData = buildSideQuestUpdateData(updates);
  await updateSideQuestFields(supabase, taskId, user.id, updateData);
  revalidatePath("/quests/side-quests");
}

export async function deleteSideQuest(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const sessions = await queryTimerSessionsByTask(supabase, taskId, user.id);
  if (sessions.length > 0) {
    const sessionIds = sessions.map((s: { id: string }) => s.id);
    await deleteTimerEventsBySessionIds(supabase, sessionIds);
  }
  await deleteTimerSessionsByTask(supabase, taskId, user.id);
  await deleteActivityLogsByTask(supabase, taskId, user.id);
  await deleteDailyPlanItemsByTask(supabase, taskId);
  await deleteSideQuestTask(supabase, taskId, user.id);
  revalidatePath("/quests/side-quests");
}
