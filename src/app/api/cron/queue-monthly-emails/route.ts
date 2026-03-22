import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { generateInsight } from '@/lib/notifications/services/aiInsightService'
import { getMonthlyPerformance } from '@/lib/notifications/services/performanceAggregation'
import { getLastMonthStart } from '@/lib/notifications/utils/periodUtils'
import type { EmailPayload, AICharacter } from '@/lib/notifications/types'

// Wait helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, user_id, notification_settings')
      .filter('notification_settings->frequencies->>monthly', 'eq', 'true')
      .filter('notification_settings->>enabled', 'eq', 'true')

    if (!users?.length) {
      return Response.json({ success: true, message: 'No users subscribed to monthly emails' })
    }

    const monthStartDate = getLastMonthStart()
    const periodStart = monthStartDate.toISOString().split('T')[0]

    let queuedCount = 0

    for (const user of users) {
      const metrics = await getMonthlyPerformance(user.user_id, monthStartDate)

      if (metrics.totalSessions === 0 && metrics.tasksTotal === 0) continue

      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      const email = user.notification_settings?.email || authUser?.user?.email || ''
      const name = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || 'Planner'

      const char = user.notification_settings?.aiCharacter as AICharacter || 'BALANCED_MENTOR'
      const insight = await generateInsight(metrics, char, name)

      const payload: EmailPayload = {
        userId: user.user_id,
        email,
        userName: name,
        periodType: 'monthly',
        periodLabel: monthStartDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        metrics,
        insight,
        character: char,
      }

      await supabase.from('notification_queue').upsert({
        user_id: user.user_id,
        period_type: 'monthly',
        period_start: periodStart,
        payload,
        status: 'PENDING',
      }, { onConflict: 'user_id, period_type, period_start' })

      queuedCount++
      await delay(4000)
    }

    return Response.json({ success: true, queued: queuedCount })
  } catch (error) {
    console.error('[cron/queue-monthly-emails]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
