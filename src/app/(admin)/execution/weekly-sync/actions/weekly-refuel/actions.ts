"use server";

import { createClient } from '@/lib/supabase/server';
import type { WeeklyRefuel } from '@/types/weekly-sync';
import { queryWeeklyRefuel, upsertWeeklyRefuel } from './queries';
import { normalizeText } from './logic';

export type RefuelResult = { success: boolean; message?: string; data?: WeeklyRefuel | null };

export async function getWeeklyRefuel(year: number, quarter: number, weekNumber: number): Promise<RefuelResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };
  try {
    return { success: true, data: await queryWeeklyRefuel(supabase, user.id, year, quarter, weekNumber) };
  } catch (error) {
    console.error('Error fetching weekly refuel:', error);
    return { success: false, message: 'Refuel Sync belum bisa dimuat' };
  }
}

export async function saveWeeklyRefuel(
  year: number,
  quarter: number,
  weekNumber: number,
  input: { activities: string; achievements: string }
): Promise<RefuelResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  try {
    await upsertWeeklyRefuel(supabase, user.id, year, quarter, weekNumber, {
      activities: normalizeText(input.activities),
      achievements: normalizeText(input.achievements),
    });
    return { success: true, message: 'Refuel Sync tersimpan' };
  } catch (error) {
    console.error('Error saving weekly refuel:', error);
    return { success: false, message: 'Gagal menyimpan Refuel Sync' };
  }
}
