"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import type { PlanningQuest as Quest, RankedQuest } from '@/types/planning-quest';
import {
  updateExistingQuest,
  insertNewQuests,
  deleteEmptyQuests,
  updateQuestWithScore,
  upsertPairwiseResults,
  queryQuestsForQuarter,
  queryPairwiseResults,
} from './queries';
import {
  separateQuestsByState,
  buildQuestInsertPayload,
  getTop3Quests,
  buildFinalizeResult,
} from './logic';

export async function saveQuests(
  quests: Quest[],
  year: number,
  quarter: number
): Promise<{ success: boolean; message: string; insertedQuests?: any[] }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { questsWithId, newQuests, emptyQuests } = separateQuestsByState(quests);

    for (const quest of questsWithId) {
      await updateExistingQuest(supabase, quest.id!, user.id, {
        title: quest.title,
        type: quest.type || 'PERSONAL',
        source_quest_id: quest.source_quest_id || null,
        is_continuation: quest.is_continuation || false,
        continuation_strategy: quest.continuation_strategy || null,
        continuation_date: quest.continuation_date || null,
        updated_at: new Date().toISOString(),
      });
    }

    let insertedQuests: any[] = [];
    if (newQuests.length > 0) {
      const questsToInsert = newQuests.map(q => buildQuestInsertPayload(q, user.id, year, quarter));
      insertedQuests = await insertNewQuests(supabase, questsToInsert);
    }

    if (emptyQuests.length > 0) {
      const emptyQuestIds = emptyQuests.map(q => q.id).filter(Boolean) as string[];
      if (emptyQuestIds.length > 0) {
        await deleteEmptyQuests(supabase, emptyQuestIds, user.id);
      }
    }

    revalidatePath('/planning/12-week-quests');
    return { success: true, message: 'Quest berhasil disimpan!', insertedQuests };
  } catch (error) {
    const errorInfo = handleApiError(error, 'menyimpan data');
    return { success: false, message: errorInfo.message || 'Gagal menyimpan quest' };
  }
}

export async function finalizeQuests(
  pairwiseResults: { [key: string]: string },
  questsWithScore: { id: string; title: string; priority_score: number }[],
  year: number,
  quarter: number
): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const top3Quests = getTop3Quests(questsWithScore);

    for (const quest of questsWithScore) {
      const isTop3 = top3Quests.some(top => top.id === quest.id);
      await updateQuestWithScore(supabase, quest.id, user.id, quest.priority_score, isTop3);
    }

    await upsertPairwiseResults(supabase, user.id, year, quarter, pairwiseResults);

    revalidatePath('/planning/12-week-quests');
    revalidatePath('/planning/main-quests');

    return buildFinalizeResult(top3Quests);
  } catch (error) {
    const errorInfo = handleApiError(error, 'mengupdate data');
    return { success: false, message: errorInfo.message || 'Gagal commit main quest' };
  }
}

export async function getAllQuestsForQuarter(
  year: number,
  quarter: number
): Promise<{ id?: string; title: string; label?: string }[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return queryQuestsForQuarter(supabase, user.id, year, quarter);
  } catch (error) {
    handleApiError(error, 'memuat data');
    return [];
  }
}

export async function getPairwiseResults(
  year: number,
  quarter: number
): Promise<{ [key: string]: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return queryPairwiseResults(supabase, user.id, year, quarter);
  } catch (error) {
    handleApiError(error, 'memuat data');
    return {};
  }
}
