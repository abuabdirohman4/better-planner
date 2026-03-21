"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { rpcUpdateMainQuests } from './queries';
import { validateRpcSuccess, formatRpcResult } from './logic';

export async function updateMainQuestTask(
  taskId: string,
  title: string,
  status: 'TODO' | 'DONE',
  displayOrder: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const data = await rpcUpdateMainQuests(supabase, user.id, taskId, title, status, displayOrder);
  validateRpcSuccess(data);
  revalidatePath('/planning/main-quests');
  return formatRpcResult(data);
}

export async function createMainQuestTask(
  milestoneId: string,
  title: string,
  displayOrder: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const formData = new FormData();
  formData.append('milestone_id', milestoneId);
  formData.append('title', title);
  formData.append('display_order', String(displayOrder));
  const { addTask } = await import('../tasks/actions');
  const result = await addTask(formData);
  revalidatePath('/planning/main-quests');
  return result;
}

export async function deleteMainQuestTask(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const { deleteTask } = await import('../tasks/actions');
  const result = await deleteTask(taskId);
  revalidatePath('/planning/main-quests');
  return result;
}

export async function updateMainQuestSubtask(
  taskId: string,
  title: string,
  status: 'TODO' | 'DONE',
  displayOrder: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const data = await rpcUpdateMainQuests(supabase, user.id, taskId, title, status, displayOrder);
  validateRpcSuccess(data);
  revalidatePath('/planning/main-quests');
  revalidatePath('/execution/weekly-sync');
  revalidatePath('/execution/daily-sync');
  return formatRpcResult(data);
}
