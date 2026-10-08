"use server";

import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryHourlyNotes, upsertHourlyNoteRecord, deleteHourlyNoteRecord, type HourlyNote } from './queries';
import { validateHour } from './logic';

async function getUserClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return { supabase, userId: user.id };
}

export async function getHourlyNotes(date: string): Promise<HourlyNote[]> {
  try {
    const { supabase, userId } = await getUserClient();
    return await queryHourlyNotes(supabase, userId, date);
  } catch (error) {
    handleApiError(error, 'memuat data');
    return [];
  }
}

/** Simpan catatan satu jam; teks kosong = hapus barisnya. */
export async function saveHourlyNote(date: string, hour: number, content: string): Promise<void> {
  validateHour(hour);
  const { supabase, userId } = await getUserClient();
  const text = content.trim();
  if (text) await upsertHourlyNoteRecord(supabase, userId, date, hour, text);
  else await deleteHourlyNoteRecord(supabase, userId, date, hour);
}
