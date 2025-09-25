'use client';

import { useState, useCallback } from 'react';
import { updateActivityJournal, logActivityWithJournal } from '../actions/journalActions';
import { getActivityLogId, updateActivityLogJournal } from '../../PomodoroTimer/actions/timerSessionActions';
import { JournalData } from '../types';
import { createClient } from '@/lib/supabase/client';

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

  const saveJournal = useCallback(async (journalData: JournalData) => {
    if (!pendingActivityData) {
      throw new Error('No pending activity data');
    }

    const { whatDone, whatThink } = journalData;

    // ✅ MOBILE FIX: Detect mobile device for better error handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceInfo = isMobile ? 'Mobile' : 'Desktop';

    console.log(`📱 [${deviceInfo}] Starting journal save for task:`, pendingActivityData.taskId);

    if (pendingActivityData.activityId) {
      // Update existing activity log
      console.log(`📱 [${deviceInfo}] Updating existing activity log:`, pendingActivityData.activityId);
      await updateActivityJournal(
        pendingActivityData.activityId,
        whatDone,
        whatThink
      );
    } else {
      // ✅ MOBILE FIX: Simplified approach for mobile devices
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        console.log(`📱 [${deviceInfo}] Looking for activity log with data:`, {
          taskId: pendingActivityData.taskId,
          startTime: pendingActivityData.startTime,
          endTime: pendingActivityData.endTime
        });

        // ✅ MOBILE FIX: Direct approach - find activity log directly
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

        if (activityError) {
          console.error(`📱 [${deviceInfo}] Error finding activity log:`, activityError);
          
          // ✅ MOBILE FIX: Try alternative search without exact time match
          console.log(`📱 [${deviceInfo}] Trying alternative search...`);
          const { data: alternativeActivity, error: altError } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('task_id', pendingActivityData.taskId)
            .eq('type', 'FOCUS')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (altError) {
            console.error(`📱 [${deviceInfo}] Alternative search also failed:`, altError);
            throw new Error(`No activity log found for this session. Please try again.`);
          }

          if (alternativeActivity) {
            console.log(`📱 [${deviceInfo}] Found activity log via alternative search:`, alternativeActivity.id);
            await updateActivityJournal(alternativeActivity.id, whatDone, whatThink);
          } else {
            throw new Error('No activity log found for this session');
          }
        } else if (recentActivity) {
          console.log(`📱 [${deviceInfo}] Found activity log:`, recentActivity.id);
          await updateActivityJournal(recentActivity.id, whatDone, whatThink);
        } else {
          throw new Error('No activity log found for this session');
        }
      } catch (error) {
        console.error(`📱 [${deviceInfo}] Journal save failed (attempt ${retryCount + 1}):`, error);
        
        // ✅ MOBILE FIX: Retry mechanism for mobile devices
        if (isMobile && retryCount < 2) {
          console.log(`📱 [${deviceInfo}] Retrying journal save... (${retryCount + 1}/2)`);
          setIsRetrying(true);
          setRetryCount(prev => prev + 1);
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry the save
          const result = await saveJournal(journalData);
          setIsRetrying(false);
          return result;
        }
        
        // ✅ MOBILE FIX: Better error message for mobile users
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to save journal: ${errorMessage}`);
      }
    }

    console.log(`📱 [${deviceInfo}] Journal saved successfully!`);
    closeJournalModal();
  }, [pendingActivityData, closeJournalModal, retryCount]);

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
