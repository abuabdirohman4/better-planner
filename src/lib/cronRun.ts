/**
 * Cron run trail + failure alert.
 *
 * A cron that dies quietly is the bug this exists for: the row is inserted as
 * 'failed' up front, so a run that never reaches finishCronRun (timeout, crash)
 * stays visible as failed. Nothing here throws — logging must never break the cron.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/notifications/services/emailService'

export type CronRunStatus = 'success' | 'partial' | 'failed'

export interface CronRunResult {
  status: CronRunStatus
  detail?: unknown
  error?: string
}

/** Returns the run id, or null if logging failed (caller ignores it either way). */
export async function startCronRun(job: string): Promise<string | null> {
  try {
    const { data } = await createServiceClient()
      .from('cron_runs')
      .insert({ job, status: 'failed' }) // overwritten by finishCronRun; stays 'failed' if the run never returns
      .select('id')
      .single()
    return data?.id ?? null
  } catch (err) {
    console.error('[cronRun] start failed', job, err)
    return null
  }
}

export async function finishCronRun(
  id: string | null,
  job: string,
  { status, detail, error }: CronRunResult,
): Promise<void> {
  try {
    if (id) {
      await createServiceClient()
        .from('cron_runs')
        .update({ finished_at: new Date().toISOString(), status, detail: detail ?? null, error: error ?? null })
        .eq('id', id)
    }
  } catch (err) {
    console.error('[cronRun] finish failed', job, err)
  }

  if (status !== 'success') await sendAlert(job, status, detail, error)
}

async function sendAlert(job: string, status: CronRunStatus, detail: unknown, error?: string): Promise<void> {
  const to = process.env.CRON_ALERT_EMAIL || process.env.EMAIL_FROM
  if (!to || !process.env.RESEND_API_KEY) return

  try {
    const html = `
      <h2>Cron <code>${job}</code>: ${status.toUpperCase()}</h2>
      <p><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
      ${error ? `<p><strong>Error:</strong> ${escapeHtml(error)}</p>` : ''}
      <pre style="background:#f4f4f5;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(
        JSON.stringify(detail ?? {}, null, 2),
      )}</pre>
    `
    await sendEmail(to, `[Better Planner] Cron ${job} ${status === 'failed' ? 'GAGAL' : 'SEBAGIAN GAGAL'}`, html)
  } catch (err) {
    console.error('[cronRun] alert failed', job, err)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
