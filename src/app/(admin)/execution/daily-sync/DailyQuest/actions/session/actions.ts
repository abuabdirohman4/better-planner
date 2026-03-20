"use server";

import { createClient } from '@/lib/supabase/server';
import { queryDailyPlanItem, countFocusSessions } from './queries';
import { validateItemId } from './logic';

export async function countCompletedSessions(
  dailyPlanItemId: string,
  date: string
): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const dailyPlanItem = await queryDailyPlanItem(supabase, dailyPlanItemId);
  const itemId = validateItemId(dailyPlanItem);

  return countFocusSessions(supabase, user.id, itemId, date);
}
