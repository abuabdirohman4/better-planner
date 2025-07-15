"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

// Tambah 10 quest sekaligus
export async function addMultipleQuests(quests: { title: string, label: string }[], year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');
  // Buat array data quest
  const questData = quests.map(q => ({
    user_id: user.id,
    title: q.title,
    label: q.label,
    year,
    quarter,
    is_committed: false,
    type: 'PERSONAL',
  }));
  const { data, error } = await supabase
    .from('quests')
    .insert(questData)
    .select('id, title, label');
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
export async function updateQuests(quests: { id: string, title: string, label: string }[]) {
  const supabase = await createClient();
  for (const quest of quests) {
    const { error } = await supabase
      .from('quests')
      .update({ title: quest.title, label: quest.label })
      .eq('id', quest.id);
    if (error) throw new Error('Gagal update quest: ' + (error.message || ''));
  }
  return { message: 'Perubahan quest berhasil disimpan!' };
}

// Finalize 12 Week Quests: simpan pairwise, update skor, commit 3 teratas
export async function finalizeQuests(
  pairwiseResults: Record<string, string>,
  quests: { id: string; title: string; priority_score: number }[],
  year: number,
  quarter: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  // 1. Upsert pairwise_results
  const { error: upsertError } = await supabase
    .from('pairwise_results')
    .upsert([
      {
        user_id: user.id,
        year,
        quarter,
        results_json: pairwiseResults,
        is_finalized: true,
      },
    ], { onConflict: 'user_id,year,quarter' });
  if (upsertError) throw new Error('Gagal menyimpan pairwise results: ' + (upsertError.message || ''));

  // 2. Update priority_score untuk semua quest
  for (const quest of quests) {
    const { error: updateError } = await supabase
      .from('quests')
      .update({ priority_score: quest.priority_score })
      .eq('id', quest.id);
    if (updateError) throw new Error('Gagal update skor quest: ' + (updateError.message || ''));
  }

  // 3. Commit 3 quest teratas
  const top3 = [...quests]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3)
    .map(q => q.id);
  if (top3.length > 0) {
    const { error: commitError } = await supabase
      .from('quests')
      .update({ is_committed: true })
      .in('id', top3);
    if (commitError) throw new Error('Gagal commit main quest: ' + (commitError.message || ''));
  }

  revalidatePath('/planning/12-week-quests');
  revalidatePath('/planning/main-quests');
  // redirect('/planning/main-quests');
  return { message: 'Prioritas berhasil ditentukan dan 3 Main Quest telah ditetapkan!', url: '/planning/main-quests' };
}

// Ambil SEMUA quest (committed & uncommitted) untuk user, year, quarter
export async function getAllQuestsForQuarter(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, label, is_committed, priority_score')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .order('label', { ascending: true });
  if (error) return [];
  return data;
}

// Ambil pairwise_results (hasil perbandingan) untuk user, year, quarter
export async function getPairwiseResults(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('pairwise_results')
    .select('results_json')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .single();
  if (error || !data) return null;
  return data.results_json;
}

// Ambil Main Quest yang sudah committed untuk user, year, quarter
export async function getQuests(year: number, quarter: number, isCommitted: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, motivation')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', isCommitted)
    .order('priority_score', { ascending: false })
    .limit(3);
  if (error) return [];
  return data;
}

// Ambil semua milestones untuk quest tertentu
export async function getMilestonesForQuest(questId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, display_order')
    .eq('quest_id', questId)
    .order('display_order', { ascending: true });
  if (error) return [];
  return data;
}

// Ambil semua tasks untuk milestone tertentu
export async function getTasksForMilestone(milestoneId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status')
    .eq('milestone_id', milestoneId)
    .is('parent_task_id', null)
    .order('display_order', { ascending: true });
  if (error) return [];
  return data;
}

// Tambah milestone baru ke quest
export async function addMilestone(formData: FormData) {
  const supabase = await createClient();
  const quest_id = formData.get('quest_id');
  const title = formData.get('title');
  if (!quest_id || !title) throw new Error('quest_id dan title wajib diisi');
  // Hitung display_order terakhir
  const { data: last } = await supabase
    .from('milestones')
    .select('display_order')
    .eq('quest_id', quest_id)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();
  const nextOrder = last && last.display_order ? last.display_order + 1 : 1;
  const { error } = await supabase
    .from('milestones')
    .insert({ quest_id, title, display_order: nextOrder });
  if (error) throw new Error('Gagal menambah milestone: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Milestone berhasil ditambahkan!' };
}

