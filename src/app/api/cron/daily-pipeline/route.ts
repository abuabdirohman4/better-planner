/**
 * Daily Pipeline — Single cron job for Vercel Hobby plan
 *
 * Runs once per day and executes the full notification pipeline:
 * 1. Aggregate performance for all users
 * 2. Queue emails based on frequency settings (daily always, weekly/monthly/quarterly conditionally)
 * 3. Send all queued emails immediately
 *
 * Replaces: aggregate-performance + queue-daily/weekly/monthly/quarterly-emails + process-email-queue
 */

import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { aggregatePerformance, getDailyPerformance, getWeeklyPerformance, getMonthlyPerformance, getQuarterlyPerformance, getInactiveStreak } from '@/lib/notifications/services/performanceAggregation'
import { generateInsight } from '@/lib/notifications/services/aiInsightService'
import { renderEmailTemplate } from '@/lib/notifications/templates'
import { sendEmail } from '@/lib/notifications/services/emailService'
import { sendPushToUser } from '@/lib/notifications/services/pushService'
import { buildSubject, insertHistory } from '@/lib/notifications/services/queueProcessor'
import { createServiceClient } from '@/lib/supabase/service'
import { startCronRun, finishCronRun } from '@/lib/cronRun'
import { getYesterday, getLastWeekStart, getLastMonthStart, getLastQuarterStart, nowInUserTimezone } from '@/lib/notifications/utils/periodUtils'
import type { EmailPayload, AICharacter } from '@/lib/notifications/types'

// Pipeline needs ~15-30s (4s Gemini delay per user + sends); Hobby default can be 10s
export const maxDuration = 300

const JOB = 'daily-pipeline'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function formatPeriodLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

