import { useMemo } from 'react';
import { useUnscheduledTasks, useScheduledTasksForWeek } from '@/hooks/execution/useWeeklySync';
import { getWeekDates } from '@/lib/dateUtils';
import type { Task } from '../types';

export function useTaskData(year: number, quarter: number, currentWeek: Date) {
  // Memoize weekDates to prevent infinite re-renders
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);

  // SWR hooks for data fetching
  const { unscheduledTasks, isLoading: unscheduledLoading } = useUnscheduledTasks(year, quarter);
  const { scheduledTasks, isLoading: scheduledLoading } = useScheduledTasksForWeek(startDate, endDate);

  // Process scheduled tasks into grouped format
  const weekTasks = useMemo(() => {
    const grouped: { [date: string]: Task[] } = {};
    weekDates.forEach((d) => {
      const key = d.toISOString().slice(0, 10);
      grouped[key] = [];
    });
    scheduledTasks.forEach((task: Task) => {
      const key = task.scheduled_date?.slice(0, 10);
      if (key && grouped[key]) grouped[key].push(task);
    });
    return grouped;
  }, [scheduledTasks, weekDates]);

  const loading = unscheduledLoading || scheduledLoading;

  return { 
    taskPool: unscheduledTasks, 
    setTaskPool: () => {}, // SWR handles updates automatically
    weekTasks, 
    setWeekTasks: () => {}, // SWR handles updates automatically
    loading, 
    weekDates 
  };
}
