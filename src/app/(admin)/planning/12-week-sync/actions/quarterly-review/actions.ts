'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { getQuarterDates } from '@/lib/quarterUtils';
import type { TwelveWeekSyncData, QuarterlyReviewSummary, ReflectionField } from '@/types/twelve-week-sync';
import {
  queryInsertReview,
  queryUpdateReview,
  queryCompleteReview,
  queryGetReviewWithRelations,
  queryGetReviewHistory,
} from './queries';
import { buildReviewInsertPayload, buildDefaultSyncActions } from './logic';

export async function getOrCreateQuarterlyReview(
  year: number,
  quarter: number
): Promise<{ success: boolean; data?: TwelveWeekSyncData; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const existing = await queryGetReviewWithRelations(supabase, user.id, year, quarter);
    if (existing) {
      return {
        success: true,
        data: {
          review: existing,
          goalReviews: (existing.goal_reviews ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          accomplishments: (existing.accomplishments ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          syncActions: (existing.sync_actions ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        },
      };
    }

    const { startDate, endDate } = getQuarterDates(year, quarter);
    const payload = buildReviewInsertPayload(
      user.id, year, quarter,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    const newReview = await queryInsertReview(supabase, payload);

    const { data: quests } = await supabase
      .from('quests')
      .select('id, title, label')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .eq('is_committed', true)
      .order('priority_score', { ascending: false })
      .limit(3);

    if (quests && quests.length > 0) {
      const goalReviewPayloads = quests.map((q: any, idx: number) => ({
        quarterly_review_id: newReview.id,
        quest_id: q.id,
        goal_name: q.title,
        sort_order: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('goal_reviews').insert(goalReviewPayloads);
    }

    const syncActionPayloads = buildDefaultSyncActions(newReview.id);
    await supabase.from('sync_actions').insert(syncActionPayloads);

    const fresh = await queryGetReviewWithRelations(supabase, user.id, year, quarter);
    return {
      success: true,
      data: {
        review: fresh,
        goalReviews: (fresh.goal_reviews ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        accomplishments: [],
        syncActions: (fresh.sync_actions ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      },
    };
  } catch (error) {
    const err = handleApiError(error, 'memuat data');
    return { success: false, message: err.message };
  }
}

export async function updateReflection(
  reviewId: string,
  field: ReflectionField,
  value: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryUpdateReview(supabase, reviewId, user.id, { [field]: value });
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menyimpan data');
    return { success: false, message: err.message };
  }
}

export async function completeQuarterlyReview(
  reviewId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryCompleteReview(supabase, reviewId, user.id);
    revalidatePath('/planning/12-week-sync');
    revalidatePath('/planning/12-week-sync/history');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'mengupdate data');
    return { success: false, message: err.message };
  }
}

export async function getQuarterlyReviewHistory(): Promise<{
  success: boolean;
  data?: QuarterlyReviewSummary[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const rows = await queryGetReviewHistory(supabase, user.id);
    const history: QuarterlyReviewSummary[] = (rows as any[]).map((r) => ({
      ...r,
      avg_score: r.avg_score ?? null,
    }));
    return { success: true, data: history };
  } catch (error) {
    const err = handleApiError(error, 'memuat data');
    return { success: false, message: err.message };
  }
}
