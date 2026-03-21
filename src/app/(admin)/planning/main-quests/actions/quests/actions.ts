"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  insertMultipleQuests,
  updateQuestTitleLabel,
  upsertPairwiseResults,
  updateQuestPriorityScore,
  commitTopQuests,
  queryAllQuestsForQuarter,
  queryPairwiseResults,
  queryCommittedQuests,
  queryUncommittedQuests,
  updateMotivation,
} from './queries';
import { buildQuestInsertData, getTop3QuestIds } from './logic';

export async function addMultipleQuests(
  quests: { title: string; label: string }[],
  year: number,
  quarter: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');
  const questData = buildQuestInsertData(quests, user.id, year, quarter);
  const data = await insertMultipleQuests(supabase, questData);
  return { quests: data, message: '10 Kandidat Quest berhasil disimpan!' };
}

export async function updateQuests(
  quests: { id: string; title: string; label: string }[]
) {
  const supabase = await createClient();
  for (const quest of quests) {
    await updateQuestTitleLabel(supabase, quest.id, quest.title, quest.label);
  }
  revalidatePath('/planning/12-week-quests');
  return { message: 'Perubahan quest berhasil disimpan!' };
}

export async function finalizeQuests(
  pairwiseResults: Record<string, string>,
  quests: { id: string; title: string; priority_score: number }[],
  year: number,
  quarter: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');
  await upsertPairwiseResults(supabase, user.id, year, quarter, pairwiseResults);
  for (const quest of quests) {
    await updateQuestPriorityScore(supabase, quest.id, quest.priority_score);
  }
  const top3 = getTop3QuestIds(quests);
  if (top3.length > 0) {
    await commitTopQuests(supabase, top3);
  }
  revalidatePath('/planning/12-week-quests');
  revalidatePath('/planning/main-quests');
  return { message: 'Prioritas berhasil ditentukan!', url: '/planning/main-quests' };
}

export async function getAllQuestsForQuarter(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return queryAllQuestsForQuarter(supabase, user.id, year, quarter);
}

export async function getPairwiseResults(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return queryPairwiseResults(supabase, user.id, year, quarter);
}

export async function getQuests(year: number, quarter: number, isCommitted: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return queryCommittedQuests(supabase, user.id, year, quarter, isCommitted, 3);
}

export async function getUncommittedQuests(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return queryUncommittedQuests(supabase, user.id, year, quarter);
}

export async function updateQuestMotivation(questId: string, motivation: string) {
  const supabase = await createClient();
  await updateMotivation(supabase, questId, motivation);
  revalidatePath('/planning/main-quests');
  revalidatePath('/planning/12-week-quests');
  return { message: 'Motivation berhasil diupdate!' };
}
