import { createServiceClient } from '@/lib/supabase/service'
import { renderEmailTemplate } from '../templates'
import { sendEmail } from './emailService'
import type { EmailPayload } from '../types'

export interface ProcessQueueResult {
  processed: number
  succeeded: number
  failed: number
  errors: string[]
}

export async function processEmailQueue(
  batchSize = 10
): Promise<ProcessQueueResult> {
  const supabase = createServiceClient()
  const result: ProcessQueueResult = { processed: 0, succeeded: 0, failed: 0, errors: [] }

  // Fetch pending items
  const now = new Date().toISOString()
  const { data: items } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'PENDING')
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .limit(batchSize)

  if (!items?.length) return result

  for (const item of items) {
    result.processed++

    // Lock item
    await supabase
      .from('notification_queue')
      .update({ status: 'PROCESSING' })
      .eq('id', item.id)

    try {
      const payload = item.payload as EmailPayload
      const html = await renderEmailTemplate(payload)
      const subject = buildSubject(payload)
      const sendResult = await sendEmail(payload.email, subject, html)

      if (sendResult.success) {
        // Mark sent
        await supabase
          .from('notification_queue')
          .update({ status: 'SENT', resend_message_id: sendResult.messageId })
          .eq('id', item.id)

        // Insert history
        await supabase.from('notification_history').insert({
          user_id: payload.userId,
          period_type: payload.periodType,
          resend_message_id: sendResult.messageId,
        })

        result.succeeded++
      } else {
        await handleFailure(supabase, item, sendResult.error ?? 'Unknown error')
        result.failed++
        result.errors.push(sendResult.error ?? 'Unknown')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await handleFailure(supabase, item, message)
      result.failed++
      result.errors.push(message)
    }
  }

  return result
}

async function handleFailure(supabase: ReturnType<typeof createServiceClient>, item: any, error: string) {
  const newRetryCount = (item.retry_count ?? 0) + 1
  if (newRetryCount >= 3) {
    await supabase
      .from('notification_queue')
      .update({ status: 'FAILED', resend_error: error, retry_count: newRetryCount })
      .eq('id', item.id)
  } else {
    const nextRetry = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    await supabase
      .from('notification_queue')
      .update({ status: 'PENDING', resend_error: error, retry_count: newRetryCount, next_retry_at: nextRetry })
      .eq('id', item.id)
  }
}

function buildSubject(payload: EmailPayload): string {
  const labels: Record<string, string> = {
    daily: 'Laporan Harian',
    weekly: 'Laporan Mingguan',
    monthly: 'Laporan Bulanan',
    quarterly: 'Laporan Kuartalan',
  }
  return `Better Planner — ${labels[payload.periodType]}: ${payload.periodLabel}`
}
