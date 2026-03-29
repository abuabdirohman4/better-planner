import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryUpsertGoalReview(
  supabase: SupabaseClient,
  goalReviewId: string,
  quarterlyReviewId: string,
  score: number | null,
  notes: string | null
) {
  const { error } = await supabase
    .from('goal_reviews')
    .update({
      progress_score: score,
      achievement_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalReviewId)
    .eq('quarterly_review_id', quarterlyReviewId);
  if (error) throw error;
}