// Tambah task baru ke milestone
export async function addTask(formData: FormData): Promise<{ message: string, task?: {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
  parent_task_id?: string | null;
  milestone_id: string;
} }> {
  const supabase = await createClient();
  const milestone_id_val = formData.get('milestone_id');
  const title_val = formData.get('title');
  const parent_task_id_val = formData.get('parent_task_id');
  const display_order = formData.get('display_order');
  const milestone_id = milestone_id_val ? milestone_id_val.toString() : null;
  const title = title_val ? title_val.toString() : null;
  const parent_task_id = parent_task_id_val ? parent_task_id_val.toString() : null;
  if (!milestone_id) throw new Error('milestone_id wajib diisi');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak ditemukan');
  interface InsertTaskData {
    milestone_id: string | null;
    title: string | null;
    status: 'TODO' | 'DONE';
    user_id: string;
    parent_task_id?: string | null;
    type?: string;
    display_order?: number;
  }
  const insertData: InsertTaskData = { milestone_id, title, status: 'TODO', user_id: user.id };
  if (parent_task_id) {
    insertData.parent_task_id = parent_task_id;
    insertData.type = 'SUBTASK';
    if (display_order !== undefined && display_order !== null) {
      insertData.display_order = Number(display_order);
    }
  } else {
    insertData.type = 'MAIN_QUEST';
  }
  const { data, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select('id, title, status, display_order, parent_task_id, milestone_id')
    .single();
  if (error) throw new Error('Gagal menambah task: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Task berhasil ditambahkan!', task: data };
}

// Update status task (TODO/DONE)
export async function updateTaskStatus(taskId: string, newStatus: 'TODO' | 'DONE') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId);
  if (error) throw new Error('Gagal update status task: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Status task berhasil diupdate!' };
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

// Edit task
export async function updateTask(taskId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ title })
    .eq('id', taskId);
  if (error) throw new Error('Gagal update task: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Task berhasil diupdate!' };
}

// Hapus task
export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw new Error('Gagal hapus task: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Task berhasil dihapus!' };
}

// Update motivation quest berdasarkan id
export async function updateQuestMotivation(questId: string, motivation: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('quests')
    .update({ motivation })
    .eq('id', questId);
  if (error) throw new Error('Gagal update motivation: ' + (error.message || ''));
  revalidatePath('/planning/main-quests');
  return { message: 'Motivation berhasil diupdate!' };
}

// Update display_order task
export async function updateTaskDisplayOrder(taskId: string, display_order: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ display_order })
    .eq('id', taskId);
  if (error) throw new Error('Gagal update urutan task: ' + (error.message || ''));
  return { message: 'Urutan task berhasil diupdate!' };
}

// Ambil semua subtask untuk parent_task_id tertentu
export async function getSubtasksForTask(parent_task_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, display_order, parent_task_id, milestone_id')
    .eq('parent_task_id', parent_task_id)
    .order('display_order', { ascending: true });
  if (error) return [];
  return data;
}

// Ambil semua sub-tugas dari Main Quest yang belum terjadwal untuk user, year, quarter
export async function getUnscheduledTasks(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Ambil quest id yang committed di quarter & year tsb
  const { data: quests, error: questError } = await supabase
    .from('quests')
    .select('id')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', true);
  if (questError || !quests || quests.length === 0) return [];
  const questIds = quests.map(q => q.id);

  // 2. Ambil milestone id dari quest-quest tsb
  const { data: milestones, error: milestoneError } = await supabase
    .from('milestones')
    .select('id')
    .in('quest_id', questIds);
  if (milestoneError || !milestones || milestones.length === 0) return [];
  const milestoneIds = milestones.map(m => m.id);

  // 3. Ambil tasks yang belum terjadwal, status TODO, dan parent_task_id null
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, status, scheduled_date, milestone_id, parent_task_id')
    .in('milestone_id', milestoneIds)
    .eq('status', 'TODO')
    .is('scheduled_date', null)
    .is('parent_task_id', null);
  if (taskError || !tasks) return [];
  return tasks;
}

// Ambil semua tugas yang sudah dijadwalkan dalam rentang minggu tertentu (startDate, endDate)
export async function getScheduledTasksForWeek(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Ambil quest id yang committed milik user
  const { data: quests, error: questError } = await supabase
    .from('quests')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_committed', true);
  if (questError || !quests || quests.length === 0) return [];
  const questIds = quests.map(q => q.id);

  // 2. Ambil milestone id dari quest-quest tsb
  const { data: milestones, error: milestoneError } = await supabase
    .from('milestones')
    .select('id')
    .in('quest_id', questIds);
  if (milestoneError || !milestones || milestones.length === 0) return [];
  const milestoneIds = milestones.map(m => m.id);

  // 3. Ambil tasks yang scheduled_date di range minggu
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, status, scheduled_date, milestone_id, parent_task_id')
    .in('milestone_id', milestoneIds)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate);
  if (taskError || !tasks) return [];
  return tasks;
}

// Update scheduled_date pada task tertentu
export async function scheduleTask(taskId: string, newScheduledDate: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ scheduled_date: newScheduledDate })
    .eq('id', taskId);
  if (error) {
    return { success: false, message: error.message || 'Gagal menjadwalkan tugas.' };
  }
  // Revalidate path agar data fresh
  revalidatePath('/execution/weekly-sync');
  return { success: true, message: 'Tugas berhasil dijadwalkan.' };
} 