// Vercel cron calls with GET, manual trigger uses POST
export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const runId = await startCronRun(JOB)
  const results = { aggregated: 0, queued: 0, succeeded: 0, failed: 0, errors: [] as string[] }
  // Report content per user/period, returned in the response so external
  // orchestrators (n8n) can forward it to other channels like Telegram
  const reports: Array<{
    userId: string
    email: string
    periodType: string
    periodLabel: string
    insight: unknown
    metrics: { totalFocusMinutes: number; totalSessions: number; tasksCompleted: number; tasksTotal: number; completionRate: number }
  }> = []

  try {
    // --- Step 1: Get users with notifications enabled ---
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, user_id, notification_settings')
      .filter('notification_settings->>enabled', 'eq', 'true')

    if (!users?.length) {
      await finishCronRun(runId, JOB, { status: 'success', detail: { message: 'No users with enabled notifications' } })
      return Response.json({ success: true, message: 'No users with enabled notifications' })
    }

    // WIB wall-clock: cron fires 23:00 UTC = 06:00 WIB, so UTC day is still H-1
    const now = nowInUserTimezone()
    const runWeekly = now.getDay() === 1 // Monday
    const runMonthly = now.getDate() === 1
    const runQuarterly = now.getDate() === 1 && [0, 3, 6, 9].includes(now.getMonth())

    const yesterday = getYesterday()
    const weekStart = getLastWeekStart()
    const monthStart = getLastMonthStart()
    const quarterStart = getLastQuarterStart()

    // --- Step 2: For each user, aggregate + build + send emails ---
    for (const user of users) {
      const settings = user.notification_settings
      const char = (settings?.aiCharacter as AICharacter) ?? 'BALANCED_MENTOR'
      const language = settings?.language ?? 'id'
      const locale = language === 'id' ? 'id-ID' : 'en-US'

      // Aggregate performance data (saves to performance_summaries)
      try {
        await aggregatePerformance(user.user_id, 'daily', yesterday)
        if (runWeekly) await aggregatePerformance(user.user_id, 'weekly', weekStart)
        if (runMonthly) await aggregatePerformance(user.user_id, 'monthly', monthStart)
        if (runQuarterly) await aggregatePerformance(user.user_id, 'quarterly', quarterStart)
        results.aggregated++
      } catch (err) {
        results.failed++
        results.errors.push(`aggregate/${user.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }

      // Get user email and name from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      const email = settings?.email || authUser?.user?.email || ''
      const userName = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || 'Planner'

      if (!email) continue

      // Determine which email types to send today
      type PeriodJob = {
        type: 'daily' | 'weekly' | 'monthly' | 'quarterly'
        enabled: boolean
        date: Date
        getMetrics: () => Promise<any>
      }

      const jobs: PeriodJob[] = [
        {
          type: 'daily',
          enabled: settings?.frequencies?.daily === true,
          date: yesterday,
          getMetrics: () => getDailyPerformance(user.user_id, yesterday),
        },
        {
          type: 'weekly',
          enabled: runWeekly && settings?.frequencies?.weekly === true,
          date: weekStart,
          getMetrics: () => getWeeklyPerformance(user.user_id, weekStart),
        },
        {
          type: 'monthly',
          enabled: runMonthly && settings?.frequencies?.monthly === true,
          date: monthStart,
          getMetrics: () => getMonthlyPerformance(user.user_id, monthStart),
        },
        {
          type: 'quarterly',
          enabled: runQuarterly && settings?.frequencies?.quarterly === true,
          date: quarterStart,
          getMetrics: () => getQuarterlyPerformance(user.user_id, quarterStart),
        },
      ]

      for (const job of jobs) {
        if (!job.enabled) continue

        try {
          const metrics = await job.getMetrics()

          const mainQuestMotivation = metrics.mainQuestProgress?.motivation
          const inactiveStreak = job.type === 'daily' && metrics.totalSessions === 0
            ? await getInactiveStreak(user.user_id, yesterday)
            : 0

          const periodLabel = job.type === 'daily'
            ? formatPeriodLabel(yesterday, locale)
            : job.date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })

          // Rate limit: 4s between Gemini calls (15 RPM free tier)
          await delay(4000)
          const insight = await generateInsight(metrics, char, userName, language, mainQuestMotivation, inactiveStreak, periodLabel)

          reports.push({
            userId: user.user_id,
            email,
            periodType: job.type,
            periodLabel,
            insight,
            metrics: {
              totalFocusMinutes: metrics.totalFocusMinutes,
              totalSessions: metrics.totalSessions,
              tasksCompleted: metrics.tasksCompleted,
              tasksTotal: metrics.tasksTotal,
              completionRate: metrics.completionRate,
            },
          })

          const payload: EmailPayload = {
            userId: user.user_id,
            email,
            userName,
            periodType: job.type,
            periodLabel,
            metrics,
            insight,
            character: char,
            language,
          }

          // Send directly — no queue needed for single daily run
          const html = await renderEmailTemplate(payload)
          const subject = buildSubject(payload)
          const sendResult = await sendEmail(email, subject, html)

          if (sendResult.success) {
            await insertHistory(supabase, payload, subject, sendResult.messageId)
            results.succeeded++
            // Web push companion — never fail the email job because of push
            if (settings?.push?.enabled && settings.push.recap !== false) {
              try {
                await sendPushToUser(user.user_id, { kind: 'recap', tag: `recap-${job.type}`, title: subject, body: insight.headline, url: '/dashboard' })
              } catch (pushErr) {
                console.error('[cron/daily-pipeline] push failed', user.user_id, pushErr)
              }
            }
          } else {
            results.failed++
            results.errors.push(`${job.type}/${user.user_id}: ${sendResult.error}`)
          }

          results.queued++
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          results.failed++
          results.errors.push(`${job.type}/${user.user_id}: ${message}`)
        }
      }
    }

    await finishCronRun(runId, JOB, {
      status: results.failed > 0 ? 'partial' : 'success',
      detail: { aggregated: results.aggregated, queued: results.queued, succeeded: results.succeeded, failed: results.failed, errors: results.errors },
      error: results.errors[0],
    })

    return Response.json({ success: true, ...results, reports })
  } catch (error) {
    console.error('[cron/daily-pipeline]', error)
    await finishCronRun(runId, JOB, {
      status: 'failed',
      detail: { stage: 'fatal', ...results },
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
