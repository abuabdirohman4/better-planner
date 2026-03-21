import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { processEmailQueue } from '@/lib/notifications/services/queueProcessor'

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processEmailQueue(20)
    return Response.json({ success: true, ...result })
  } catch (error) {
    console.error('[cron/process-email-queue]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
