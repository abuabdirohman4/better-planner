"use server";

import { createClient } from '@/lib/supabase/server';
import type { WeeklyRefuel } from '@/types/weekly-sync';
import { queryWeeklyRefuel, upsertWeeklyRefuel, queryFocusWeek } from './queries';
import { normalizeText, summarizeFocus, weekDateStrings, type FocusSummary } from './logic';
import { getDateFromWeek, getQuarterWeekRange } from '@/lib/quarterUtils';
import { queryCommittedQuests } from '@/app/(admin)/planning/main-quests/actions/quests/queries';

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

export type FocusResult = { success: boolean; message?: string; data?: FocusSummary };

/** Ringkasan fokus Senin–Minggu untuk minggu ke-weekNumber dalam kuartal. */
export async function getWeeklyFocusSummary(year: number, quarter: number, weekNumber: number): Promise<FocusResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };
  try {
    const yearWeek = getQuarterWeekRange(year, quarter).startWeek + weekNumber - 1;
    const dates = weekDateStrings(getDateFromWeek(year, yearWeek, 1));
    const hfg = await queryCommittedQuests(supabase, user.id, year, quarter, true, 3);
    const { logs, tasks, hfgMilestones } = await queryFocusWeek(supabase, user.id, dates[0], dates[6], hfg.map((q) => q.id));
    return { success: true, data: summarizeFocus(logs, tasks, dates, new Set(hfgMilestones)) };
  } catch (error) {
    console.error('Error fetching weekly focus summary:', error);
    return { success: false, message: 'Ringkasan fokus belum bisa dimuat' };
  }
}
