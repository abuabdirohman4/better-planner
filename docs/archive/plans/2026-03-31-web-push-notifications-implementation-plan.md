# Web Push Notifications — Implementation Plan

**Date:** 2026-03-31
**Design Doc:** `docs/plans/2026-03-31-web-push-notifications-design.md`
**Branch:** buat branch baru dari `master` → `feature/web-push-notifications`

---

## Pre-flight Checklist

```bash
# Sebelum mulai, pastikan:
git checkout master && git pull
git checkout -b feature/web-push-notifications

# Generate VAPID keys (simpan outputnya!)
npx web-push generate-vapid-keys
# → Tambahkan ke .env.local dan Vercel dashboard
```

---

## Phase 1 — Infrastructure (Database + Types + Package)

### Checkpoint 1.1 — Install package

```bash
npm install web-push
npm install --save-dev @types/web-push
```

Verifikasi: `package.json` punya `"web-push"` di dependencies.

---

### Checkpoint 1.2 — Database Migration

**Buat file:** `supabase/migrations/20260401000001_push_subscriptions.sql`

```sql
-- Push subscriptions: one row per device per user
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON push_subscriptions(endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_sub_select" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_sub_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_sub_delete" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
```

Apply migration:
```bash
# Via Supabase MCP (jika terkoneksi):
# Gunakan mcp__better-planner__apply_migration dengan konten SQL di atas

# Atau via CLI:
supabase db push
```

---

### Checkpoint 1.3 — Extend Types

**Edit file:** `src/lib/notifications/types/index.ts`

Tambahkan SEBELUM `export interface NotificationSettings`:

```typescript
// ─── Push Notification Types ──────────────────────────────
export interface PushReminderSettings {
  dailySyncEnabled: boolean
  dailySyncTime: string          // "HH:MM" format WIB
  pomodoroEnabled: boolean
  questDeadlineEnabled: boolean
  habitReminderEnabled: boolean
}

export interface PushDigestSettings {
  enabled: boolean
  frequencies: {
    daily: boolean
    weekly: boolean
    monthly: boolean
  }
}

export interface PushSettings {
  enabled: boolean
  reminders: PushReminderSettings
  digests: PushDigestSettings
}
```

Tambahkan field `push?` di `NotificationSettings`:

```typescript
export interface NotificationSettings {
  enabled: boolean
  frequencies: {
    daily: boolean
    weekly: boolean
    monthly: boolean
    quarterly: boolean
  }
  aiCharacter: AICharacter
  preferredTime: string
  timezone: string
  email: string | null
  language: EmailLanguage
  push?: PushSettings            // ← TAMBAHKAN INI (optional, backward compatible)
}
```

Verifikasi: `npm run type-check` harus pass.

---

### Checkpoint 1.4 — Environment Variables

Tambahkan ke `.env.local`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key_dari_generate>
VAPID_PRIVATE_KEY=<private_key_dari_generate>
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

Tambahkan juga ke Vercel dashboard (Settings → Environment Variables).

---

## Phase 2 — Service Worker Push Event

### Checkpoint 2.1 — Tambah push event di sw-custom.js

**Edit file:** `public/sw-custom.js`

Tambahkan SETELAH blok `sync` event listener (baris ~369):

```javascript
// ─── Web Push Event Handler ───────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { type: 'GENERIC', title: 'Better Planner', body: event.data.text() };
  }

  event.waitUntil(handlePushPayload(payload));
});

async function handlePushPayload(payload) {
  const { type, title, body, data = {} } = payload;

  const baseOptions = {
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    data,
  };

  switch (type) {
    case 'DAILY_SYNC_REMINDER':
      return self.registration.showNotification(title, {
        ...baseOptions,
        body,
        tag: 'daily-sync-reminder',
        actions: [
          { action: 'open-daily-sync', title: 'Mulai Daily Sync' },
          { action: 'dismiss', title: 'Nanti' },
        ],
        data: { url: '/execution/daily-sync', ...data },
      });

    case 'POMODORO_COMPLETE':
      return self.registration.showNotification(title, {
        ...baseOptions,
        body,
        tag: 'pomodoro-complete',
        requireInteraction: true,
        actions: [{ action: 'view', title: 'Lihat Hasil' }],
        data: { url: '/execution/daily-sync', ...data },
      });

    case 'QUEST_DEADLINE':
      return self.registration.showNotification(title, {
        ...baseOptions,
        body,
        tag: `quest-deadline-${data.taskId || 'general'}`,
        actions: [
          { action: 'open-quests', title: 'Lihat Task' },
          { action: 'dismiss', title: 'Nanti' },
        ],
        data: { url: '/quests/daily-quests', ...data },
      });

    case 'HABIT_REMINDER':
      return self.registration.showNotification(title, {
        ...baseOptions,
        body,
        tag: `habit-${data.habitId || 'reminder'}`,
        actions: [
          { action: 'open-habits', title: 'Log Habit' },
          { action: 'dismiss', title: 'Nanti' },
        ],
        data: { url: '/execution/daily-sync', ...data },
      });

    case 'DIGEST':
      return self.registration.showNotification(title, {
        ...baseOptions,
        body,
        tag: `digest-${data.periodType || 'general'}`,
        actions: [{ action: 'open-dashboard', title: 'Lihat Dashboard' }],
        data: { url: '/dashboard', ...data },
      });

    default:
      return self.registration.showNotification(title, {
        ...baseOptions,
        body,
        tag: 'generic',
        data: { url: '/', ...data },
      });
  }
}

// Helper: focus existing window or open new one
function focusOrOpen(url) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    });
}
```

