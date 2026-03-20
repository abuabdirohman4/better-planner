"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { handleApiError } from '@/lib/errorUtils';
import type { SoundSettings, UserProfile } from './types';
import {
  queryUserProfile,
  queryExistingProfile,
  updateProfileSoundSettings,
  insertUserProfile,
} from './queries';
import { DEFAULT_SOUND_SETTINGS, mergeSoundSettings } from './logic';

export type { SoundSettings, UserProfile };

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return queryUserProfile(supabase, user.id);
  } catch (error) {
    handleApiError(error, 'memuat profil user');
    return null;
  }
}

export async function updateSoundSettings(settings: Partial<SoundSettings>): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const existingProfile = await queryExistingProfile(supabase, user.id);
  const currentSoundSettings = existingProfile?.sound_settings || DEFAULT_SOUND_SETTINGS;
  const updatedSoundSettings = mergeSoundSettings(currentSoundSettings, settings);

  if (existingProfile) {
    await updateProfileSoundSettings(supabase, user.id, updatedSoundSettings);
  } else {
    await insertUserProfile(supabase, user.id, updatedSoundSettings);
  }

  revalidatePath('/dashboard');
  revalidatePath('/execution');
}

export async function getSoundSettings(): Promise<SoundSettings> {
  try {
    const profile = await getUserProfile();
    return profile?.sound_settings || DEFAULT_SOUND_SETTINGS;
  } catch (error) {
    handleApiError(error, 'memuat pengaturan suara');
    return DEFAULT_SOUND_SETTINGS;
  }
}

export async function resetSoundSettings(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const existingProfile = await queryExistingProfile(supabase, user.id);

  if (existingProfile) {
    await updateProfileSoundSettings(supabase, user.id, DEFAULT_SOUND_SETTINGS);
  } else {
    await insertUserProfile(supabase, user.id, DEFAULT_SOUND_SETTINGS);
  }

  revalidatePath('/dashboard');
  revalidatePath('/execution');
}
