'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryInsertAccomplishment, queryDeleteAccomplishment } from './queries';
import type { Accomplishment } from '@/types/twelve-week-sync';

export async function addAccomplishment(
  quarterlyReviewId: string,
  description: string,
  sortOrder: number
): Promise<{ success: boolean; data?: Accomplishment; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const data = await queryInsertAccomplishment(supabase, quarterlyReviewId, description, sortOrder);
    revalidatePath('/planning/12-week-sync');
    return { success: true, data };
  } catch (error) {
    const err = handleApiError(error, 'menambah pencapaian');
    return { success: false, message: err.message };
  }
}

export async function removeAccomplishment(
  accomplishmentId: string,
  quarterlyReviewId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryDeleteAccomplishment(supabase, accomplishmentId, quarterlyReviewId);
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menghapus pencapaian');
    return { success: false, message: err.message };
  }
}
