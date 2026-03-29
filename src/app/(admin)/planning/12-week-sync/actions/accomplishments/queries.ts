import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryInsertAccomplishment(
  supabase: SupabaseClient,
  quarterlyReviewId: string,
  description: string,
  sortOrder: number
) {
  const { data, error } = await supabase
    .from('accomplishments')
    .insert({
      quarterly_review_id: quarterlyReviewId,
      description,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function queryDeleteAccomplishment(
  supabase: SupabaseClient,
  accomplishmentId: string,
  quarterlyReviewId: string
) {
  const { error } = await supabase
    .from('accomplishments')
    .delete()
    .eq('id', accomplishmentId)
    .eq('quarterly_review_id', quarterlyReviewId);
  if (error) throw error;
}
