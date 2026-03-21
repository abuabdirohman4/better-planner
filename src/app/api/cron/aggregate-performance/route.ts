import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { aggregatePerformance } from '@/lib/notifications/services/performanceAggregation'
import { createServiceClient } from '@/lib/supabase/service'
import { getYesterday, getLastWeekStart, getLastMonthStart, getLastQuarterStart } from '@/lib/notifications/utils/periodUtils'

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, notification_settings')
      .eq("notification_settings->>'enabled'", 'true')

    if (!users?.length) {
      return Response.json({ success: true, message: 'No users with enabled notifications' })
    }

    const todayDateObj = new Date()
    const runWeekly = todayDateObj.getDay() === 1 // is Monday
    const runMonthly = todayDateObj.getDate() === 1
    const runQuarterly = todayDateObj.getDate() === 1 && [0,3,6,9].includes(todayDateObj.getMonth())

    const yesterdayDate = getYesterday()
    const weekStartDate = getLastWeekStart()
    const monthStartDate = getLastMonthStart()
    const quarterStartDate = getLastQuarterStart()

    for (const user of users) {
      // 1. Daily (always runs for yesterday)
      await aggregatePerformance(user.id, 'daily', yesterdayDate)

      // 2. Weekly (runs on Mondays for the previous week)
      if (runWeekly) {
        await aggregatePerformance(user.id, 'weekly', weekStartDate)
      }

      // 3. Monthly (runs on 1st of month for previous month)
      if (runMonthly) {
        await aggregatePerformance(user.id, 'monthly', monthStartDate)
      }

      // 4. Quarterly (runs on 1st of Jan, Apr, Jul, Oct for previous quarter)
      if (runQuarterly) {
        await aggregatePerformance(user.id, 'quarterly', quarterStartDate)
      }
    }

    return Response.json({ success: true, processedUsers: users.length })
  } catch (error) {
    console.error('[cron/aggregate-performance]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
