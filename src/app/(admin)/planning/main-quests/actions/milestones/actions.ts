"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryQuestById,
  queryMilestonesByQuestId,
  queryLastMilestoneOrder,
  insertMilestone,
  updateMilestoneTitle,
  updateMilestoneStatusField,
  deleteMilestoneById,
  updateMilestoneOrder,
} from './queries';
import { parseMilestoneFormData, calculateMilestoneOrder } from './logic';

export async function getMilestonesForQuest(questId: string) {
  const supabase = await createClient();
  const quest = await queryQuestById(supabase, questId);
  if (!quest) return [];
  return queryMilestonesByQuestId(supabase, questId);
}

export async function addMilestone(formData: FormData) {
  const supabase = await createClient();
  const { quest_id, title, display_order } = parseMilestoneFormData(formData);
  const quest = await queryQuestById(supabase, quest_id);
  if (!quest) throw new Error('Quest tidak ditemukan');
  const lastOrder = await queryLastMilestoneOrder(supabase, quest_id);
  const order = calculateMilestoneOrder(display_order, lastOrder);
  const milestone = await insertMilestone(supabase, {
    quest_id,
    title,
    display_order: order,
    status: 'TODO',
  });
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil ditambahkan!', milestone };
}

export async function updateMilestone(milestoneId: string, title: string) {
  const supabase = await createClient();
  await updateMilestoneTitle(supabase, milestoneId, title);
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil diupdate!' };
}

export async function updateMilestoneStatus(milestoneId: string, newStatus: 'TODO' | 'DONE') {
  const supabase = await createClient();
  await updateMilestoneStatusField(supabase, milestoneId, newStatus);
  revalidatePath('/planning/main-quests');
  return { message: 'Status milestone berhasil diupdate!' };
}

export async function deleteMilestone(milestoneId: string) {
  const supabase = await createClient();
  await deleteMilestoneById(supabase, milestoneId);
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil dihapus!' };
}

export async function updateMilestoneDisplayOrder(milestoneId: string, display_order: number) {
  const supabase = await createClient();
  await updateMilestoneOrder(supabase, milestoneId, display_order);
  revalidatePath('/planning/main-quests');
  return { message: 'Urutan milestone berhasil diupdate!' };
}

export async function updateMilestonesDisplayOrder(
  milestones: { id: string; display_order: number }[]
) {
  const supabase = await createClient();
  for (const milestone of milestones) {
    await updateMilestoneOrder(supabase, milestone.id, milestone.display_order);
  }
  revalidatePath('/planning/main-quests');
  return { success: true, message: 'Urutan milestone berhasil diupdate!' };
}
