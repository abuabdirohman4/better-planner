import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryQuestById(supabase: SupabaseClient, questId: string) {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title')
    .eq('id', questId)
    .single();
  if (error) return null;
  return data;
}

export async function queryMilestonesByQuestId(supabase: SupabaseClient, questId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, display_order, status')
    .eq('quest_id', questId)
    .order('display_order', { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function queryLastMilestoneOrder(supabase: SupabaseClient, questId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('display_order')
    .eq('quest_id', questId)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();
  if (error) return undefined;
  return data?.display_order;
}

export async function insertMilestone(
  supabase: SupabaseClient,
  data: { quest_id: string; title: string; display_order: number; status: string }
) {
  const { data: result, error } = await supabase
    .from('milestones')
    .insert(data)
    .select('id, title, display_order, status')
    .single();
  if (error) throw new Error('Gagal menambah milestone');
  return result;
}

export async function updateMilestoneTitle(
  supabase: SupabaseClient,
  milestoneId: string,
  title: string
) {
  const { error } = await supabase
    .from('milestones')
    .update({ title })
    .eq('id', milestoneId);
  if (error) throw new Error('Gagal update milestone');
}

export async function updateMilestoneStatusField(
  supabase: SupabaseClient,
  milestoneId: string,
  status: 'TODO' | 'DONE'
) {
  const { error } = await supabase
    .from('milestones')
    .update({ status })
    .eq('id', milestoneId);
  if (error) throw new Error('Gagal update status milestone');
}

export async function deleteMilestoneById(supabase: SupabaseClient, milestoneId: string) {
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId);
  if (error) throw new Error('Gagal hapus milestone');
}

export async function updateMilestoneOrder(
  supabase: SupabaseClient,
  milestoneId: string,
  order: number
) {
  const { error } = await supabase
    .from('milestones')
    .update({ display_order: order })
    .eq('id', milestoneId);
  if (error) throw new Error('Gagal update urutan milestone');
}
