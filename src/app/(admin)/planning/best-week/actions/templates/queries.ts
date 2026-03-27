import type { SupabaseClient } from '@supabase/supabase-js';
import type { BestWeekTemplate } from '@/lib/best-week/types';

export async function queryActiveTemplate(
  supabase: SupabaseClient,
  userId: string
): Promise<BestWeekTemplate | null> {
  const { data, error } = await supabase
    .from('best_week_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data;
}

export async function queryAllTemplates(
  supabase: SupabaseClient,
  userId: string
): Promise<BestWeekTemplate[]> {
  const { data, error } = await supabase
    .from('best_week_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function insertTemplate(
  supabase: SupabaseClient,
  data: { user_id: string; name: string; is_active: boolean }
): Promise<BestWeekTemplate> {
  const { data: result, error } = await supabase
    .from('best_week_templates')
    .insert(data)
    .select('*')
    .single();
  if (error) throw new Error('Gagal membuat template');
  return result;
}

export async function updateTemplateActiveStatus(
  supabase: SupabaseClient,
  userId: string,
  templateId: string
): Promise<void> {
  // Deactivate all
  await supabase
    .from('best_week_templates')
    .update({ is_active: false })
    .eq('user_id', userId);
  // Activate target
  const { error } = await supabase
    .from('best_week_templates')
    .update({ is_active: true })
    .eq('id', templateId)
    .eq('user_id', userId);
  if (error) throw new Error('Gagal mengaktifkan template');
}

export async function updateTemplateName(
  supabase: SupabaseClient,
  templateId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('best_week_templates')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', templateId);
  if (error) throw new Error('Gagal mengupdate nama template');
}

export async function deleteTemplateById(
  supabase: SupabaseClient,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from('best_week_templates')
    .delete()
    .eq('id', templateId);
  if (error) throw new Error('Gagal menghapus template');
}
