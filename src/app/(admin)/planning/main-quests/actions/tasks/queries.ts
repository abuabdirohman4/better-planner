import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryTasksForMilestone(supabase: SupabaseClient, milestoneId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, display_order')
    .eq('milestone_id', milestoneId)
    .is('parent_task_id', null)
    .order('display_order', { ascending: true });
  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data ?? [];
}

export async function updateTaskDisplayOrderBatch(
  supabase: SupabaseClient,
  tasks: { id: string; display_order: number }[]
) {
  for (const task of tasks) {
    const { error } = await supabase
      .from('tasks')
      .update({ display_order: task.display_order })
      .eq('id', task.id);
    if (error) throw error;
  }
}

export async function queryLastTaskOrder(supabase: SupabaseClient, milestoneId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('display_order')
    .eq('milestone_id', milestoneId)
    .is('parent_task_id', null)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();
  if (error) return undefined;
  return data?.display_order;
}

export async function validateMilestoneExists(supabase: SupabaseClient, milestoneId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('id')
    .eq('id', milestoneId)
    .single();
  if (error || !data) return false;
  return true;
}

export async function insertTask(
  supabase: SupabaseClient,
  data: {
    milestone_id: string | null;
    title: string | null;
    status: 'TODO' | 'DONE';
    user_id: string;
    parent_task_id?: string | null;
    type?: string;
    display_order?: number;
  }
) {
  const { data: result, error } = await supabase
    .from('tasks')
    .insert(data)
    .select('id, title, status, display_order, parent_task_id, milestone_id')
    .single();
  if (error) throw new Error('Gagal menambah task: ' + (error.message || ''));
  return result;
}

export async function updateTaskStatusField(
  supabase: SupabaseClient,
  taskId: string,
  status: 'TODO' | 'DONE'
) {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);
  if (error) throw new Error('Gagal update status task: ' + (error.message || ''));
}

export async function updateTaskTitle(supabase: SupabaseClient, taskId: string, title: string) {
  const { error } = await supabase
    .from('tasks')
    .update({ title })
    .eq('id', taskId);
  if (error) throw new Error('Gagal update task: ' + (error.message || ''));
}

export async function deleteTaskById(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw new Error('Gagal hapus task: ' + (error.message || ''));
}

export async function updateTaskOrder(supabase: SupabaseClient, taskId: string, order: number) {
  const { error } = await supabase
    .from('tasks')
    .update({ display_order: order })
    .eq('id', taskId);
  if (error) throw new Error('Gagal update urutan task: ' + (error.message || ''));
}

export async function updateTaskScheduledDate(
  supabase: SupabaseClient,
  taskId: string,
  date: string | null
) {
  const { error } = await supabase
    .from('tasks')
    .update({ scheduled_date: date })
    .eq('id', taskId);
  if (error) return { success: false, message: error.message || 'Gagal menjadwalkan tugas.' };
  return { success: true };
}
