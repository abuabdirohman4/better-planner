/**
 * Pure "what is due right now" computation for web push.
 * No I/O — route fetches rows, this decides. Unit-tested in __tests__/pushDue.test.ts.
 */

export type PushKind = 'timer' | 'habit' | 'schedule' | 'daily_sync' | 'recap'

export interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
  kind: PushKind
}

export interface PushSettings {
  enabled: boolean
  timer: boolean
  habits: boolean
  schedules: boolean
  dailySync: boolean
  recap: boolean
  morningTime: string // 'HH:mm'
  eveningTime: string // 'HH:mm'
}

export const DEFAULT_PUSH_SETTINGS: PushSettings = {
  enabled: false,
  timer: true,
  habits: true,
  schedules: true,
  dailySync: true,
  recap: true,
  morningTime: '06:00',
  eveningTime: '21:00',
}

export interface DueInput {
  now: Date
  windowMs?: number
  users: Array<{ user_id: string; timezone: string; push: PushSettings }>
  timers: Array<{ id: string; user_id: string; task_title: string | null; start_time: string; target_duration_seconds: number; status: string }>
  habits: Array<{ id: string; user_id: string; name: string; target_time: string | null; is_archived: boolean; completed_today: boolean }>
  schedules: Array<{ id: string; user_id: string; title: string | null; scheduled_start_time: string }>
}

export interface DueItem {
  userId: string
  kind: PushKind
  refKey: string
  payload: PushPayload
}

const DEFAULT_WINDOW_MS = 2 * 60 * 1000

/** 'YYYY-MM-DD' + 'HH:mm[:ss]' in `tz` → UTC instant. Fixed-offset zones only (no DST) — fine for WIB. */
export function zonedTimeToUtc(date: string, time: string, tz: string): Date {
  const [h, m] = time.split(':').map(Number)
  const guess = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)
  // wall-clock of `guess` in tz, read back as if it were UTC → offset
  const wall = new Date(new Date(guess).toLocaleString('en-US', { timeZone: tz }) + ' UTC')
  const offsetMs = wall.getTime() - guess.getTime()
  return new Date(guess.getTime() - offsetMs)
}

function localDate(d: Date, tz: string): string {
  return d.toLocaleDateString('en-CA', { timeZone: tz })
}

export function computeDue(input: DueInput): DueItem[] {
  const { now, users, timers, habits, schedules } = input
  const windowMs = input.windowMs ?? DEFAULT_WINDOW_MS
  const nowMs = now.getTime()
  const inWindow = (t: Date) => {
    const ms = t.getTime()
    return ms > nowMs - windowMs && ms <= nowMs
  }

  const byUser = new Map(users.filter(u => u.push?.enabled).map(u => [u.user_id, u]))
  const out: DueItem[] = []

  for (const t of timers) {
    const u = byUser.get(t.user_id)
    if (!u?.push.timer || t.status !== 'FOCUSING') continue
    const end = new Date(new Date(t.start_time).getTime() + t.target_duration_seconds * 1000)
    if (!inWindow(end)) continue
    out.push({
      userId: t.user_id, kind: 'timer', refKey: t.id,
      payload: { kind: 'timer', tag: 'timer', title: 'Timer selesai 🎉', body: `${t.task_title || 'Sesi fokus'} sudah selesai. Waktunya istirahat.`, url: '/execution/daily-sync' },
    })
  }

  // Candidate local dates: today and yesterday (window may straddle local midnight)
  const localDates = (tz: string) => {
    const today = localDate(now, tz)
    const yesterday = localDate(new Date(nowMs - 86_400_000), tz)
    return today === yesterday ? [today] : [today, yesterday]
  }

  for (const h of habits) {
    const u = byUser.get(h.user_id)
    if (!u?.push.habits || !h.target_time || h.is_archived || h.completed_today) continue
    for (const d of localDates(u.timezone)) {
      if (!inWindow(zonedTimeToUtc(d, h.target_time, u.timezone))) continue
      out.push({
        userId: h.user_id, kind: 'habit', refKey: `${h.id}:${d}`,
        payload: { kind: 'habit', tag: `habit-${h.id}`, title: 'Waktunya habit ⏰', body: h.name, url: '/habits/today' },
      })
    }
  }

  for (const s of schedules) {
    const u = byUser.get(s.user_id)
    if (!u?.push.schedules || !inWindow(new Date(s.scheduled_start_time))) continue
    out.push({
      userId: s.user_id, kind: 'schedule', refKey: s.id,
      payload: { kind: 'schedule', tag: `schedule-${s.id}`, title: 'Blok waktu dimulai 🕒', body: s.title || 'Aktivitas terjadwal', url: '/execution/daily-sync' },
    })
  }

  for (const u of byUser.values()) {
    if (!u.push.dailySync) continue
    const slots = [
      { key: 'morning', time: u.push.morningTime, title: 'Selamat pagi ☀️', body: 'Susun rencana harimu di Daily Sync.' },
      { key: 'evening', time: u.push.eveningTime, title: 'Review malam 🌙', body: 'Tutup hari: cek progres & tulis jurnal.' },
    ]
    for (const d of localDates(u.timezone)) {
      for (const s of slots) {
        if (!s.time || !inWindow(zonedTimeToUtc(d, s.time, u.timezone))) continue
        out.push({
          userId: u.user_id, kind: 'daily_sync', refKey: `${u.user_id}:${d}:${s.key}`,
          payload: { kind: 'daily_sync', tag: `daily-sync-${s.key}`, title: s.title, body: s.body, url: '/execution/daily-sync' },
        })
      }
    }
  }

  return out
}
