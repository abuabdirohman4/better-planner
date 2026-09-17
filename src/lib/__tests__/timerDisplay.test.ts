// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  formatTime,
  getFocusDuration,
  getTotalSeconds,
  getProgress,
  SHORT_BREAK_DURATION,
  MEDIUM_BREAK_DURATION,
  LONG_BREAK_DURATION,
  DEFAULT_FOCUS_DURATION,
} from '../timerDisplay'
import type { TimerTask } from '@/types/timer'

const task = (mins: number | undefined) => ({ id: 't', title: 'x', focus_duration: mins } as TimerTask)

describe('formatTime', () => {
  it('pads both parts', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(1500)).toBe('25:00')
  })

  it('clamps negatives rather than printing a minus', () => {
    expect(formatTime(-5)).toBe('00:00')
  })

  it('keeps counting past an hour in minutes', () => {
    expect(formatTime(3725)).toBe('62:05')
  })
})

describe('getFocusDuration', () => {
  it('prefers the active task', () => {
    expect(getFocusDuration(task(50), task(10))).toBe(3000)
  })

  it('falls back to the last task, then the default', () => {
    expect(getFocusDuration(null, task(10))).toBe(600)
    expect(getFocusDuration(null, null)).toBe(DEFAULT_FOCUS_DURATION)
  })

  it('treats a zero/absent duration as unset', () => {
    expect(getFocusDuration(task(undefined), null)).toBe(DEFAULT_FOCUS_DURATION)
    expect(getFocusDuration(task(0), task(10))).toBe(600)
  })
})

describe('getTotalSeconds', () => {
  it('uses focus length while focusing', () => {
    expect(getTotalSeconds('FOCUSING', null, 1500)).toBe(1500)
  })

  it('uses the matching break length for each break type', () => {
    expect(getTotalSeconds('BREAK', 'SHORT', 1500)).toBe(SHORT_BREAK_DURATION)
    expect(getTotalSeconds('BREAK', 'MEDIUM', 1500)).toBe(MEDIUM_BREAK_DURATION)
    expect(getTotalSeconds('BREAK', 'LONG', 1500)).toBe(LONG_BREAK_DURATION)
  })

  it('a paused break still measures against the break length', () => {
    expect(getTotalSeconds('PAUSED', 'SHORT', 1500)).toBe(SHORT_BREAK_DURATION)
  })

  it('a paused focus session measures against focus length', () => {
    expect(getTotalSeconds('PAUSED', null, 1500)).toBe(1500)
  })

  it('idle falls back to focus length', () => {
    expect(getTotalSeconds('IDLE', null, 1500)).toBe(1500)
  })
})

describe('getProgress', () => {
  it('is the elapsed fraction while running', () => {
    expect(getProgress('FOCUSING', 750, 1500)).toBe(0.5)
  })

  it('never exceeds 1 when elapsed overshoots', () => {
    expect(getProgress('FOCUSING', 2000, 1500)).toBe(1)
  })

  it('reads full when idle', () => {
    expect(getProgress('IDLE', 0, 1500)).toBe(1)
  })

  it('does not divide by zero', () => {
    expect(getProgress('FOCUSING', 10, 0)).toBe(1)
  })
})
