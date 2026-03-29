import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryGetOrCreateReview(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function queryInsertReview(
  supabase: SupabaseClient,
  payload: {
    user_id: string;
    year: number;
    quarter: number;
    start_date: string;
    end_date: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
  }
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function queryUpdateReview(
  supabase: SupabaseClient,
  reviewId: string,
  userId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase
    .from('quarterly_reviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function queryCompleteReview(
  supabase: SupabaseClient,
  reviewId: string,
  userId: string
) {
  const { error } = await supabase
    .from('quarterly_reviews')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function queryGetReviewWithRelations(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .select(`
      *,
      goal_reviews(*),
      accomplishments(*),
      sync_actions(*)
    `)
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function queryGetReviewHistory(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .select('id, year, quarter, start_date, end_date, is_completed, completed_at')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('quarter', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