**Edit `notificationclick` handler** — tambahkan cases baru di dalam `switch (action)` (SEBELUM `case 'view': default:`):

```javascript
    case 'open-daily-sync':
      event.waitUntil(focusOrOpen('/execution/daily-sync'));
      break;

    case 'open-quests':
      event.waitUntil(focusOrOpen('/quests/daily-quests'));
      break;

    case 'open-habits':
      event.waitUntil(focusOrOpen('/execution/daily-sync'));
      break;

    case 'open-dashboard':
      event.waitUntil(focusOrOpen('/dashboard'));
      break;

    case 'dismiss':
      // notification already closed by event.notification.close() above
      break;
```

Verifikasi manual: Chrome DevTools → Application → Service Workers → Push (paste JSON) → lihat notifikasi muncul.

---

## Phase 3 — API Routes & Client Hook

### Checkpoint 3.1 — Push Service (server)

**Buat file:** `src/lib/notifications/services/pushService.ts`

```typescript
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushNotificationPayload {
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export interface PushResult {
  sent: number
  failed: number
  cleaned: number
}

export async function sendPushToUser(
  userId: string,
  notification: PushNotificationPayload
): Promise<PushResult> {
  const supabase = createServiceClient()
  const result: PushResult = { sent: 0, failed: 0, cleaned: 0 }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subscriptions?.length) return result

  const payload = JSON.stringify(notification)

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      result.sent++
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 410 || status === 404) {
        // Subscription expired — delete it
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        result.cleaned++
      } else {
        console.error('[pushService] Send failed:', (err as Error).message)
        result.failed++
      }
    }
  }

  return result
}

export async function sendPushToMany(
  userIds: string[],
  notification: PushNotificationPayload
): Promise<PushResult> {
  const results = await Promise.all(
    userIds.map((uid) => sendPushToUser(uid, notification))
  )
  return results.reduce(
    (acc, r) => ({
      sent: acc.sent + r.sent,
      failed: acc.failed + r.failed,
      cleaned: acc.cleaned + r.cleaned,
    }),
    { sent: 0, failed: 0, cleaned: 0 }
  )
}
```

---

### Checkpoint 3.2 — Subscribe API Route

**Buat file:** `src/app/api/push/subscribe/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'Invalid subscription data' }, { status: 400 })
  }

  const userAgent = request.headers.get('user-agent') ?? null

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      },
      { onConflict: 'endpoint' }
    )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()
  if (!endpoint) return Response.json({ error: 'Missing endpoint' }, { status: 400 })

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  return Response.json({ success: true })
}
```

---

### Checkpoint 3.3 — Send API Route (internal/cron only)

**Buat file:** `src/app/api/push/send/route.ts`

```typescript
import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { sendPushToUser } from '@/lib/notifications/services/pushService'

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, notification } = await request.json()

  if (!userId || !notification?.type || !notification?.title) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await sendPushToUser(userId, notification)
  return Response.json({ success: true, ...result })
}
```

---

### Checkpoint 3.4 — Client Hook

