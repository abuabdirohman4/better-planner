'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryUpsertGoalReview } from './queries';

export async function upsertGoalReview(
  goalReviewId: string,
  quarterlyReviewId: string,
  score: number | null,
  notes: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryUpsertGoalReview(supabase, goalReviewId, quarterlyReviewId, score, notes);
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menyimpan goal review');
    return { success: false, message: err.message };
  }
}
