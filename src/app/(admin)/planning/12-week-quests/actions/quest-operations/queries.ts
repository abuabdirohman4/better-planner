import type { SupabaseClient } from '@supabase/supabase-js';

export async function updateExistingQuest(
  supabase: SupabaseClient,
  questId: string,
  userId: string,
  data: {
    title: string;
    type?: string;
    source_quest_id?: string | null;
    is_continuation?: boolean;
    continuation_strategy?: string | null;
    continuation_date?: string | null;
    updated_at: string;
  }
) {
  const { error } = await supabase
    .from('quests')
    .update(data)
    .eq('id', questId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function insertNewQuests(
  supabase: SupabaseClient,
  questsData: {
    title: string;
    label?: string;
    type: string;
    year: number;
    quarter: number;
    user_id: string;
    source_quest_id?: string | null;
    is_continuation?: boolean;
    continuation_strategy?: string | null;
    continuation_date?: string | null;
    created_at: string;
    updated_at: string;
  }[]
) {
  const { data, error } = await supabase
    .from('quests')
    .insert(questsData)
    .select('id, title, label');
  if (error) throw error;
  return data ?? [];
}

export async function deleteEmptyQuests(
  supabase: SupabaseClient,
  questIds: string[],
  userId: string
) {
  const { error } = await supabase
    .from('quests')
    .delete()
    .in('id', questIds)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateQuestWithScore(
  supabase: SupabaseClient,
  questId: string,
  userId: string,
  score: number,
  isCommitted: boolean
) {
  const { error } = await supabase
    .from('quests')
    .update({
      priority_score: score,
      type: 'PERSONAL',
      is_committed: isCommitted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', questId)
    .eq('user_id', userId);
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
      {
        user_id: userId,
        year,
        quarter,
        results_json: results,
        is_finalized: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,year,quarter' }
    );
  if (error) throw error;
}

export async function queryQuestsForQuarter(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, label')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .order('created_at', { ascending: true });
  if (error) throw error;
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
  if (error) {
    if ((error as any).code === 'PGRST116') return {};
    throw error;
  }
  return data?.results_json ?? {};
}
