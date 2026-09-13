// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeDue, zonedTimeToUtc, type DueInput } from '../services/pushDue'

const WIB = 'Asia/Jakarta'
// 2026-09-10 06:00 WIB = 2026-09-09 23:00 UTC
const NOW = new Date('2026-09-09T23:00:30Z')

const user = (over: Partial<DueInput['users'][number]> = {}) => ({
  user_id: 'u1',
  timezone: WIB,
  push: { enabled: true, timer: true, habits: true, schedules: true, dailySync: true, recap: true, morningTime: '05:30', eveningTime: '21:00' },
  ...over,
})

const base = (over: Partial<DueInput> = {}): DueInput => ({
  now: NOW,
  users: [user()],
  timers: [],
  habits: [],
  schedules: [],
  ...over,
})

describe('zonedTimeToUtc', () => {
  it('converts WIB wall-clock to UTC instant', () => {
    expect(zonedTimeToUtc('2026-09-10', '06:00', WIB).toISOString()).toBe('2026-09-09T23:00:00.000Z')
  })
  it('UTC zone is identity', () => {
    expect(zonedTimeToUtc('2026-09-10', '06:00', 'UTC').toISOString()).toBe('2026-09-10T06:00:00.000Z')
  })
})

describe('computeDue — timer', () => {
  const timer = (startIso: string, secs = 1500) => ({
    id: 't1', user_id: 'u1', task_title: 'Deep work', start_time: startIso, target_duration_seconds: secs, status: 'FOCUSING',
  })

  it('fires when start+duration lands inside window', () => {
    // ends 23:00:00Z, now 23:00:30Z → inside
    const due = computeDue(base({ timers: [timer('2026-09-09T22:35:00Z')] }))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ userId: 'u1', kind: 'timer', refKey: 't1' })
    expect(due[0].payload.body).toContain('Deep work')
  })

  it('does not fire when end is in the future', () => {
    expect(computeDue(base({ timers: [timer('2026-09-09T22:50:00Z')] }))).toHaveLength(0)
  })

  it('does not fire when end is older than window', () => {
    // ends 22:57:00Z, window starts 22:58:30Z
    expect(computeDue(base({ timers: [timer('2026-09-09T22:32:00Z')] }))).toHaveLength(0)
  })

  it('ignores non-FOCUSING sessions', () => {
    expect(computeDue(base({ timers: [{ ...timer('2026-09-09T22:35:00Z'), status: 'COMPLETED' }] }))).toHaveLength(0)
  })

  it('respects timer toggle off', () => {
    const u = user(); u.push.timer = false
    expect(computeDue(base({ users: [u], timers: [timer('2026-09-09T22:35:00Z')] }))).toHaveLength(0)
  })
})

describe('computeDue — break', () => {
  const brk = (startIso: string, secs = 300, sessionType = 'SHORT_BREAK') => ({
    id: 'b1', user_id: 'u1', task_title: null, start_time: startIso,
    target_duration_seconds: secs, status: 'RUNNING', session_type: sessionType,
  })

  it('fires when break ends inside window', () => {
    // 22:55:00Z + 300s = 23:00:00Z, now 23:00:30Z
    const due = computeDue(base({ timers: [brk('2026-09-09T22:55:00Z')] }))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ kind: 'timer', refKey: 'b1' })
    expect(due[0].payload.title).toContain('Istirahat')
  })

  it('does not fire before the break ends', () => {
    expect(computeDue(base({ timers: [brk('2026-09-09T22:59:00Z')] }))).toHaveLength(0)
  })

  it('ignores finished break sessions', () => {
    expect(computeDue(base({ timers: [{ ...brk('2026-09-09T22:55:00Z'), status: 'COMPLETED' }] }))).toHaveLength(0)
  })

  it('long break gets the same treatment', () => {
    const due = computeDue(base({ timers: [brk('2026-09-09T22:45:00Z', 900, 'LONG_BREAK')] }))
    expect(due).toHaveLength(1)
    expect(due[0].payload.title).toContain('Istirahat')
  })

  it('focus session keeps its own wording', () => {
    const due = computeDue(base({
      timers: [{ id: 'f1', user_id: 'u1', task_title: 'Nulis', start_time: '2026-09-09T22:35:00Z', target_duration_seconds: 1500, status: 'FOCUSING', session_type: 'FOCUS' }],
    }))
    expect(due[0].payload.title).toContain('Timer selesai')
  })

  it('respects timer toggle off for breaks too', () => {
    const u = user(); u.push.timer = false
    expect(computeDue(base({ users: [u], timers: [brk('2026-09-09T22:55:00Z')] }))).toHaveLength(0)
  })
})

