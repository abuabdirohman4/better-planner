/**
 * Push-due — called every minute by Supabase pg_cron (pg_net → this route).
 * Vercel Hobby only allows 1 cron/day, so the minute-level scheduler lives in Postgres.
 * Setup SQL: docs/claude/database-operations.md → "Web Push cron".
 */

import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { computeDue, DEFAULT_PUSH_SETTINGS, type DueInput, type PushSettings } from '@/lib/notifications/services/pushDue'
import { sendPushToUser } from '@/lib/notifications/services/pushService'

export const maxDuration = 30

const WINDOW_MS = 2 * 60 * 1000

export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MS).toISOString()

  try {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, notification_settings')
      .filter('notification_settings->push->>enabled', 'eq', 'true')

    const users: DueInput['users'] = (profiles ?? []).map(p => ({
      user_id: p.user_id,
      timezone: p.notification_settings?.timezone || 'Asia/Jakarta',
      push: { ...DEFAULT_PUSH_SETTINGS, ...(p.notification_settings?.push as Partial<PushSettings>) },
    }))
    if (!users.length) return Response.json({ success: true, checked: 0, sent: 0, skipped: 0 })

    const userIds = users.map(u => u.user_id)

    const [timersRes, habitsRes, schedulesRes] = await Promise.all([
      supabase
        .from('timer_sessions')
        .select('id, user_id, task_title, start_time, target_duration_seconds, status')
        .eq('status', 'FOCUSING')
        .in('user_id', userIds),
      supabase
        .from('habits')
        .select('id, user_id, name, target_time, is_archived')
        .eq('is_archived', false)
        .not('target_time', 'is', null)
        .in('user_id', userIds),
      supabase
        .from('task_schedules')
        .select('id, scheduled_start_time, daily_plan_items!inner(item_id, daily_plans!inner(user_id))')
        .gte('scheduled_start_time', windowStart)
        .lte('scheduled_start_time', now.toISOString()),
    ])

    // Habit completions around "today" (±1 day covers every timezone)
    const habitIds = (habitsRes.data ?? []).map(h => h.id)
    const dayMs = 86_400_000
    const { data: completions } = habitIds.length
      ? await supabase
          .from('habit_completions')
          .select('habit_id, date')
          .in('habit_id', habitIds)
          .gte('date', new Date(now.getTime() - dayMs).toISOString().slice(0, 10))
          .lte('date', new Date(now.getTime() + dayMs).toISOString().slice(0, 10))
      : { data: [] }
    const completedKeys = new Set((completions ?? []).map(c => `${c.habit_id}:${c.date}`))
    const tzByUser = new Map(users.map(u => [u.user_id, u.timezone]))

    const habits: DueInput['habits'] = (habitsRes.data ?? []).map(h => {
      const today = now.toLocaleDateString('en-CA', { timeZone: tzByUser.get(h.user_id) })
      return { ...h, completed_today: completedKeys.has(`${h.id}:${today}`) }
    })

    // Schedules: resolve owner + task title
    type ScheduleRow = { id: string; scheduled_start_time: string; daily_plan_items: { item_id: string; daily_plans: { user_id: string } } }
    const rawSchedules = (schedulesRes.data ?? []) as unknown as ScheduleRow[]
    const taskIds = rawSchedules.map(s => s.daily_plan_items.item_id)
    const { data: tasks } = taskIds.length
      ? await supabase.from('tasks').select('id, title').in('id', taskIds)
      : { data: [] }
    const titleById = new Map((tasks ?? []).map(t => [t.id, t.title as string]))
    const schedules: DueInput['schedules'] = rawSchedules.map(s => ({
      id: s.id,
      user_id: s.daily_plan_items.daily_plans.user_id,
      title: titleById.get(s.daily_plan_items.item_id) ?? null,
      scheduled_start_time: s.scheduled_start_time,
    }))

    const due = computeDue({ now, windowMs: WINDOW_MS, users, timers: timersRes.data ?? [], habits, schedules })

    let sent = 0
    let skipped = 0
    const errors: string[] = []
    for (const item of due) {
      // Atomic dedupe: only the request that inserts the log row sends
      const { data: inserted } = await supabase
        .from('push_log')
        .upsert({ user_id: item.userId, kind: item.kind, ref_key: item.refKey }, { onConflict: 'kind,ref_key', ignoreDuplicates: true })
        .select('id')
      if (!inserted?.length) { skipped++; continue }
      try {
        const r = await sendPushToUser(item.userId, item.payload)
        sent += r.sent
      } catch (err) {
        errors.push(`${item.kind}/${item.refKey}: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }

    return Response.json({ success: true, checked: due.length, sent, skipped, errors })
  } catch (error) {
    console.error('[cron/push-due]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
