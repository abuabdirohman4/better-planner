"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tambah 10 quest sekaligus
export async function addMultipleQuests(quests: string[], year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');
  // Buat array data quest
  const questData = quests.map(title => ({
    user_id: user.id,
    title,
    year,
    quarter,
    is_committed: false,
    type: 'PERSONAL',
  }));
  const { data, error } = await supabase
    .from('quests')
    .insert(questData)
    .select('id, title');
  if (error) throw new Error('Gagal menyimpan quest: ' + (error.message || ''));
  return { quests: data, message: '10 Kandidat Quest berhasil disimpan!' };
}

// Commit 3 quest teratas
export async function commitTopQuests(questIds: string[]) {
  const supabase = await createClient();
  // Update is_committed untuk quest terpilih
  const { error } = await supabase
    .from('quests')
    .update({ is_committed: true })
    .in('id', questIds);
  if (error) throw new Error('Gagal meng-commit quest: ' + (error.message || ''));
  revalidatePath('/planning/12-week-quests');
  revalidatePath('/planning/main-quests');
  redirect('/planning/main-quests');
  // (redirect akan menghentikan eksekusi, tapi return pesan untuk konsistensi)
  return { message: 'Selamat! 3 Main Quest telah ditetapkan.' };
}

// Ambil quest yang belum committed untuk user, year, quarter
export async function getUncommittedQuests(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('quests')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', false);
  if (error) return [];
  return data;
}

// Update judul quest berdasarkan id
export async function updateQuests(quests: { id: string, title: string }[]) {
  const supabase = await createClient();
  for (const quest of quests) {
    const { error } = await supabase
      .from('quests')
      .update({ title: quest.title })
      .eq('id', quest.id);
    if (error) throw new Error('Gagal update quest: ' + (error.message || ''));
  }
  return { message: 'Perubahan quest berhasil disimpan!' };
} 