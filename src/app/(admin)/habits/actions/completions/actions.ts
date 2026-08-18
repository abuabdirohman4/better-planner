"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HabitCompletion } from "@/types/habit";
import {
  queryCompletionsForMonth,
  queryCompletion,
  insertCompletion,
  deleteCompletion,
  deleteLastCompletion,
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
    // Binary toggle on a multi-target habit = mark the whole day done (insert daily_target rows)
    const { data: habit } = await supabase.from('habits').select('daily_target').eq('id', habitId).eq('user_id', user.id).maybeSingle();
    const n = Math.max(1, habit?.daily_target ?? 1);
    for (let i = 0; i < n; i++) await insertCompletion(supabase, habitId, user.id, date);
    revalidateAll();
    return { completed: true };
  }
}

/** Multi-completion: +1 inserts a row, -1 removes the latest row for that day. */
export async function adjustCompletion(
  habitId: string,
  date: string,
  delta: 1 | -1
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  if (date > getTodayWIB()) {
    throw new Error('Cannot adjust completion for a future date');
  }

  if (delta > 0) {
    await insertCompletion(supabase, habitId, user.id, date);
  } else {
    await deleteLastCompletion(supabase, habitId, user.id, date);
  }
  revalidateAll();
}
