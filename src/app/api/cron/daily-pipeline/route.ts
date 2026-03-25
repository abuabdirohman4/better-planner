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
import { createServiceClient } from '@/lib/supabase/service'
import { getYesterday, getLastWeekStart, getLastMonthStart, getLastQuarterStart } from '@/lib/notifications/utils/periodUtils'
import type { EmailPayload, AICharacter } from '@/lib/notifications/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function buildSubject(payload: EmailPayload): string {
  const labels: Record<string, string> = {
    daily: 'Laporan Harian',
    weekly: 'Laporan Mingguan',
    monthly: 'Laporan Bulanan',
    quarterly: 'Laporan Kuartalan',
  }
  return `Better Planner — ${labels[payload.periodType]}: ${payload.periodLabel}`
}

function formatPeriodLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results = { aggregated: 0, queued: 0, succeeded: 0, failed: 0, errors: [] as string[] }

  try {
    // --- Step 1: Get users with notifications enabled ---
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, user_id, notification_settings')
      .filter('notification_settings->>enabled', 'eq', 'true')

    if (!users?.length) {
      return Response.json({ success: true, message: 'No users with enabled notifications' })
    }

    const now = new Date()
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
      await aggregatePerformance(user.user_id, 'daily', yesterday)
      if (runWeekly) await aggregatePerformance(user.user_id, 'weekly', weekStart)
      if (runMonthly) await aggregatePerformance(user.user_id, 'monthly', monthStart)
      if (runQuarterly) await aggregatePerformance(user.user_id, 'quarterly', quarterStart)
      results.aggregated++

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
          const insight = await generateInsight(metrics, char, userName, language, mainQuestMotivation, inactiveStreak)

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
            await supabase.from('notification_history').insert({
              user_id: user.user_id,
              period_type: job.type,
              resend_message_id: sendResult.messageId,
            })
            results.succeeded++
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

    return Response.json({ success: true, ...results })
  } catch (error) {
    console.error('[cron/daily-pipeline]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
