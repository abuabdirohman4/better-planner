"use server";

import { createClient } from '@/lib/supabase/server';
import { getWeekDates, getLocalDateString } from '@/lib/dateUtils';
import { summarizeEnergy, mostDrainingTask } from '@/lib/energy';
import { queryEnergyRows } from './queries';

export async function getWeeklyEnergySummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plus: 0, neutral: 0, minus: 0, total: 0, worstTask: null as string | null };
  // Tanggal WIB dijadikan 12:00 UTC supaya hari di server UTC sama dengan hari WIB (Senin dini hari tidak jatuh ke minggu lalu).
  const week = getWeekDates(new Date(getLocalDateString(new Date()) + 'T12:00:00Z'));
  const rows = await queryEnergyRows(supabase, user.id, getLocalDateString(week[0]), getLocalDateString(week[6]));
  return { ...summarizeEnergy(rows), worstTask: mostDrainingTask(rows) };
}