**Buat file:** `src/hooks/usePushSubscription.ts`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushSubscription() {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  const [permissionState, setPermissionState] = useState<PushPermissionState>(
    isSupported ? 'default' : 'unsupported'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isSupported) return

    setPermissionState(Notification.permission as PushPermissionState)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false
    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission as PushPermissionState)
      if (permission !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) {
        setIsSubscribed(true)
        return true
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('[usePushSubscription] subscribe failed:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setIsSubscribed(false)
        return true
      }

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })

      await sub.unsubscribe()
      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('[usePushSubscription] unsubscribe failed:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return { permissionState, isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}

// Convert base64 VAPID public key to Uint8Array for PushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
```

---

### Checkpoint 3.5 — PWA Component Push Prompt

**Edit file:** `src/components/PWA/index.tsx`

Tambahkan state baru setelah `showUpdatePrompt`:
```typescript
const [showPushPrompt, setShowPushPrompt] = useState(false)
```

Tambahkan logika di dalam `useEffect`, setelah blok `navigator.serviceWorker.register(...).then(...)`:
```typescript
      // Check push notification support and permission
      if ('PushManager' in window && Notification.permission === 'default' && !isLandingPage) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (!sub) {
              // Show push prompt after 8s (after install prompt at 3s)
              setTimeout(() => {
                const dismissed = sessionStorage.getItem('push-prompt-dismissed')
                if (!dismissed) {
                  setShowPushPrompt(true)
                }
              }, 8000)
            }
          })
        })
      }
```

Tambahkan handler:
```typescript
  const handlePushPromptAccept = async () => {
    setShowPushPrompt(false)
    // Redirect ke settings notifications
    if (typeof window !== 'undefined') {
      window.location.href = '/settings/notifications'
    }
  }

  const handlePushPromptDismiss = () => {
    setShowPushPrompt(false)
    sessionStorage.setItem('push-prompt-dismissed', 'true')
  }
```

Tambahkan JSX di return, setelah Install Prompt block:
```tsx
      {/* Push Notification Prompt */}
      {showPushPrompt && !isLandingPage && !showInstallPrompt && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-sm w-full mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-99">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Aktifkan Push Notification</h3>
            <p className="text-xs text-gray-500 mt-1">Dapatkan reminder harian, habit, dan task — bahkan saat app tertutup</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePushPromptAccept}
              className="flex-1 bg-brand-500 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Aktifkan
            </button>
            <button
              onClick={handlePushPromptDismiss}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
      )}
```

---

## Phase 4 — Cron Jobs

### Checkpoint 4.1 — Habit Reminder Cron

**Buat file:** `src/app/api/cron/push-habit-reminders/route.ts`

```typescript
import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushToUser } from '@/lib/notifications/services/pushService'

