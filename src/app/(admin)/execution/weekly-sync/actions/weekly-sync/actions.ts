"use server";

import { createClient } from '@/lib/supabase/server';
import { rpcGetWeeklySync } from './queries';
import { normalizeWeeklySyncData } from './logic';

const EMPTY_RESULT = { goals: [], rules: [] };

export async function getWeeklySync(
  year: number,
  quarter: number,
  weekNumber: number,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_RESULT;

  try {
    const data = await rpcGetWeeklySync(supabase, user.id, year, quarter, weekNumber, startDate, endDate);
    return normalizeWeeklySyncData(data);
  } catch (error) {
    console.error('Error in getWeeklySync:', error);
    return EMPTY_RESULT;
  }
}
