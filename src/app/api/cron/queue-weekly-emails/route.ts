import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { generateInsight } from '@/lib/notifications/services/aiInsightService'
import { getWeeklyPerformance } from '@/lib/notifications/services/performanceAggregation'
import { getLastWeekStart } from '@/lib/notifications/utils/periodUtils'
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
      .filter('notification_settings->frequencies->>weekly', 'eq', 'true')
      .filter('notification_settings->>enabled', 'eq', 'true')

    if (!users?.length) {
      return Response.json({ success: true, message: 'No users subscribed to weekly emails' })
    }

    const weekStart = getLastWeekStart()
    const periodStart = weekStart.toISOString().split('T')[0]

    let queuedCount = 0

    for (const user of users) {
      const metrics = await getWeeklyPerformance(user.user_id, weekStart)

      if (metrics.totalSessions === 0 && metrics.tasksTotal === 0) continue

      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      const email = user.notification_settings?.email || authUser?.user?.email || ''
      const name = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || 'Planner'

      const char = user.notification_settings?.aiCharacter as AICharacter || 'BALANCED_MENTOR'
      const language = user.notification_settings?.language ?? 'id'
      const insight = await generateInsight(metrics, char, name, language)

      const payload: EmailPayload = {
        userId: user.user_id,
        email,
        userName: name,
        periodType: 'weekly',
        periodLabel: `Week of ${periodStart}`,
        metrics,
        insight,
        character: char,
        language,
      }

      await supabase.from('notification_queue').upsert({
        user_id: user.user_id,
        period_type: 'weekly',
        period_start: periodStart,
        payload,
        status: 'PENDING',
      }, { onConflict: 'user_id, period_type, period_start' })

      queuedCount++
      await delay(4000)
    }

    return Response.json({ success: true, queued: queuedCount })
  } catch (error) {
    console.error('[cron/queue-weekly-emails]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
