import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user-profile';
import type { SoundSettings } from '@/types/sound';

export async function queryUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) {
    if ((error as any).code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function queryExistingProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('sound_settings')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function updateProfileSoundSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: SoundSettings
) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ sound_settings: settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function insertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  settings: SoundSettings
) {
  const { error } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId, sound_settings: settings });
  if (error) throw error;
}
