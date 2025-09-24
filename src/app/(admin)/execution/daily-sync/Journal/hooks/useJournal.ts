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

    if (pendingActivityData.activityId) {
      // Update existing activity log
      await updateActivityJournal(
        pendingActivityData.activityId,
        whatDone,
        whatThink
      );
    } else {
      // ✅ FIX: Use new function to handle multiple device journal input
      try {
        // First, try to find activity log using new function
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get session ID from timer_sessions
        const { data: session, error: sessionError } = await supabase
          .from('timer_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('task_id', pendingActivityData.taskId)
          .eq('start_time', pendingActivityData.startTime)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sessionError) {
          console.error('Error finding session:', sessionError);
          throw sessionError;
        }

        if (session) {
          // Get activity log ID using new function
          const activityLogId = await getActivityLogId(session.id);
          
          if (activityLogId) {
            // Update journal using new function
            await updateActivityLogJournal(activityLogId, whatDone, whatThink);
            console.log('✅ Journal updated using new function:', activityLogId);
          } else {
            // Fallback to old method
            console.log('⚠️ No activity log found, using fallback method');
            const { data: recentActivity, error } = await supabase
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

            if (recentActivity) {
              await updateActivityJournal(recentActivity.id, whatDone, whatThink);
            } else {
              throw new Error('No activity log found');
            }
          }
        } else {
          console.log('⚠️ No session found, using fallback method');
          const { data: recentActivity, error } = await supabase
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

          if (recentActivity) {
            await updateActivityJournal(recentActivity.id, whatDone, whatThink);
          } else {
            throw new Error('No activity log found');
          }
        }
      } catch (newMethodError) {
        console.error('Error with new journal method, using fallback:', newMethodError);
        // Fallback to old method
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: recentActivity, error: fallbackError } = await supabase
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

        if (recentActivity) {
          await updateActivityJournal(recentActivity.id, whatDone, whatThink);
        } else {
          throw new Error('No activity log found');
        }
      }
    }

    closeJournalModal();
  }, [pendingActivityData, closeJournalModal]);

  return {
    isJournalModalOpen,
    pendingActivityData,
    openJournalModal,
    closeJournalModal,
    saveJournal,
  };
};
