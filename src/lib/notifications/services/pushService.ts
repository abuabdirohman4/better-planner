import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'
import type { PushPayload } from './pushDue'

let configured = false
function ensureVapid() {
  if (configured) return
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) throw new Error('VAPID keys missing (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)')
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', pub, priv)
  configured = true
}

/** Send one payload to every device subscription of a user. Prunes dead subscriptions (404/410). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; pruned: number }> {
  ensureVapid()
  const supabase = createServiceClient()
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
  if (error) throw new Error(`push_subscriptions read failed: ${error.message}`)
  if (!subs?.length) return { sent: 0, pruned: 0 }

  const body = JSON.stringify(payload)
  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 300 }))
  )

  const dead: string[] = []
  let sent = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') { sent++; return }
    const status = (r.reason as { statusCode?: number })?.statusCode
    if (status === 404 || status === 410) dead.push(subs[i].id)
    else console.error('[push] send failed', userId, status, r.reason?.message)
  })

  if (dead.length) await supabase.from('push_subscriptions').delete().in('id', dead)
  return { sent, pruned: dead.length }
}
