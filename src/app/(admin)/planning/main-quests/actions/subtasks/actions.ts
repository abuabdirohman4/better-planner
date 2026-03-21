"use server";

import { createClient } from '@/lib/supabase/server';
import { querySubtasksByParentId } from './queries';

export async function getSubtasksForTask(parent_task_id: string) {
  const supabase = await createClient();
  return querySubtasksByParentId(supabase, parent_task_id);
}
