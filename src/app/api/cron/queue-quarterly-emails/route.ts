import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { generateInsight } from '@/lib/notifications/services/aiInsightService'
import { getLastQuarterStart } from '@/lib/notifications/utils/periodUtils'
import type { EmailPayload, AICharacter } from '@/lib/notifications/types'
import type { PerformanceMetrics } from '@/lib/notifications/services/performanceAggregation'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, notification_settings')
      .eq("notification_settings->frequencies->>'quarterly'", 'true')
      .eq("notification_settings->>'enabled'", 'true')

    if (!users?.length) {
      return Response.json({ success: true, message: 'No users subscribed to quarterly emails' })
    }

    const quarterStartDate = getLastQuarterStart()
    const prevQuarterYear = quarterStartDate.getFullYear()
    const prevQuarter = Math.floor(quarterStartDate.getMonth() / 3)
    const periodStart = quarterStartDate.toISOString().split('T')[0]

    let queuedCount = 0

    for (const user of users) {
      const { data: metricsRow } = await supabase
        .from('performance_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'quarterly')
        .eq('period_start', periodStart)
        .single()

      if (!metricsRow) continue

      const metrics = metricsRow as unknown as PerformanceMetrics
      const char = user.notification_settings?.aiCharacter as AICharacter || 'BALANCED_MENTOR'
      const name = user.full_name || 'Planner'

      const insight = await generateInsight(metrics, char, name)

      const payload: EmailPayload = {
        userId: user.id,
        email: user.notification_settings?.email || user.email,
        userName: name,
        periodType: 'quarterly',
        periodLabel: `Q${prevQuarter + 1} ${prevQuarterYear}`,
        metrics,
        insight,
        character: char,
      }

      await supabase.from('notification_queue').upsert({
        user_id: user.id,
        period_type: 'quarterly',
        period_start: periodStart,
        payload,
        status: 'PENDING',
      }, { onConflict: 'user_id, period_type, period_start' })

      queuedCount++
      await delay(4000)
    }

    return Response.json({ success: true, queued: queuedCount })
  } catch (error) {
    console.error('[cron/queue-quarterly-emails]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
