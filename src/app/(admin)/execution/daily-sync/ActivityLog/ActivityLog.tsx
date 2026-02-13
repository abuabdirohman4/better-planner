'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useActivityStore } from '@/stores/activityStore';
import { useActivityLogs, ActivityLogItem } from './hooks/useActivityLogs';
import { formatTimeRange } from '@/lib/dateUtils';
import CalendarView, { CalendarEvent } from './components/CalendarView';
import { useScheduledTasks } from '../DailyQuest/hooks/useScheduledTasks';
import { updateSchedule, createSchedule } from '../DailyQuest/actions/scheduleActions';
import { SESSION_DURATION_MINUTES } from '../DailyQuest/utils/scheduleUtils';
import { ScheduleManagementModal } from '../DailyQuest/components/ScheduleManagementModal';
import { DailyPlanItem } from '../DailyQuest/types';

interface ActivityLogProps {
  date: string;
  refreshKey?: number;
  onScheduleChange?: () => void;
  onCalendarModeChange?: (mode: 'BOTH' | 'PLAN' | 'ACTUAL') => void;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
}

// Komponen untuk menampilkan journal entry
const JournalEntry: React.FC<{ log: ActivityLogItem; viewMode?: 'GROUPED' | 'TIMELINE' | 'CALENDAR' }> = ({ log, viewMode = 'GROUPED' }) => {
  if (!log.what_done && !log.what_think) return null;

  return (
    <div className={`mt-2 p-3 ${viewMode === 'GROUPED' ? 'bg-blue-50' : ''} rounded-lg border border-blue-200`}>
      {log.what_done && (
        <>
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apa yang diselesaikan:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2 border">
              {log.what_done}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yang masih dipikirkan:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2 border">
              {log.what_think || '-'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Komponen collapsible untuk setiap log item
const CollapsibleLogItem: React.FC<{ log: ActivityLogItem; showTaskTitle?: boolean; viewMode?: 'GROUPED' | 'TIMELINE' | 'CALENDAR' }> = ({ log, showTaskTitle = false, viewMode = 'GROUPED' }) => {
  const [isExpanded, setIsExpanded] = useState(viewMode === 'TIMELINE');
  const hasJournalEntry = log.what_done || log.what_think;

  return (
    <div className={`${isExpanded && viewMode === 'GROUPED' ? 'bg-blue-50 rounded-lg border border-blue-200' : ''} rounded px-2 py-1`}>
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 rounded transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Triangle indicator */}
        <div className="shrink-0">
          {hasJournalEntry ? (
            <svg
              className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="text-sm py-1 text-gray-500">
            {formatTimeRange(log.start_time, log.end_time)} &bull; {formatDuration(log.duration_minutes)}
            {showTaskTitle && log.task_title && (
              <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium">
                ({log.task_title})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && hasJournalEntry && (
        <div className="mt-2 ml-6">
          <JournalEntry log={log} viewMode={viewMode} />
        </div>
      )}
    </div>
  );
};

const ActivityLog: React.FC<ActivityLogProps> = ({ date, refreshKey, onScheduleChange, onCalendarModeChange }) => {
  type ViewMode = 'GROUPED' | 'TIMELINE' | 'CALENDAR';
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');
  const [calendarMode, setCalendarMode] = useState<'BOTH' | 'PLAN' | 'ACTUAL'>('BOTH');

  const handleCalendarModeChange = (mode: 'BOTH' | 'PLAN' | 'ACTUAL') => {
    setCalendarMode(mode);
    onCalendarModeChange?.(mode);
  };
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [dynamicHeight, setDynamicHeight] = useState('auto');

  const { logs, isLoading, error } = useActivityLogs({ date, refreshKey });
  const { scheduledTasks, mutate: mutateSchedules } = useScheduledTasks(date);
  const [selectedScheduleTask, setSelectedScheduleTask] = useState<DailyPlanItem | null>(null);

  // Handle schedule click to open edit/delete modal
  const handleScheduleClick = (scheduleData: any) => {
    const dailyPlanItem = scheduleData.daily_plan_item;
    if (dailyPlanItem) {
      setSelectedScheduleTask({
        id: dailyPlanItem.id || scheduleData.daily_plan_item_id,
        item_id: dailyPlanItem.item_id || '',
        item_type: dailyPlanItem.item_type || 'MAIN_QUEST',
        status: dailyPlanItem.status || 'TODO',
        title: dailyPlanItem.title || 'Task',
        // ✅ CHECKLIST FIX: Preserve focus_duration=0 for checklist, don't fallback to 25
        focus_duration: dailyPlanItem.focus_duration !== undefined
          ? dailyPlanItem.focus_duration
          : SESSION_DURATION_MINUTES,
        daily_session_target: dailyPlanItem.daily_session_target || 3,
      } as DailyPlanItem);
    }
  };

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

  // Merge logs + schedules into CalendarEvent[]
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Add activity logs (ACTUAL)
    if (calendarMode !== 'PLAN') {
      const safeLogs = Array.isArray(logs) ? logs : [];
      safeLogs.forEach(log => {
        events.push({
          id: log.id,
          type: 'LOG',
          subType: log.type as any,
          title: log.task_title || 'Activity',
          startTime: log.start_time,
          endTime: log.end_time,
          duration: log.duration_minutes,
          itemType: log.task_type,
          data: log,
        });
      });
    }

    // Add scheduled tasks (PLAN)
    if (calendarMode !== 'ACTUAL') {
      (scheduledTasks || []).forEach((schedule: any) => {
        const title = schedule.daily_plan_item?.title || 'Scheduled Task';
        const focusDuration = schedule.daily_plan_item?.focus_duration || SESSION_DURATION_MINUTES;
        const dailyTarget = schedule.daily_plan_item?.daily_session_target || 4;
        const maxDuration = dailyTarget * focusDuration;

        events.push({
          id: schedule.id,
          type: 'SCHEDULE',
          title,
          startTime: schedule.scheduled_start_time,
          endTime: schedule.scheduled_end_time,
          duration: schedule.duration_minutes,
          itemType: schedule.daily_plan_item?.item_type,
          data: schedule,
          maxDuration,
        });
      });
    }

    return events;
  }, [logs, scheduledTasks, calendarMode]);

  // Handle schedule update from drag (with optimistic update)
  const handleScheduleUpdate = async (
    scheduleId: string,
    newStartTime: string,
    newEndTime: string,
    newDuration: number
  ) => {
    try {
      const sessionCount = Math.max(1, Math.round(newDuration / SESSION_DURATION_MINUTES));

      // Optimistic update: immediately update UI before server response
      mutateSchedules(
        async (currentData) => {
          // Update schedule in local data
          if (!currentData) return currentData;

          return currentData.map((schedule: any) => {
            if (schedule.id === scheduleId) {
              return {
                ...schedule,
                scheduled_start_time: newStartTime,
                scheduled_end_time: newEndTime,
                duration_minutes: newDuration,
                session_count: sessionCount,
              };
            }
            return schedule;
          });
        },
        {
          // Don't revalidate immediately, let the update complete first
          revalidate: false,
        }
      );

      // Send to server
      await updateSchedule(scheduleId, newStartTime, newEndTime, newDuration, sessionCount);

      // Revalidate from server after successful update
      mutateSchedules();
      onScheduleChange?.();
    } catch (error) {
      console.error('Failed to update schedule:', error);
      // Revert optimistic update on error
      mutateSchedules();
    }
  };

  // Handle task drop from quest card
  const handleTaskDrop = async (taskData: any, startMinutes: number) => {
    try {
      const hours = Math.floor(startMinutes / 60);
      const mins = startMinutes % 60;
      const startDate = new Date(date + 'T00:00:00');
      startDate.setHours(hours, mins, 0, 0);

      const focusDuration = taskData.focusDuration || SESSION_DURATION_MINUTES;
      const sessionCount = taskData.sessionCount || 1;
      const totalDuration = sessionCount * focusDuration;
      const endDate = new Date(startDate.getTime() + totalDuration * 60000);

      console.log('Creating schedule:', {
        taskId: taskData.dailyPlanItemId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: totalDuration,
        sessionCount,
        focusDuration,
      });

      await createSchedule(
        taskData.dailyPlanItemId,
        startDate.toISOString(),
        endDate.toISOString(),
        totalDuration,
        sessionCount
      );

      console.log('Schedule created successfully');
      mutateSchedules();
      onScheduleChange?.();
    } catch (error) {
      console.error('Failed to create schedule from drop:', error);
      toast.error('Failed to create schedule: ' + (error as Error).message);
    }
  };

  // Group logs by task_id
  const safeLogs = Array.isArray(logs) ? logs : [];
  const grouped = safeLogs.reduce((acc, log) => {
    if (!log.task_id) return acc;
    if (!acc[log.task_id]) {
      acc[log.task_id] = {
        title: log.task_title || 'Task',
        sessions: [],
        totalMinutes: 0,
      };
    }
    acc[log.task_id].sessions.push(log);
    acc[log.task_id].totalMinutes += log.duration_minutes;
    return acc;
  }, {} as Record<string, { title: string; sessions: ActivityLogItem[]; totalMinutes: number }>);
  const summary = Object.values(grouped);

  // Sort logs for Timeline view
  const timelineLogs = [...safeLogs].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
  });

  const formatTotal = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} hrs${m > 0 ? ' ' + m + ' mins' : ''}` : `${m} mins`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 flex flex-col" style={{ height: dynamicHeight }}>
      {/* View Toggle Header */}
      <div className="flex items-center gap-2 absolute right-[68px] top-[20px]">
        {viewMode === 'TIMELINE' && (
          <button
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
            title={sortOrder === 'ASC' ? 'Oldest First' : 'Newest First'}
          >
            {sortOrder === 'ASC' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h5m4 0v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        )}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('CALENDAR')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'CALENDAR'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('TIMELINE')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'TIMELINE'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('GROUPED')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'GROUPED'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            Quest
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 1 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 bg-white dark:bg-gray-800 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="space-y-1 ml-2">
                  {Array.from({ length: 2 + (index % 3) }).map((_, sessionIndex) => (
                    <div key={`session-${sessionIndex}`} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center py-8">
            Error loading activity logs: {error}
          </div>
        ) : viewMode === 'CALENDAR' ? (
          <div className="h-full min-h-0">
            <CalendarView
              items={calendarEvents}
              currentDate={date}
              calendarMode={calendarMode}
              onCalendarModeChange={handleCalendarModeChange}
              onScheduleUpdate={handleScheduleUpdate}
              onScheduleClick={handleScheduleClick}
              onTaskDrop={handleTaskDrop}
            />
            {/* Schedule click modal */}
            {selectedScheduleTask && (
              <ScheduleManagementModal
                isOpen={!!selectedScheduleTask}
                onClose={() => setSelectedScheduleTask(null)}
                task={selectedScheduleTask}
                selectedDate={date}
                onScheduleChange={() => {
                  mutateSchedules();
                  onScheduleChange?.();
                }}
              />
            )}
          </div>
        ) : summary.length === 0 && safeLogs.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            Belum ada aktivitas tercatat hari ini.
          </div>
        ) : (
          <div className="space-y-4 h-full">
            {viewMode === 'GROUPED' ? (
              summary.map((item: { title: string; sessions: ActivityLogItem[]; totalMinutes: number }) => (
                <div key={`summary-${item.title}`} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 bg-white dark:bg-gray-800">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{item.title}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block bg-brand-100 text-brand-700 px-2 py-1 rounded-full text-xs font-semibold">
                      {item.sessions.length} sessions
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-300">({formatTotal(item.totalMinutes)})</span>
                  </div>
                  <div className="space-y-1 ml-2">
                    {item.sessions.map((log: ActivityLogItem) => (
                      <CollapsibleLogItem key={log.id} log={log} viewMode={viewMode} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Timeline View
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {timelineLogs.map((log) => (
                  <CollapsibleLogItem key={log.id} log={log} showTaskTitle={true} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
