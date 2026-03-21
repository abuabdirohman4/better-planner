'use client';

import { useState, useCallback } from 'react';
import { updateActivityJournal, logActivityWithJournal } from '../actions/journalActions';
import { getActivityLogId, updateActivityLogJournal } from '../../PomodoroTimer/actions/timerSessionActions';
import type { JournalData } from '@/types/journal';
import { createClient } from '@/lib/supabase/client';
import { useJournalData } from './useJournalData';
import { mutate as globalMutate } from 'swr';
import { dailySyncKeys } from '@/lib/swr';
import { getCurrentLocalDate } from '@/lib/dateUtils';
import { useActivityLogs } from '../../ActivityLog/hooks/useActivityLogs';

export const useJournal = () => {
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [pendingActivityData, setPendingActivityData] = useState<{
    activityId?: string;
    taskId: string;
    date: string;
    startTime: string;
    endTime: string;
    taskTitle?: string;
    duration: number;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const { updateJournal: updateJournalData } = useJournalData({
    activityId: pendingActivityData?.activityId,
    enabled: !!pendingActivityData?.activityId,
  });
  
  // ✅ NEW: Get ActivityLogs hook for optimistic updates
  const currentLocalDate = getCurrentLocalDate();
  const { updateLogJournal } = useActivityLogs({ 
    date: currentLocalDate,
    refreshKey: 0,
    lastActivityTimestamp: 0
  });

  const openJournalModal = useCallback((data: {
    activityId?: string;
    taskId: string;
    date: string;
    startTime: string;
    endTime: string;
    taskTitle?: string;
    duration: number;
  }) => {
    setPendingActivityData(data);
    setIsJournalModalOpen(true);
    setRetryCount(0); // Reset retry count when opening modal
    setIsRetrying(false); // Reset retry state
  }, []);

  const closeJournalModal = useCallback(() => {
    setIsJournalModalOpen(false);
    setPendingActivityData(null);
  }, []);

  const saveJournal = useCallback(async (journalData: JournalData): Promise<void> => {
    if (!pendingActivityData) {
      throw new Error('No pending activity data');
    }

    const { whatDone, whatThink } = journalData;

    // ✅ MOBILE FIX: Detect mobile device for better error handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceInfo = isMobile ? 'Mobile' : 'Desktop';

    if (pendingActivityData.activityId) {
      // ✅ INSTANT: Optimistic update for immediate UI feedback
      updateLogJournal(pendingActivityData.activityId, whatDone, whatThink);
      
      // Update existing activity log
      await updateActivityJournal(
        pendingActivityData.activityId,
        whatDone,
        whatThink
      );
      
      // ✅ CRITICAL: Update SWR cache for real-time ActivityLog update
      await updateJournalData({ whatDone, whatThink });
      
      // ✅ FIX: Use current date for cache invalidation
      const currentLocalDate = getCurrentLocalDate();
      
      // ✅ CRITICAL: Invalidate ActivityLog cache with current date
      await globalMutate(dailySyncKeys.activityLogs(currentLocalDate));
      
      // ✅ FIX: Add small delay to ensure date consistency
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      // ✅ FIX: Create activity log first, then update with journal data
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        

        // ✅ FIX: First try to find existing activity log
        const { data: recentActivity, error: activityError } = await supabase
          .from('activity_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('task_id', pendingActivityData.taskId)
          .eq('start_time', pendingActivityData.startTime)
          .eq('end_time', pendingActivityData.endTime)
          .eq('type', 'FOCUS')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (activityError && activityError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is expected if activity log doesn't exist yet
          console.error(`📱 [${deviceInfo}] Error finding activity log:`, activityError);
          throw new Error(`Database error: ${activityError.message}`);
        }

        if (recentActivity) {
          await updateActivityJournal(recentActivity.id, whatDone, whatThink);
        } else {
          const durationInSeconds = (new Date(pendingActivityData.endTime).getTime() - new Date(pendingActivityData.startTime).getTime()) / 1000;
          const durationInMinutes = Math.max(1, Math.round(durationInSeconds / 60));
          const currentLocalDate = getCurrentLocalDate(); // YYYY-MM-DD format in user's timezone

          const { data: newActivity, error: createError } = await supabase
            .from('activity_logs')
            .insert({
              user_id: user.id,
              task_id: pendingActivityData.taskId,
              type: 'FOCUS',
              start_time: pendingActivityData.startTime,
              end_time: pendingActivityData.endTime,
              duration_minutes: durationInMinutes,
              local_date: currentLocalDate, // ✅ Use current date instead of selected date
              what_done: whatDone,
              what_think: whatThink,
            })
            .select()
            .single();

          if (createError) {
            console.error(`📱 [${deviceInfo}] Error creating activity log:`, createError);
            throw new Error(`Failed to create activity log: ${createError.message}`);
          }

          // ✅ CRITICAL: Invalidate ActivityLog cache with current date
          await globalMutate(dailySyncKeys.activityLogs(currentLocalDate));
          
          // ✅ FIX: Add small delay to ensure date consistency
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`📱 [${deviceInfo}] Journal save failed (attempt ${retryCount + 1}):`, error);
        
        // ✅ MOBILE FIX: Retry mechanism for mobile devices
        if (isMobile && retryCount < 2) {
          setIsRetrying(true);
          setRetryCount(prev => prev + 1);
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // ✅ FIX: Avoid infinite recursion by calling the logic directly instead of saveJournal
          try {
            if (pendingActivityData.activityId) {
              await updateActivityJournal(
                pendingActivityData.activityId,
                whatDone,
                whatThink
              );
            } else {
              // Re-run the create logic
              const supabase = await createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('User not authenticated');

              const durationInSeconds = (new Date(pendingActivityData.endTime).getTime() - new Date(pendingActivityData.startTime).getTime()) / 1000;
              const durationInMinutes = Math.max(1, Math.round(durationInSeconds / 60));
              const currentLocalDate = getCurrentLocalDate(); // ✅ FIX: Use current date

              const { data: newActivity, error: createError } = await supabase
                .from('activity_logs')
                .insert({
                  user_id: user.id,
                  task_id: pendingActivityData.taskId,
                  type: 'FOCUS',
                  start_time: pendingActivityData.startTime,
                  end_time: pendingActivityData.endTime,
                  duration_minutes: durationInMinutes,
                  local_date: currentLocalDate, // ✅ FIX: Use current date instead of selected date
                  what_done: whatDone,
                  what_think: whatThink,
                })
                .select()
                .single();

              if (createError) {
                throw createError;
              }

              // ✅ CRITICAL: Invalidate ActivityLog cache with current date
              await globalMutate(dailySyncKeys.activityLogs(currentLocalDate));
              
              // ✅ FIX: Add small delay to ensure date consistency
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            setIsRetrying(false);
            return;
          } catch (retryError) {
            console.error(`📱 [${deviceInfo}] Retry failed:`, retryError);
            setIsRetrying(false);
            throw retryError;
          }
        }
        
        // ✅ MOBILE FIX: Better error message for mobile users
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to save journal: ${errorMessage}`);
      }
    }
    
    closeJournalModal();
  }, [pendingActivityData, closeJournalModal, retryCount, updateJournalData]);

  return {
    isJournalModalOpen,
    pendingActivityData,
    openJournalModal,
    closeJournalModal,
    saveJournal,
    isRetrying,
    retryCount,
  };
};
