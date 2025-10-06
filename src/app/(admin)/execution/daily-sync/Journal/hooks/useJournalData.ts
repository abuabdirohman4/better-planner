import useSWR, { mutate as globalMutate } from 'swr';
import { getActivityLogById } from '../actions/journalActions';
import { dailySyncKeys } from '@/lib/swr';

export interface JournalData {
  whatDone: string;
  whatThink: string;
}

export interface UseJournalDataOptions {
  activityId?: string;
  enabled?: boolean;
}

export interface UseJournalDataReturn {
  journalData: JournalData | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  updateJournal: (data: JournalData) => Promise<void>;
}

export function useJournalData({ 
  activityId, 
  enabled = true 
}: UseJournalDataOptions): UseJournalDataReturn {
  const { 
    data: journalData, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    // Only fetch if we have an activityId and it's enabled
    enabled && activityId ? dailySyncKeys.journalData(activityId) : null,
    () => getActivityLogById(activityId!),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 1000, // 5 seconds for very fresh journal data
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  const updateJournal = async (data: JournalData) => {
    if (!activityId) return;

    try {
      // Optimistic update - update UI immediately
      mutate((current) => {
        if (!current) return current;
        return {
          ...current,
          what_done: data.whatDone,
          what_think: data.whatThink,
        };
      }, false);

      // Update in background
      await globalMutate(dailySyncKeys.journalData(activityId));
      
      // ✅ CRITICAL: Invalidate ActivityLog cache to trigger real-time update
      await globalMutate((key) => {
        if (Array.isArray(key) && key[0] === 'daily-sync' && key[1] === 'activity-logs') {
          return true; // Invalidate all activity logs
        }
        return false;
      });
    } catch (error) {
      console.error('Error updating journal:', error);
      // Revert optimistic update on error
      mutate();
      throw error;
    }
  };

  return {
    journalData: journalData ? {
      whatDone: journalData.what_done || '',
      whatThink: journalData.what_think || '',
    } : null,
    isLoading,
    error: error?.message || null,
    mutate,
    updateJournal,
  };
}
