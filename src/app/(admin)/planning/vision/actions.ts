'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { LIFE_AREAS } from './constants';
import { queryVisionsByUserId, upsertVisionForArea } from './queries';
import { parseVisionFormData } from './logic';

// Ambil semua visi milik user yang sedang login
export async function getVisions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return queryVisionsByUserId(supabase, user.id);
}

// Upsert visi untuk semua area kehidupan sekaligus
export async function upsertVision(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const entries = parseVisionFormData(formData, LIFE_AREAS);
  for (const entry of entries) {
    await upsertVisionForArea(supabase, user.id, entry.area, entry.vision_3_5_year, entry.vision_10_year);
  }
  revalidatePath('/planning/vision');
}
