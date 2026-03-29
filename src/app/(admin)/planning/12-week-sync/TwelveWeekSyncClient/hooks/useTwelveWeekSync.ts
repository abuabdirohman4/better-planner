'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { quarterlyReviewKeys } from '@/lib/swr';
import type { TwelveWeekSyncData, ReflectionField } from '@/types/twelve-week-sync';
import { 
  getOrCreateQuarterlyReview, 
  updateReflection, 
  completeQuarterlyReview 
} from '../../actions/quarterly-review/actions';
import { upsertGoalReview } from '../../actions/goal-review/actions';
import { addAccomplishment, removeAccomplishment } from '../../actions/accomplishments/actions';
import { toggleSyncAction } from '../../actions/sync-actions/actions';

export function useTwelveWeekSync(year: number, quarter: number) {
  const key = quarterlyReviewKeys.detail(year, quarter);

  const { data, error, isLoading, mutate } = useSWR<TwelveWeekSyncData>(
    key,
    async () => {
      const result = await getOrCreateQuarterlyReview(year, quarter);
      if (!result.success || !result.data) throw new Error(result.message ?? 'Failed to load');
      return result.data;
    },
    {
      keepPreviousData: true,
      dedupingInterval: 2 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  // Debounced server update for reflections
  const debouncedUpdateReflection = useDebouncedCallback(
    async (reviewId: string, field: ReflectionField, value: string) => {
      const result = await updateReflection(reviewId, field, value);
      if (!result.success) {
        toast.error(result.message ?? 'Gagal menyimpan');
        mutate(); // Revert to server state
      }
    },
    1000
  );

  const handleUpdateReflection = useCallback((field: ReflectionField, value: string) => {
    if (!data) return;
    
    // 1. Optimistic update (Immediate)
    mutate(
      { 
        ...data, 
        review: { ...data.review, [field]: value } 
      }, 
      false
    );
    
    // 2. Debounced server call
    debouncedUpdateReflection(data.review.id, field, value);
  }, [data, mutate, debouncedUpdateReflection]);

  const handleUpsertGoalReview = useCallback(async (
    goalReviewId: string,
    score: number | null,
    notes: string | null
  ) => {
    if (!data) return;
    
    // Simple optimistic update for the specific goal
    const updatedGoalReviews = data.goalReviews.map(gr => 
      gr.id === goalReviewId ? { ...gr, progress_score: score, achievement_notes: notes } : gr
    );
    mutate({ ...data, goalReviews: updatedGoalReviews }, false);

    const result = await upsertGoalReview(goalReviewId, data.review.id, score, notes);
    if (!result.success) {
      toast.error(result.message ?? 'Gagal menyimpan score');
      mutate();
    }
  }, [data, mutate]);

  const handleAddAccomplishment = useCallback(async (description: string) => {
    if (!data) return;
    const sortOrder = data.accomplishments.length;
    const result = await addAccomplishment(data.review.id, description, sortOrder);
    if (result.success && result.data) {
      mutate({ ...data, accomplishments: [...data.accomplishments, result.data] }, false);
    } else {
      toast.error(result.message ?? 'Gagal menambah pencapaian');
      mutate();
    }
  }, [data, mutate]);

  const handleRemoveAccomplishment = useCallback(async (accomplishmentId: string) => {
    if (!data) return;
    mutate(
      { 
        ...data, 
        accomplishments: data.accomplishments.filter(a => a.id !== accomplishmentId) 
      },
      false
    );
    const result = await removeAccomplishment(accomplishmentId, data.review.id);
    if (!result.success) {
      toast.error(result.message ?? 'Gagal menghapus pencapaian');
      mutate();
    }
  }, [data, mutate]);

  const handleToggleSyncAction = useCallback(async (syncActionId: string, isCompleted: boolean) => {
    if (!data) return;
    mutate({
      ...data,
      syncActions: data.syncActions.map(a =>
        a.id === syncActionId ? { ...a, is_completed: isCompleted } : a
      ),
    }, false);
    const result = await toggleSyncAction(syncActionId, data.review.id, isCompleted);
    if (!result.success) {
      toast.error(result.message ?? 'Gagal update sync action');
      mutate();
    }
  }, [data, mutate]);

  const handleCompleteReview = useCallback(async () => {
    if (!data) return;
    const result = await completeQuarterlyReview(data.review.id);
    if (result.success) {
      toast.success('Review selesai! 🎉');
      mutate(); // Revalidate to show "Selesai" badge
    } else {
      toast.error(result.message ?? 'Gagal menyelesaikan review');
    }
  }, [data, mutate]);

  return {
    data,
    isLoading,
    error,
    handleUpdateReflection,
    handleUpsertGoalReview,
    handleAddAccomplishment,
    handleRemoveAccomplishment,
    handleToggleSyncAction,
    handleCompleteReview,
  };
}
