'use client';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import useSWR from 'swr';

import { useActivityStore } from '@/stores/activityStore';
import { useTimerStore } from '@/stores/timerStore';
import { notifyActivityLogsChanged } from '@/lib/swr';
import { useActivityLogs } from './hooks/useActivityLogs';
import HourlyTimeline, { type CycleChip } from './components/HourlyTimeline';
import { hourWIB } from './actions/hourly-notes/logic';
import { useScheduledTasks } from '../DailyQuest/hooks/useScheduledTasks';
import { deleteActivityLog } from './actions/activityLoggingActions';
import { getTimelineData } from './actions/calendar/actions';
import { DEFAULT_FIRST_HOUR, DEFAULT_LAST_HOUR } from './actions/hourly-notes/logic';

interface ActivityLogProps {
  date: string;
  refreshKey?: number;
}

/** Kartu Timeline Harian (app-6god): catatan per jam + chip siklus; satu tampilan saja. */
const ActivityLog: React.FC<ActivityLogProps> = ({ date, refreshKey }) => {

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
  const { data: timeline, mutate: mutateTimeline } = useSWR(['timeline-data-v2', date], () => getTimelineData(date), {
    revalidateOnFocus: false,
    refreshInterval: 15 * 60 * 1000, // acara Google Calendar ikut cache server 15 menit
  });
  const [refreshing, setRefreshing] = useState(false);
  const refreshCalendar = async () => {
    setRefreshing(true);
    try {
      await mutateTimeline(getTimelineData(date, true), { revalidate: false });
    } catch {
      toast.error('Gagal memuat ulang Google Calendar');
    } finally {
      setRefreshing(false);
    }
  };

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
        start: log.start_time,
        title: log.task_title || 'Siklus',
        minutes: log.duration_minutes,
      }));
    if ((timerState === 'FOCUSING' || timerState === 'PAUSED') && activeTask && timerStartTime) {
      list.push({
        id: 'live-session',
        hour: hourWIB(timerStartTime),
        start: timerStartTime,
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
    <div className="bg-white dark:bg-gray-800 flex flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Timeline Harian</h3>
        {timeline && timeline.calendars.length === 0 && (
          <Link href="/settings/profile#timeline" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300">
            + Google Calendar
          </Link>
        )}
        {timeline && timeline.calendars.length > 0 && (
          <span className="flex flex-col items-end">
          <button
            type="button"
            data-testid="calendar-refresh"
            onClick={refreshCalendar}
            disabled={refreshing}
            title="Acara Google Calendar diperbarui otomatis tiap 15 menit. Klik untuk ambil yang terbaru sekarang."
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-600 disabled:opacity-50 dark:text-gray-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memuat…' : 'Perbarui'}
          </button>
          <span className="text-[11px] text-gray-400">Otomatis tiap 15 menit</span>
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center py-8">
            Error loading activity logs: {error}
          </div>
        ) : (
          <>
            {timeline?.calendarError && (
              <p className="mb-2 text-xs text-amber-600">Sebagian Google Calendar gagal dibaca; cek di Settings.</p>
            )}
            <HourlyTimeline
              date={date}
              chips={chips}
              plans={plans}
              onDeleteChip={handleDeleteLog}
              events={timeline?.events ?? []}
              startHour={timeline?.startHour ?? DEFAULT_FIRST_HOUR}
              endHour={timeline?.endHour ?? DEFAULT_LAST_HOUR}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
