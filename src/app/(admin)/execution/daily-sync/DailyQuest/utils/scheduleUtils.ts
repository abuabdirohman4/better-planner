import { TaskSchedule } from "../types";

export const SESSION_DURATION_MINUTES = 25; // Default Pomodoro duration

export function calculateEndTime(
  startTime: string,
  sessionCount: number,
  focusDuration: number = SESSION_DURATION_MINUTES
): string {
  const start = new Date(startTime);
  const totalMinutes = sessionCount * focusDuration;
  const end = new Date(start.getTime() + totalMinutes * 60000);
  return end.toISOString();
}

export function detectConflicts(
  newSchedule: { startTime: string; endTime: string },
  existingSchedules: TaskSchedule[],
  excludeScheduleId?: string
): boolean {
  const newStart = new Date(newSchedule.startTime).getTime();
  const newEnd = new Date(newSchedule.endTime).getTime();

  return existingSchedules.some((schedule) => {
    if (excludeScheduleId && schedule.id === excludeScheduleId) return false;

    const existingStart = new Date(schedule.scheduled_start_time).getTime();
    const existingEnd = new Date(schedule.scheduled_end_time).getTime();

    return newStart < existingEnd && newEnd > existingStart;
  });
}

export function validateTotalSessions(
  newSessionCount: number,
  existingSchedules: TaskSchedule[],
  dailyTarget: number,
  excludeScheduleId?: string
): boolean {
  const currentTotal = existingSchedules.reduce((sum, schedule) => {
    if (excludeScheduleId && schedule.id === excludeScheduleId) return sum;
    return sum + schedule.session_count;
  }, 0);

  return currentTotal + newSessionCount <= dailyTarget;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function getRemainingSessions(
  schedules: TaskSchedule[],
  target: number
): number {
  const scheduled = schedules.reduce((sum, s) => sum + s.session_count, 0);
  return Math.max(0, target - scheduled);
}
