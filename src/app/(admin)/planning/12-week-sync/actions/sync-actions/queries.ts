import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryToggleSyncAction(
  supabase: SupabaseClient,
  syncActionId: string,
  quarterlyReviewId: string,
  isCompleted: boolean
) {
  const { error } = await supabase
    .from('sync_actions')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', syncActionId)
    .eq('quarterly_review_id', quarterlyReviewId);
  if (error) throw error;
}
