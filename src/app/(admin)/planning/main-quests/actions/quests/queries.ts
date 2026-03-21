import type { SupabaseClient } from '@supabase/supabase-js';

export async function insertMultipleQuests(
  supabase: SupabaseClient,
  questData: { user_id: string; title: string; label: string; year: number; quarter: number; is_committed: boolean; type: string }[]
) {
  const { data, error } = await supabase
    .from('quests')
    .insert(questData)
    .select('id, title, label');
  if (error) throw error;
  return data;
}

export async function updateQuestTitleLabel(
  supabase: SupabaseClient,
  questId: string,
  title: string,
  label: string
) {
  const { error } = await supabase
    .from('quests')
    .update({ title, label })
    .eq('id', questId);
  if (error) throw error;
}

export async function upsertPairwiseResults(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  results: Record<string, string>
) {
  const { error } = await supabase
    .from('pairwise_results')
    .upsert(
      [{ user_id: userId, year, quarter, results_json: results, is_finalized: true }],
      { onConflict: 'user_id,year,quarter' }
    );
  if (error) throw error;
}

export async function updateQuestPriorityScore(
  supabase: SupabaseClient,
  questId: string,
  score: number
) {
  const { error } = await supabase
    .from('quests')
    .update({ priority_score: score })
    .eq('id', questId);
  if (error) throw error;
}

export async function commitTopQuests(
  supabase: SupabaseClient,
  questIds: string[]
) {
  const { error } = await supabase
    .from('quests')
    .update({ is_committed: true })
    .in('id', questIds);
  if (error) throw error;
}

export async function queryAllQuestsForQuarter(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, label, is_committed, priority_score')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .order('label', { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function queryPairwiseResults(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('pairwise_results')
    .select('results_json')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .single();
  if (error || !data) return null;
  return data.results_json;
}

export async function queryCommittedQuests(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  isCommitted: boolean,
  limitCount: number
) {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, motivation, priority_score, is_committed')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', isCommitted)
    .order('priority_score', { ascending: false })
    .limit(limitCount);
  if (error) return [];
  return data ?? [];
}

export async function queryUncommittedQuests(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', false);
  if (error) return [];
  return data ?? [];
}

export async function updateMotivation(
  supabase: SupabaseClient,
  questId: string,
  motivation: string
) {
  const { error } = await supabase
    .from('quests')
    .update({ motivation })
    .eq('id', questId);
  if (error) throw error;
}