describe('computeDue — habit', () => {
  const habit = (target_time: string, over = {}) => ({
    id: 'h1', user_id: 'u1', name: 'Olahraga', target_time, is_archived: false, completed_today: false, ...over,
  })

  it('fires at target_time today in user tz (06:00 WIB = 23:00Z prev day)', () => {
    const due = computeDue(base({ habits: [habit('06:00:00')] }))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ kind: 'habit', refKey: 'h1:2026-09-10' })
    expect(due[0].payload.body).toContain('Olahraga')
  })

  it('does not fire for other times', () => {
    expect(computeDue(base({ habits: [habit('07:00:00')] }))).toHaveLength(0)
  })

  it('handles window crossing local midnight (23:59 yesterday)', () => {
    // 00:00:30 WIB = 17:00:30Z
    const now = new Date('2026-09-09T17:00:30Z')
    const due = computeDue(base({ now, habits: [habit('23:59:00')] }))
    expect(due).toHaveLength(1)
    expect(due[0].refKey).toBe('h1:2026-09-09')
  })

  it('skips archived, completed, or no target_time', () => {
    expect(computeDue(base({ habits: [habit('06:00:00', { is_archived: true })] }))).toHaveLength(0)
    expect(computeDue(base({ habits: [habit('06:00:00', { completed_today: true })] }))).toHaveLength(0)
    expect(computeDue(base({ habits: [habit(null as unknown as string)] }))).toHaveLength(0)
  })
})

describe('computeDue — schedule', () => {
  it('fires at scheduled_start_time', () => {
    const due = computeDue(base({ schedules: [{ id: 's1', user_id: 'u1', title: 'Menulis', scheduled_start_time: '2026-09-09T23:00:00Z' }] }))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ kind: 'schedule', refKey: 's1' })
  })
})

describe('computeDue — daily sync', () => {
  it('fires morning at morningTime in user tz', () => {
    const u = user(); u.push.morningTime = '06:00'
    const due = computeDue(base({ users: [u] }))
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ kind: 'daily_sync', refKey: 'u1:2026-09-10:morning' })
  })

  it('fires evening at eveningTime', () => {
    const now = new Date('2026-09-10T14:00:10Z') // 21:00:10 WIB
    const due = computeDue(base({ now }))
    expect(due[0]).toMatchObject({ kind: 'daily_sync', refKey: 'u1:2026-09-10:evening' })
  })

  it('nothing when dailySync toggle off', () => {
    const u = user(); u.push.dailySync = false; u.push.morningTime = '06:00'
    expect(computeDue(base({ users: [u] }))).toHaveLength(0)
  })
})

describe('computeDue — gating', () => {
  it('push disabled → nothing at all', () => {
    const u = user(); u.push.enabled = false
    const due = computeDue(base({
      users: [u],
      timers: [{ id: 't1', user_id: 'u1', task_title: 'x', start_time: '2026-09-09T22:35:00Z', target_duration_seconds: 1500, status: 'FOCUSING' }],
    }))
    expect(due).toHaveLength(0)
  })

  it('rows for unknown users are ignored', () => {
    const due = computeDue(base({
      timers: [{ id: 't9', user_id: 'ghost', task_title: 'x', start_time: '2026-09-09T22:35:00Z', target_duration_seconds: 1500, status: 'FOCUSING' }],
    }))
    expect(due.filter(d => d.kind === 'timer')).toHaveLength(0)
  })
})
