import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatLocalDate, nowInUserTimezone, getYesterday } from '../utils/periodUtils'

/**
 * Regression: cron runs 0 23 * * * UTC = 06:00 WIB. Formatting the target day
 * with toISOString() picked the UTC date, landing the report two days back
 * (reported 2026-08-17 = 0/3 instead of 2026-08-18 = 3/7).
 */
describe('WIB date handling', () => {
  afterEach(() => vi.useRealTimers())

  const atCronFire = () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-18T23:00:00Z')) // 06:00 WIB on the 19th
  }

  it('resolves WIB "today" across the UTC day boundary', () => {
    atCronFire()
    expect(formatLocalDate(nowInUserTimezone())).toBe('2026-08-19')
  })

  it('targets the previous WIB day, not two days back', () => {
    atCronFire()
    expect(formatLocalDate(getYesterday())).toBe('2026-08-18')
  })

  it('does not drift at midday WIB', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T05:00:00Z')) // 12:00 WIB
    expect(formatLocalDate(getYesterday())).toBe('2026-08-18')
  })

  it('handles month boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T23:00:00Z')) // 06:00 WIB Sep 1
    expect(formatLocalDate(nowInUserTimezone())).toBe('2026-09-01')
    expect(formatLocalDate(getYesterday())).toBe('2026-08-31')
  })
})
