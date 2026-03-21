"use server";

import { createClient } from '@/lib/supabase/server';
import { parseSideQuestFormData } from './logic';
import { insertSideQuestTask, upsertDailyPlan, insertSideQuestPlanItem } from './queries';

export async function addSideQuest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { title, date } = parseSideQuestFormData(formData);

  const task = await insertSideQuestTask(supabase, user.id, title);
  const plan = await upsertDailyPlan(supabase, user.id, date);
  await insertSideQuestPlanItem(supabase, plan.id, task.id);

  return task;
}