export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results = { sent: 0, skipped: 0, errors: [] as string[] }

  try {
    // Current hour in WIB (UTC+7)
    const nowUTC = new Date()
    const nowWIB = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000)
    const currentHour = nowWIB.getUTCHours()
    const todayWIB = nowWIB.toISOString().split('T')[0]

    // Get habits with target_time in current hour that aren't completed today
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, user_id, target_time')
      .not('target_time', 'is', null)
      .eq('is_archived', false)

    if (!habits?.length) {
      return Response.json({ success: true, message: 'No habits with target_time' })
    }

    // Group habits by user_id that match current hour
    const habitsByUser = new Map<string, typeof habits>()
    for (const habit of habits) {
      if (!habit.target_time) continue
      const [habitHour] = habit.target_time.split(':').map(Number)
      if (habitHour !== currentHour) continue

      // Check if already completed today
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habit.id)
        .eq('completed_date', todayWIB)
        .limit(1)

      if (completions?.length) continue // already done

      const existing = habitsByUser.get(habit.user_id) ?? []
      habitsByUser.set(habit.user_id, [...existing, habit])
    }

    // Send push per user
    for (const [userId, userHabits] of habitsByUser) {
      // Check user has push.reminders.habitReminderEnabled
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('notification_settings')
        .eq('user_id', userId)
        .single()

      const push = profile?.notification_settings?.push
      if (!push?.enabled || !push?.reminders?.habitReminderEnabled) {
        results.skipped++
        continue
      }

      const habitNames = userHabits.map((h) => h.name)
      const title =
        userHabits.length === 1
          ? `Reminder: ${userHabits[0].name}`
          : `${userHabits.length} Habits Menunggu`
      const body =
        userHabits.length === 1
          ? 'Jangan lupa catat habitmu hari ini!'
          : `${habitNames.slice(0, 2).join(', ')}${userHabits.length > 2 ? ', ...' : ''} — catat sekarang!`

      try {
        const result = await sendPushToUser(userId, {
          type: 'HABIT_REMINDER',
          title,
          body,
          data: { habitId: userHabits[0].id, url: '/execution/daily-sync' },
        })
        results.sent += result.sent
      } catch (err) {
        results.errors.push(`${userId}: ${(err as Error).message}`)
      }
    }

    return Response.json({ success: true, ...results })
  } catch (error) {
    console.error('[cron/push-habit-reminders]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

### Checkpoint 4.2 — Tambah Push Steps ke Daily Pipeline

**Edit file:** `src/app/api/cron/daily-pipeline/route.ts`

Tambahkan import di atas:
```typescript
import { sendPushToUser } from '@/lib/notifications/services/pushService'
```

Tambahkan **Step 3** di akhir try block (setelah loop email, sebelum `return Response.json`):

```typescript
    // --- Step 3: Push Reminders (Daily Sync + Quest Deadlines + Digest) ---
    const pushResults = { sent: 0, skipped: 0 }

    for (const user of users) {
      const push = user.notification_settings?.push
      if (!push?.enabled) continue

      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      const userName = authUser?.user?.user_metadata?.full_name || 'Planner'

      // 3a. Daily Sync Reminder
      if (push.reminders?.dailySyncEnabled) {
        await sendPushToUser(user.user_id, {
          type: 'DAILY_SYNC_REMINDER',
          title: 'Selamat pagi! 🌅',
          body: `Waktunya Daily Sync, ${userName}. Yuk mulai hari ini!`,
          data: { url: '/execution/daily-sync' },
        })
        pushResults.sent++
      }

      // 3b. Quest Deadline Reminder
      if (push.reminders?.questDeadlineEnabled) {
        const todayStr = new Date().toISOString().split('T')[0]
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]

        const { data: dueTasks } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', user.user_id)
          .in('due_date', [todayStr, tomorrowStr])
          .neq('status', 'completed')
          .limit(5)

        if (dueTasks?.length) {
          const title =
            dueTasks.length === 1
              ? 'Task Jatuh Tempo Hari Ini'
              : `${dueTasks.length} Tasks Jatuh Tempo`
          const body =
            dueTasks.length === 1
              ? `"${dueTasks[0].title}" harus diselesaikan hari ini!`
              : `${dueTasks.map((t) => t.title).slice(0, 2).join(', ')}${dueTasks.length > 2 ? ', ...' : ''}`

          await sendPushToUser(user.user_id, {
            type: 'QUEST_DEADLINE',
            title,
            body,
            data: { taskId: dueTasks[0].id, url: '/quests/daily-quests' },
          })
          pushResults.sent++
        }
      }

      // 3c. Push Digest (daily)
      if (push.digests?.enabled && push.digests?.frequencies?.daily) {
        // Gunakan metrics yang sudah di-fetch di Step 2 jika ada
        // Untuk MVP: kirim notif singkat tanpa AI insight
        await sendPushToUser(user.user_id, {
          type: 'DIGEST',
          title: 'Ringkasan Harianmu Siap 📊',
          body: 'Cek dashboard untuk melihat performa hari ini.',
          data: { periodType: 'daily', url: '/dashboard' },
        })
        pushResults.sent++
      }

      // Weekly digest push (setiap Senin)
      if (runWeekly && push.digests?.enabled && push.digests?.frequencies?.weekly) {
        await sendPushToUser(user.user_id, {
          type: 'DIGEST',
          title: 'Ringkasan Mingguanmu Siap 📈',
          body: 'Review pencapaian minggu ini di dashboard.',
          data: { periodType: 'weekly', url: '/dashboard' },
        })
        pushResults.sent++
      }

      // Monthly digest push (tanggal 1)
      if (runMonthly && push.digests?.enabled && push.digests?.frequencies?.monthly) {
        await sendPushToUser(user.user_id, {
          type: 'DIGEST',
          title: 'Ringkasan Bulanmu Siap 🗓️',
          body: 'Bulan baru, refleksi baru. Cek performa bulan lalu.',
          data: { periodType: 'monthly', url: '/dashboard' },
        })
        pushResults.sent++
      }
    }

    return Response.json({ success: true, ...results, pushResults })
```

---

### Checkpoint 4.3 — Update vercel.json

**Edit file:** `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/daily-pipeline", "schedule": "0 1 * * *" },
    { "path": "/api/cron/push-habit-reminders", "schedule": "0 * * * *" }
  ]
}
```

> **Note:** Schedule daily-pipeline diubah dari `0 6 * * *` ke `0 1 * * *` (= 08:00 WIB) agar push reminders sampai di pagi hari user.

---

## Phase 5 — Settings UI

### Checkpoint 5.1 — PushNotificationSettings Component

**Buat file:** `src/app/(admin)/settings/notifications/PushNotificationSettings.tsx`

```typescript
'use client'

import { usePushSubscription } from '@/hooks/usePushSubscription'
import type { PushSettings } from '@/lib/notifications/types'

const DEFAULT_PUSH_SETTINGS: PushSettings = {
  enabled: false,
  reminders: {
    dailySyncEnabled: true,
    dailySyncTime: '08:00',
    pomodoroEnabled: true,
    questDeadlineEnabled: true,
    habitReminderEnabled: true,
  },
  digests: {
    enabled: false,
    frequencies: { daily: false, weekly: true, monthly: true },
  },
}

interface Props {
  pushSettings: PushSettings | undefined
  onChange: (push: PushSettings) => void
}

export function PushNotificationSettings({ pushSettings, onChange }: Props) {
  const { permissionState, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
    usePushSubscription()

  const settings = pushSettings ?? DEFAULT_PUSH_SETTINGS

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isIOSVersion = typeof navigator !== 'undefined'
    ? parseInt((navigator.userAgent.match(/OS (\d+)_/) ?? [])[1] ?? '0')
    : 0
  const isStandalone = typeof window !== 'undefined' && (window.navigator as { standalone?: boolean }).standalone
  const iosPushSupported = isIOS && isIOSVersion >= 16 && isStandalone

  // iOS without PWA install or old iOS
  if (isIOS && !iosPushSupported) {
    return (
      <div className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h2>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isIOSVersion < 16
              ? 'Push notification membutuhkan iOS 16.4 atau lebih baru. Update iPhone/iPad Anda untuk mengaktifkan fitur ini.'
              : 'Untuk mengaktifkan push notification di iOS, tambahkan app ke Home Screen terlebih dahulu: buka di Safari → share → "Add to Home Screen".'
            }
          </p>
        </div>
      </div>
    )
  }

  // Browser doesn't support push
  if (!isSupported) {
    return (
      <div className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h2>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Browser Anda tidak mendukung push notification. Gunakan Chrome atau Firefox versi terbaru.
          </p>
        </div>
      </div>
    )
  }

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      const success = await unsubscribe()
      if (success) {
        onChange({ ...settings, enabled: false })
      }
    } else {
      const success = await subscribe()
      if (success) {
        onChange({ ...settings, enabled: true })
      }
    }
  }

  return (
    <div className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Terima notifikasi langsung ke device, bahkan saat app tidak dibuka
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Permission denied state */}
        {permissionState === 'denied' && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Push notification diblokir di browser Anda. Buka pengaturan browser → izin → aktifkan notifikasi untuk situs ini.
          </p>
        )}

        {/* Master enable toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-gray-900 dark:text-white">
              {isSubscribed ? 'Push Aktif' : 'Aktifkan Push Notification'}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isSubscribed
                ? 'Device ini terdaftar untuk menerima notifikasi'
                : 'Izinkan notifikasi untuk device ini'}
            </p>
          </div>
          <button
            onClick={handleToggleSubscription}
            disabled={isLoading || permissionState === 'denied'}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isSubscribed
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {isLoading ? 'Loading...' : isSubscribed ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>

        {/* Settings — only show when subscribed */}
        {isSubscribed && settings.enabled && (
          <>
            {/* Reminders */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-base font-medium text-gray-900 dark:text-white">Reminders</label>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    ['dailySyncEnabled', 'Daily Sync pagi hari'],
                    ['pomodoroEnabled', 'Pomodoro selesai'],
                    ['questDeadlineEnabled', 'Task jatuh tempo'],
                    ['habitReminderEnabled', 'Pengingat habit'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                      checked={settings.reminders[key]}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          reminders: { ...settings.reminders, [key]: e.target.checked },
                        })
                      }
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Digest */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-gray-900 dark:text-white">Digest via Push</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.digests.enabled}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        digests: { ...settings.digests, enabled: e.target.checked },
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {settings.digests.enabled && (
                <div className="grid gap-3 md:grid-cols-3">
                  {(
                    [
                      ['daily', 'Harian'],
                      ['weekly', 'Mingguan'],
                      ['monthly', 'Bulanan'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                        checked={settings.digests.frequencies[key]}
                        onChange={(e) =>
                          onChange({
                            ...settings,
                            digests: {
                              ...settings.digests,
                              frequencies: {
                                ...settings.digests.frequencies,
                                [key]: e.target.checked,
                              },
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

### Checkpoint 5.2 — Update SettingsForm

**Edit file:** `src/app/(admin)/settings/notifications/SettingsForm.tsx`

Tambahkan import:
```typescript
import { PushNotificationSettings } from './PushNotificationSettings'
import type { PushSettings } from '@/lib/notifications/types'
```

Tambahkan di JSX, setelah closing `</div>` dari card Email Notifications (setelah baris 192 `</div>`):
```tsx
      <PushNotificationSettings
        pushSettings={localSettings.push}
        onChange={(push: PushSettings) => setLocalSettings({ ...localSettings, push })}
      />
```

> **Note:** Tombol Save Settings yang sudah ada akan otomatis menyimpan push settings karena `localSettings` sudah include field `push`.

---

## Phase 6 — Testing & Test Page Update

### Checkpoint 6.1 — Tambah test buttons ke /test-notifications

**Edit file:** `src/app/(admin)/test-notifications/page.tsx`

Tambahkan ke array `STEPS`:
```typescript
  {
    id: 'push-daily-sync',
    label: 'Push: Daily Sync Reminder',
    description: 'Test push notification DAILY_SYNC_REMINDER ke user saat ini',
    endpoint: '/api/push/send',
    body: {
      userId: 'YOUR_USER_ID', // diganti programmatically
      notification: {
        type: 'DAILY_SYNC_REMINDER',
        title: 'Selamat pagi! 🌅',
        body: 'Waktunya Daily Sync. Yuk mulai hari ini!',
      },
    },
  },
  {
    id: 'push-habit',
    label: 'Push: Habit Reminder',
    description: 'Test push notification HABIT_REMINDER',
    endpoint: '/api/push/send',
    body: {
      userId: 'YOUR_USER_ID',
      notification: {
        type: 'HABIT_REMINDER',
        title: 'Reminder: Olahraga',
        body: 'Jangan lupa catat habitmu hari ini!',
      },
    },
  },
  {
    id: 'push-habit-cron',
    label: 'Push: Habit Reminder Cron',
    description: 'Test cron push-habit-reminders (semua user, jam sekarang)',
    endpoint: '/api/cron/push-habit-reminders',
  },
```

---

## Final Verification

```bash
# 1. Type check
npm run type-check

# 2. Build check
npm run build

# 3. Manual push test (Chrome DevTools)
# Application → Service Workers → paste JSON → Push
# JSON: { "type": "DAILY_SYNC_REMINDER", "title": "Test", "body": "Test body" }

# 4. End-to-end
# - Buka app di Chrome Android
# - Settings → Notifications → Push Notifications → Aktifkan
# - Izinkan permission
# - Tutup app
# - Trigger via /test-notifications atau curl ke /api/push/send
# - Notifikasi harus muncul di HP
```

---

## File Summary

| File | Action | Phase |
|------|--------|-------|
| `supabase/migrations/20260401000001_push_subscriptions.sql` | Create | 1 |
| `src/lib/notifications/types/index.ts` | Edit — tambah PushSettings | 1 |
| `.env.local` | Edit — tambah VAPID vars | 1 |
| `public/sw-custom.js` | Edit — tambah push event | 2 |
| `src/lib/notifications/services/pushService.ts` | Create | 3 |
| `src/app/api/push/subscribe/route.ts` | Create | 3 |
| `src/app/api/push/send/route.ts` | Create | 3 |
| `src/hooks/usePushSubscription.ts` | Create | 3 |
| `src/components/PWA/index.tsx` | Edit — tambah push prompt | 3 |
| `src/app/api/cron/push-habit-reminders/route.ts` | Create | 4 |
| `src/app/api/cron/daily-pipeline/route.ts` | Edit — tambah Step 3 | 4 |
| `vercel.json` | Edit — tambah habit cron | 4 |
| `src/app/(admin)/settings/notifications/PushNotificationSettings.tsx` | Create | 5 |
| `src/app/(admin)/settings/notifications/SettingsForm.tsx` | Edit — tambah push section | 5 |
| `src/app/(admin)/test-notifications/page.tsx` | Edit — tambah push steps | 6 |

**Total: 15 file (5 create, 10 edit)**
