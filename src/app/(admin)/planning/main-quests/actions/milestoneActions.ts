"use server";

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

// Ambil semua milestones untuk quest tertentu
export async function getMilestonesForQuest(questId: string) {
  const supabase = await createClient();
  
  // First check if quest exists
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('id, title')
    .eq('id', questId)
    .single();
  
  if (questError) {
    console.error('❌ Quest not found:', questError);
    return [];
  }
  
  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, display_order')
    .eq('quest_id', questId)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching milestones:', error);
    return [];
  }
  
  return data;
}

// Tambah milestone baru ke quest
export async function addMilestone(formData: FormData) {
  const supabase = await createClient();
  const quest_id = formData.get('quest_id');
  const title = formData.get('title');
  const display_order = formData.get('display_order');
  
  if (!quest_id || !title) throw new Error('quest_id dan title wajib diisi');
  
  // Gunakan display_order yang dikirim dari frontend, atau hitung otomatis jika tidak ada
  let order = 1;
  if (display_order) {
    order = parseInt(display_order.toString());
  } else {
    // Fallback: hitung display_order terakhir
    const { data: last } = await supabase
      .from('milestones')
      .select('display_order')
      .eq('quest_id', quest_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    order = last && last.display_order ? last.display_order + 1 : 1;
  }
  
  const { error } = await supabase
    .from('milestones')
    .insert({ quest_id, title, display_order: order });
  if (error) throw new Error('Gagal menambah milestone: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil ditambahkan!' };
}

// Edit milestone
export async function updateMilestone(milestoneId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('milestones')
    .update({ title })
    .eq('id', milestoneId);
  if (error) throw new Error('Gagal update milestone: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil diupdate!' };
}

// Hapus milestone
export async function deleteMilestone(milestoneId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId);
  if (error) throw new Error('Gagal hapus milestone: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil dihapus!' };
}
