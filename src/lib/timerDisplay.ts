import type { TimerState, TimerTask } from '@/types/timer'

const isDev = process.env.NODE_ENV === 'development'

export const SHORT_BREAK_DURATION = isDev ? 30 : 5 * 60
export const MEDIUM_BREAK_DURATION = isDev ? 45 : 10 * 60
export const LONG_BREAK_DURATION = isDev ? 60 : 15 * 60
export const DEFAULT_FOCUS_DURATION = 25 * 60

export type BreakType = 'SHORT' | 'MEDIUM' | 'LONG' | null

export const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`
}

const BREAK_DURATIONS: Record<Exclude<BreakType, null>, number> = {
  SHORT: SHORT_BREAK_DURATION,
  MEDIUM: MEDIUM_BREAK_DURATION,
  LONG: LONG_BREAK_DURATION,
}

/** Focus length for the active task, falling back to the last one, then the default. */
export function getFocusDuration(activeTask: TimerTask | null, lastActiveTask: TimerTask | null): number {
  if (activeTask?.focus_duration) return activeTask.focus_duration * 60
  if (lastActiveTask?.focus_duration) return lastActiveTask.focus_duration * 60
  return DEFAULT_FOCUS_DURATION
}

/**
 * Total length of whatever is currently counting. A break length wins whenever
 * breakType is set — PAUSED alone does not say which kind of session was paused.
 */
export function getTotalSeconds(
  timerState: TimerState,
  breakType: BreakType,
  focusDuration: number
): number {
  if (breakType && (timerState === 'BREAK' || timerState === 'PAUSED')) {
    return BREAK_DURATIONS[breakType]
  }
  return focusDuration
}

/** 0..1, clamped. Idle reads as full so the ring renders complete rather than empty. */
export function getProgress(timerState: TimerState, secondsElapsed: number, totalSeconds: number): number {
  const running = timerState === 'FOCUSING' || timerState === 'BREAK' || timerState === 'PAUSED'
  if (!running || totalSeconds <= 0) return 1
  return Math.min(1, Math.max(0, secondsElapsed / totalSeconds))
}
