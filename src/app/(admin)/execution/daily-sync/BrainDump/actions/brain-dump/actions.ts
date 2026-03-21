"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import type { BrainDumpItem } from '@/types/brain-dump';
import { queryBrainDumpByDate, upsertBrainDumpRecord, queryBrainDumpByDateRange } from './queries';
import { validateBrainDumpDate, sanitizeContent } from './logic';

export async function getBrainDumpByDate(date: string): Promise<BrainDumpItem | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const data = await queryBrainDumpByDate(supabase, user.id, date).catch((error) => {
      if (error?.code === 'PGRST116') return null;
      throw error;
    });

    return data;
  } catch (error) {
    handleApiError(error, 'memuat brain dump');
    return null;
  }
}

export async function upsertBrainDump(brainDumpData: {
  content: string;
  date: string;
}): Promise<BrainDumpItem | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    validateBrainDumpDate(brainDumpData.date);
    const content = sanitizeContent(brainDumpData.content);

    const data = await upsertBrainDumpRecord(supabase, user.id, content, brainDumpData.date);

    revalidatePath('/execution/daily-sync');
    return data;
  } catch (error) {
    handleApiError(error, 'menyimpan brain dump');
    throw error;
  }
}

export async function getBrainDumpByDateRange(
  startDate: string,
  endDate: string,
): Promise<BrainDumpItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await queryBrainDumpByDateRange(supabase, user.id, startDate, endDate);
  } catch (error) {
    handleApiError(error, 'memuat data berdasarkan rentang tanggal');
    return [];
  }
}
