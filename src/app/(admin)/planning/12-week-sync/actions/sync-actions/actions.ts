'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryToggleSyncAction } from './queries';

export async function toggleSyncAction(
  syncActionId: string,
  quarterlyReviewId: string,
  isCompleted: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryToggleSyncAction(supabase, syncActionId, quarterlyReviewId, isCompleted);
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'mengubah sync action');
    return { success: false, message: err.message };
  }
}
