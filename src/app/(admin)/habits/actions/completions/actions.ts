"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HabitCompletion } from "@/types/habit";
import {
  queryCompletionsForMonth,
  queryCompletionsInRange,
  queryCompletion,
  insertCompletion,
  deleteCompletion,
  deleteLastCompletion,
  updateCompletionDoneAt,
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

/**
 * Completions of the last `days` days, for streak calculation only (app-w3t3).
 * Bounded window — a streak longer than this reads as capped, not unlimited history.
 * ponytail: 90-day cap; widen if someone actually passes a 90-day streak.
 */
export async function getRecentCompletions(days = 90): Promise<HabitCompletion[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const today = getTodayWIB();
  const from = new Date(today + 'T00:00:00Z');
  from.setUTCDate(from.getUTCDate() - days);

  const rows = await queryCompletionsInRange(supabase, user.id, from.toISOString().slice(0, 10), today);
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

/**
 * Koreksi jam dikerjakan (app-r02c). Abu mungkin shalat 12:15 tapi baru mencentang 21:00 —
 * ini yang membuat penanda menilai shalatnya, bukan ingatannya mencentang.
 * `time` "HH:MM", atau null untuk kembali memakai created_at.
 */
export async function setCompletionDoneAt(
  completionId: string,
  time: string | null
): Promise<HabitCompletion> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  if (time !== null && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    throw new Error('Invalid time: expected HH:MM');
  }

  const row = await updateCompletionDoneAt(supabase, completionId, user.id, time);
  revalidateAll();
  return toHabitCompletion(row);
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
