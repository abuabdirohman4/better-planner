"use server";

import { createClient } from '@/lib/supabase/server';

// Ambil semua subtask untuk parent_task_id tertentu
export async function getSubtasksForTask(parent_task_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, display_order, parent_task_id, milestone_id, created_at')
    .eq('parent_task_id', parent_task_id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true }); // Secondary sort for stability
  
  if (error) {
    return [];
  }
  
  return data;
}
