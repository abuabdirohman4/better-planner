'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Ambil semua visi milik user yang sedang login
export async function getVisions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('visions')
    .select('*')
    .eq('user_id', user.id);
  if (error) return [];
  return data;
}

// Upsert visi untuk user dan area tertentu
export async function upsertVision(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const life_area = formData.get('life_area') as string;
  const vision_3_5_year = formData.get('vision_3_5_year') as string;
  const vision_10_year = formData.get('vision_10_year') as string;
  await supabase
    .from('visions')
    .upsert({
      user_id: user.id,
      life_area,
      vision_3_5_year,
      vision_10_year,
    }, { onConflict: 'user_id,life_area' });
  revalidatePath('/planning/vision');
} 