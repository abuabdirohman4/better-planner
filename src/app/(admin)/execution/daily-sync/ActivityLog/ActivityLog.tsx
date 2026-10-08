'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useActivityStore } from '@/stores/activityStore';
import { useTimerStore } from '@/stores/timerStore';
import { notifyActivityLogsChanged } from '@/lib/swr';
import { useActivityLogs } from './hooks/useActivityLogs';
import HourlyTimeline, { type CycleChip } from './components/HourlyTimeline';
import { hourWIB } from './actions/hourly-notes/logic';
import { useScheduledTasks } from '../DailyQuest/hooks/useScheduledTasks';
import { deleteActivityLog } from './actions/activityLoggingActions';

interface ActivityLogProps {
  date: string;
  refreshKey?: number;
}

/** Kartu Timeline Harian (app-6god): catatan per jam + chip siklus; satu tampilan saja. */
const ActivityLog: React.FC<ActivityLogProps> = ({ date, refreshKey }) => {
  const [dynamicHeight, setDynamicHeight] = useState('auto');

  const { lastActivityTimestamp } = useActivityStore();
  const { logs, isLoading, error, mutate } = useActivityLogs({ date, refreshKey, lastActivityTimestamp });

  const handleDeleteLog = async (logId: string) => {
    // Optimistic Update
    const previousLogs = logs;
    mutate(logs.filter(l => l.id !== logId), false);

    try {
      await deleteActivityLog(logId);
      toast.success('Activity log dihapus');
      notifyActivityLogsChanged();
    } catch {
      toast.error('Gagal menghapus activity log');
      // Rollback on error
      mutate(previousLogs, false);
    }
  };

  const { scheduledTasks } = useScheduledTasks(date);

  // Dynamic height calculation
  useEffect(() => {
    const calculateHeight = () => {
      try {
        // Check if screen size is md or above
        const isMdAndAbove = window.innerWidth >= 768;
        if (!isMdAndAbove) {
          return;
        }

        // Get Main Quest + Side Quest + Pomodoro Timer
        const mainQuestCard = document.querySelector('.main-quest-card');
        const sideQuestCard = document.querySelector('.side-quest-card');
        const workQuestCard = document.querySelector('.work-quest-card');
        const dailyQuestCard = document.querySelector('.daily-quest-card');
        const pomodoroTimer = document.querySelector('.pomodoro-timer');

        // Get viewport height
        const mainQuestHeight = mainQuestCard ? mainQuestCard.getBoundingClientRect().height : 0;
        const sideQuestHeight = sideQuestCard ? sideQuestCard.getBoundingClientRect().height : 0;
        const workQuestHeight = workQuestCard ? workQuestCard.getBoundingClientRect().height : 0;
        const dailyQuestHeight = dailyQuestCard ? dailyQuestCard.getBoundingClientRect().height : 0;
        const pomodoroHeight = pomodoroTimer ? pomodoroTimer.getBoundingClientRect().height : 0;

        // Calculate heights
        const finalHeight = (mainQuestHeight + sideQuestHeight + workQuestHeight + dailyQuestHeight) - pomodoroHeight - 72;

        // Set dynamic height based on available space
        setDynamicHeight(`${finalHeight}px`);

      } catch (error) {
        console.warn('Error calculating dynamic height:', error);
      }
    };

    setTimeout(calculateHeight, 100);
    window.addEventListener('resize', calculateHeight);

    return () => window.removeEventListener('resize', calculateHeight);
  }, [date]);

  // Siklus yang sedang berjalan belum punya baris log, jadi chip-nya diambil dari timer.
  const timerState = useTimerStore(s => s.timerState);
  const activeTask = useTimerStore(s => s.activeTask);
  const timerStartTime = useTimerStore(s => s.startTime);
  const secondsElapsed = useTimerStore(s => s.secondsElapsed);

  const chips: CycleChip[] = useMemo(() => {
    const list: CycleChip[] = (Array.isArray(logs) ? logs : [])
      .filter(log => log.type === 'FOCUS')
      .map(log => ({
        id: log.id,
        hour: hourWIB(log.start_time),
        title: log.task_title || 'Siklus',
        minutes: log.duration_minutes,
      }));
    if ((timerState === 'FOCUSING' || timerState === 'PAUSED') && activeTask && timerStartTime) {
      list.push({
        id: 'live-session',
        hour: hourWIB(timerStartTime),
        title: activeTask.title,
        minutes: Math.max(1, Math.round(secondsElapsed / 60)),
        live: true,
      });
    }
    return list;
  }, [logs, timerState, activeTask, timerStartTime, secondsElapsed]);

  const plans = useMemo(() => {
    const byHour: Record<number, string> = {};
    (scheduledTasks || []).forEach((schedule: any) => {
      const h = hourWIB(schedule.scheduled_start_time);
      const title = schedule.daily_plan_item?.title || 'Rencana';
      byHour[h] = byHour[h] ? `${byHour[h]} · ${title}` : title;
    });
    return byHour;
  }, [scheduledTasks]);

  return (
    <div className="bg-white dark:bg-gray-800 flex flex-col" style={{ height: dynamicHeight }}>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center py-8">
            Error loading activity logs: {error}
          </div>
        ) : (
          <HourlyTimeline date={date} chips={chips} plans={plans} onDeleteChip={handleDeleteLog} />
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
