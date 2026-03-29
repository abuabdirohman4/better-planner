"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HabitCompletion } from "@/types/habit";
import {
  queryCompletionsForMonth,
  queryCompletion,
  insertCompletion,
  deleteCompletion,
} from "./queries";
import { toHabitCompletion } from "./logic";

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Get today's date in WIB timezone as "YYYY-MM-DD".
 */
function getTodayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: WIB_TIMEZONE });
}

const REVALIDATE_PATHS = ['/habits/monthly', '/habits/today'] as const;
function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
}

export async function getCompletionsForMonth(
  year: number,
  month: number
): Promise<HabitCompletion[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const rows = await queryCompletionsForMonth(supabase, user.id, year, month);
  return rows.map(toHabitCompletion);
}

export async function toggleCompletion(
  habitId: string,
  date: string
): Promise<{ completed: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate: cannot toggle future dates
  const todayWIB = getTodayWIB();
  if (date > todayWIB) {
    throw new Error('Cannot toggle completion for a future date');
  }

  const existing = await queryCompletion(supabase, habitId, user.id, date);

  if (existing) {
    await deleteCompletion(supabase, habitId, user.id, date);
    revalidateAll();
    return { completed: false };
  } else {
    await insertCompletion(supabase, habitId, user.id, date);
    revalidateAll();
    return { completed: true };
  }
}
