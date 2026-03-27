import type { SupabaseClient } from '@supabase/supabase-js';
import type { BestWeekBlock } from '@/lib/best-week/types';

export async function queryBlocksByTemplateId(
  supabase: SupabaseClient,
  templateId: string
): Promise<BestWeekBlock[]> {
  const { data, error } = await supabase
    .from('best_week_blocks')
    .select('*')
    .eq('template_id', templateId)
    .order('start_time', { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function insertBlock(
  supabase: SupabaseClient,
  data: Omit<BestWeekBlock, 'id' | 'created_at' | 'updated_at'>
): Promise<BestWeekBlock> {
  const { data: result, error } = await supabase
    .from('best_week_blocks')
    .insert(data)
    .select('*')
    .single();
  if (error) throw new Error('Gagal menambah block');
  return result;
}

export async function updateBlockById(
  supabase: SupabaseClient,
  blockId: string,
  data: Partial<Omit<BestWeekBlock, 'id' | 'template_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('best_week_blocks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', blockId);
  if (error) throw new Error('Gagal mengupdate block');
}

export async function deleteBlockById(
  supabase: SupabaseClient,
  blockId: string
): Promise<void> {
  const { error } = await supabase
    .from('best_week_blocks')
    .delete()
    .eq('id', blockId);
  if (error) throw new Error('Gagal menghapus block');
}
