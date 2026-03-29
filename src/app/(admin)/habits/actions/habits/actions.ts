"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Habit, HabitFormInput } from "@/types/habit";
import {
  queryHabits,
  insertHabit,
  updateHabitById,
  archiveHabitById,
  deleteHabitById,
} from "./queries";
import { toHabit } from "./logic";

const REVALIDATE_PATHS = ['/habits/monthly', '/habits/today'] as const;
function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
}

export async function getHabits(includeArchived = false): Promise<Habit[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const rows = await queryHabits(supabase, user.id, includeArchived);
  return rows.map(toHabit);
}

export async function addHabit(input: HabitFormInput): Promise<Habit> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = await insertHabit(supabase, user.id, input);
  revalidateAll();
  return toHabit(row);
}

export async function updateHabit(
  habitId: string,
  updates: Partial<HabitFormInput>
): Promise<Habit> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = await updateHabitById(supabase, habitId, user.id, updates);
  revalidateAll();
  return toHabit(row);
}

export async function archiveHabit(habitId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await archiveHabitById(supabase, habitId, user.id);
  revalidateAll();
}

export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await deleteHabitById(supabase, habitId, user.id);
  revalidateAll();
}
