'use client';

import { useState, useCallback } from 'react';
import { updateActivityJournal, logActivityWithJournal } from '../actions/journalActions';
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
      // Find the most recent activity log for this task and time
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

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

      console.log('Searching for recent activity:', {
        taskId: pendingActivityData.taskId,
        startTime: pendingActivityData.startTime,
        endTime: pendingActivityData.endTime,
        found: recentActivity,
        error
      });

      if (error) {
        console.error('Error finding recent activity:', error);
        throw error;
      }

      if (recentActivity) {
        console.log('Updating existing activity log with journal data:', recentActivity.id);
        // Update the existing activity log with journal data
        await updateActivityJournal(recentActivity.id, whatDone, whatThink);
      } else {
        // Fallback: create new activity log with journal data
        const formData = new FormData();
        formData.append('taskId', pendingActivityData.taskId);
        formData.append('sessionType', 'FOCUS');
        formData.append('date', pendingActivityData.date);
        formData.append('startTime', pendingActivityData.startTime);
        formData.append('endTime', pendingActivityData.endTime);
        formData.append('whatDone', whatDone);
        formData.append('whatThink', whatThink);

        await logActivityWithJournal(formData);
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
