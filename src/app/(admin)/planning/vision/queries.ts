import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryVisionsByUserId(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('visions')
    .select('*')
    .eq('user_id', userId);
  if (error) return [];
  return data ?? [];
}

export async function upsertVisionForArea(
  supabase: SupabaseClient,
  userId: string,
  area: string,
  vision3_5Year: string,
  vision10Year: string
) {
  const { error } = await supabase
    .from('visions')
    .upsert(
      {
        user_id: userId,
        life_area: area,
        vision_3_5_year: vision3_5Year,
        vision_10_year: vision10Year,
      },
      { onConflict: 'user_id,life_area' }
    );
  if (error) throw error;
}
