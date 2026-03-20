"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryTasksForMilestone,
  updateTaskDisplayOrderBatch,
  queryLastTaskOrder,
  validateMilestoneExists,
  insertTask,
  updateTaskStatusField,
  updateTaskTitle,
  deleteTaskById,
  updateTaskOrder,
  updateTaskScheduledDate,
} from './queries';
import { parseTaskFormData, buildTaskInsertData, filterTasksNeedingOrderFix } from './logic';

export async function getTasksForMilestone(milestoneId: string) {
  const supabase = await createClient();
  const data = await queryTasksForMilestone(supabase, milestoneId);

  const tasksToFix = filterTasksNeedingOrderFix(data as { id: string; display_order: number | null }[]);
  if (tasksToFix.length > 0) {
    const fixList = tasksToFix.map((task, i) => ({ id: task.id, display_order: i + 1 }));
    await updateTaskDisplayOrderBatch(supabase, fixList);
    return queryTasksForMilestone(supabase, milestoneId);
  }

  return data;
}

export async function addTask(formData: FormData): Promise<{
  message: string;
  task?: {
    id: string;
    title: string;
    status: 'TODO' | 'DONE';
    display_order: number;
    parent_task_id?: string | null;
    milestone_id: string;
  };
}> {
  const supabase = await createClient();
  const parsed = parseTaskFormData(formData);
  const { milestone_id, parent_task_id } = parsed;

  if (milestone_id) {
    const milestoneExists = await validateMilestoneExists(supabase, milestone_id);
    if (!milestoneExists) throw new Error('Milestone tidak ditemukan atau tidak valid');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak ditemukan');

  let lastOrder: number | undefined;
  if (!parent_task_id && !parsed.display_order && milestone_id) {
    lastOrder = await queryLastTaskOrder(supabase, milestone_id);
  }

  const insertData = buildTaskInsertData({ ...parsed, lastOrder }, user.id);
  const task = await insertTask(supabase, insertData);

  revalidatePath('/planning/main-quests');
  revalidatePath('/execution/weekly-sync');
  revalidatePath('/execution/daily-sync');
  return { message: 'Task berhasil ditambahkan!', task };
}

export async function updateTaskStatus(taskId: string, newStatus: 'TODO' | 'DONE') {
  const supabase = await createClient();
  await updateTaskStatusField(supabase, taskId, newStatus);
  revalidatePath('/planning/main-quests');
  revalidatePath('/execution/weekly-sync');
  revalidatePath('/execution/daily-sync');
  return { message: 'Status task berhasil diupdate!' };
}

export async function updateTask(taskId: string, title: string) {
  const supabase = await createClient();
  await updateTaskTitle(supabase, taskId, title);
  revalidatePath('/planning/main-quests');
  revalidatePath('/execution/weekly-sync');
  revalidatePath('/execution/daily-sync');
  return { message: 'Task berhasil diupdate!' };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  await deleteTaskById(supabase, taskId);
  revalidatePath('/planning/main-quests');
  revalidatePath('/execution/weekly-sync');
  revalidatePath('/execution/daily-sync');
  return { message: 'Task berhasil dihapus!' };
}

export async function updateTaskDisplayOrder(taskId: string, display_order: number) {
  const supabase = await createClient();
  await updateTaskOrder(supabase, taskId, display_order);
  return { message: 'Urutan task berhasil diupdate!' };
}

export async function updateTasksDisplayOrder(tasks: { id: string; display_order: number }[]) {
  const supabase = await createClient();
  await updateTaskDisplayOrderBatch(supabase, tasks);
  revalidatePath('/planning/main-quests');
  return { success: true, message: 'Urutan task berhasil diupdate!' };
}

export async function scheduleTask(taskId: string, newScheduledDate: string | null) {
  const supabase = await createClient();
  const result = await updateTaskScheduledDate(supabase, taskId, newScheduledDate);
  if (!result.success) {
    return { success: false, message: (result as any).message || 'Gagal menjadwalkan tugas.' };
  }
  revalidatePath('/execution/weekly-sync');
  return { success: true, message: 'Tugas berhasil dijadwalkan.' };
}
