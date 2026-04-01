# Web Push Notifications — Design Document

**Date:** 2026-03-31
**Feature:** Web Push Notifications (Hybrid: Push + Email fallback)
**Branch:** feature/web-push-notifications

---

## 1. Problem & Goal

Better Planner sudah punya email notifications (Resend + Gemini AI) dan timer notifications lokal (Service Worker). Yang belum ada: **notifikasi yang muncul di HP user meskipun browser/app tidak dibuka**.

**Goal:** Tambah Web Push Notifications untuk:
1. **Reminders** — Daily Sync pagi, quest deadlines, habit reminders, Pomodoro selesai
2. **Digest** — ringkasan performa harian/mingguan/bulanan via push (user-configurable)
3. **Fallback** — email pipeline tetap jalan untuk user yang tidak support push

---

## 2. Architecture Decisions

### 2.1 Push Subscription Storage

**Decision: Tabel terpisah `push_subscriptions`** (bukan JSONB array di `user_profiles`)

Alasan:
- Satu user bisa punya multiple devices (HP + laptop + tablet)
- Setiap device punya `endpoint` unik — perlu delete per-endpoint saat 410 Gone
- Query "semua subscriptions user X" lebih efisien dengan relational table
- JSONB array tidak bisa upsert/delete per-endpoint tanpa replace seluruh array

### 2.2 Push Settings Storage

**Decision: Nested di `notification_settings` JSONB** sebagai field `push?` (optional)

Alasan:
- Reuse save/load infrastructure existing (`updateNotificationSettings()`)
- Backward compatible — baris lama yang tidak punya `push` key tetap valid
- Tidak perlu kolom baru di `user_profiles`

### 2.3 Service Worker Payload

**Decision: Type-based dispatch** — field `type` di JSON payload menentukan template notifikasi

```
DAILY_SYNC_REMINDER | POMODORO_COMPLETE | QUEST_DEADLINE | HABIT_REMINDER | DIGEST
```

SW menjadi single source of truth untuk tampilan notifikasi.

### 2.4 Security

**Decision: `/api/push/send` dilindungi `verifyCronRequest`** (bukan user auth)

Cron jobs adalah satu-satunya caller. User tidak bisa trigger push ke user_id lain.

### 2.5 Cron Strategy (Vercel Hobby Plan)

Hobby plan limit: **2 cron jobs**. Saat ini sudah ada 1 (`daily-pipeline`).

- Push reminders yang berjalan harian → **konsolidasi ke `daily-pipeline`** yang sudah ada
- Habit reminders → butuh hourly run → **1 cron tambahan** (total = 2, masih dalam limit)

---

## 3. Data Model

### Tabel Baru: `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE UNIQUE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_sub_select" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_sub_insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_sub_delete" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
```

### Type Extension: `NotificationSettings`

File: `src/lib/notifications/types/index.ts`

```typescript
export interface PushReminderSettings {
  dailySyncEnabled: boolean
  dailySyncTime: string          // "HH:MM" WIB
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

// Extend existing NotificationSettings — push adalah optional
export interface NotificationSettings {
  enabled: boolean
  frequencies: { daily: boolean; weekly: boolean; monthly: boolean; quarterly: boolean }
  aiCharacter: AICharacter
  preferredTime: string
  timezone: string
  email: string | null
  language: EmailLanguage
  push?: PushSettings          // ← NEW (optional, backward compatible)
}
```

---

## 4. Environment Variables

Tambah ke `.env.local` dan Vercel dashboard:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # browser-safe, dipakai di client hook
VAPID_PRIVATE_KEY=              # server only
VAPID_SUBJECT=                  # mailto:admin@yourdomain.com
```

Generate keypair (sekali saja):
```bash
npx web-push generate-vapid-keys
```

---

## 5. Component & Service Design

### 5.1 Push Service (Server-side)

File: `src/lib/notifications/services/pushService.ts`

```typescript
// Responsibilities:
// - webpush.setVapidDetails() saat module load
// - sendPushToUser(userId, notification): fetch subscriptions → kirim ke semua → cleanup 410/404
// - sendPushToMany(userIds[], notification): parallel sendPushToUser
// - Auto-delete subscription expired (410 Gone) saat send
```

### 5.2 Subscribe API Routes

File: `src/app/api/push/subscribe/route.ts`

```typescript
// POST — upsert subscription ke push_subscriptions
//   Body: PushSubscription.toJSON() → { endpoint, keys: { p256dh, auth } }
//   Auth: createClient() user auth
//   Behavior: upsert ON CONFLICT(endpoint)

// DELETE — hapus subscription by endpoint
//   Body: { endpoint }
//   Auth: createClient() user auth
```

File: `src/app/api/push/send/route.ts`

```typescript
// POST — internal only
//   Auth: verifyCronRequest()
//   Body: { userId, notification: { type, title, body, data? } }
//   Delegate ke pushService.sendPushToUser()
```

### 5.3 Client Hook

File: `src/hooks/usePushSubscription.ts`

```typescript
// States: permissionState | isSubscribed | isLoading | isSupported
// subscribe(): requestPermission → pushManager.subscribe(VAPID) → POST /api/push/subscribe
// unsubscribe(): DELETE /api/push/subscribe → sub.unsubscribe()
// urlBase64ToUint8Array(key): convert VAPID public key untuk PushManager.subscribe()
```

### 5.4 Service Worker Push Event

File: `public/sw-custom.js` — tambah setelah `sync` event listener:

```javascript
self.addEventListener('push', (event) => { ... })

// handlePushPayload({ type, title, body, data })
// switch(type) → showNotification dengan template berbeda per type
// Notification options per type:
//   DAILY_SYNC_REMINDER → tag: 'daily-sync', actions: [start, dismiss]
//   POMODORO_COMPLETE   → tag: 'pomodoro', requireInteraction: true
//   QUEST_DEADLINE      → tag: `quest-${data.taskId}`, actions: [view, dismiss]
//   HABIT_REMINDER      → tag: `habit-${data.habitId}`, actions: [log, dismiss]
//   DIGEST              → tag: `digest-${data.periodType}`, actions: [view]

// focusOrOpen(url): helper — focus existing window atau openWindow
// Extend notificationclick: tambah cases untuk action baru
```

### 5.5 Settings UI Components

File: `src/app/(admin)/settings/notifications/PushNotificationSettings.tsx`

3 visual states:
1. **Unsupported** — info card (iOS tanpa PWA install, atau browser lama)
2. **Not subscribed** — tombol "Enable Push Notifications"
3. **Subscribed** — toggles reminders + digest frequencies

iOS messages:
- Tidak install PWA → "Install app ke Home Screen untuk push notification"
- iOS < 16.4 → "Update ke iOS 16.4+ untuk push notification"
- Permission denied → "Push diblokir — ubah di pengaturan browser"

File: `src/app/(admin)/settings/notifications/SettingsForm.tsx` — tambah section baru:

```tsx
// Setelah card Email Notifications, tambah card "Push Notifications":
<PushNotificationSettings
  pushSettings={localSettings.push}
  onChange={(push) => setLocalSettings({ ...localSettings, push })}
/>
// Tombol Save Settings yang ada sudah handle push karena localSettings sudah include push
```

### 5.6 PWA Component Push Prompt

File: `src/components/PWA/index.tsx`

Setelah SW registration resolve, tambah logika:
- Cek `'PushManager' in window` (isSupported)
- Cek `Notification.permission === 'default'`
- Jika belum subscribe dan permission default → set state `showPushPrompt = true` setelah delay 8 detik
- Jangan tampilkan bersamaan dengan install prompt
- Jangan tampilkan di landing page (sudah ada `isLandingPage` check)
- Push prompt message: "Dapatkan reminder harian, habit, dan task — bahkan saat app tertutup"

---

## 6. Cron Jobs Design

### Consolidated ke `daily-pipeline/route.ts`

Tambahkan **Step 3** di akhir POST handler yang sudah ada:

```typescript
// --- Step 3: Push Reminders & Digests ---
// Jalankan hanya untuk users yang push.enabled = true

// 3a. Daily Sync Reminder (semua user push enabled)
// 3b. Quest Deadline (users dengan push.reminders.questDeadlineEnabled)
// 3c. Push Digest — daily/weekly/monthly (users dengan push.digests enabled)
//     Gunakan AI insights yang sudah di-generate di Step 2 (reuse metrics)

// Note: Pomodoro completion push sudah ditangani oleh client-side SW saat in-app
// Saat background (app tertutup), useBackgroundTimer sudah handle timeout
// Push POMODORO_COMPLETE dari server hanya sebagai fallback jika user tidak memiliki SW aktif
```

### Cron Baru: `push-habit-reminders/route.ts`

Berjalan setiap jam: `0 * * * *`

```typescript
// Query habits WHERE target_time IS NOT NULL AND is_archived = false
// Filter: target_time jatuh di window jam sekarang (UTC+7)
// Filter: belum ada habit_completions untuk hari ini
// Join ke push_subscriptions via user_id
// Filter: push.reminders.habitReminderEnabled = true
// Kirim push HABIT_REMINDER per user (batch jika banyak habit, 1 notif)
```

### `vercel.json` Update

```json
{
  "crons": [
    { "path": "/api/cron/daily-pipeline", "schedule": "0 6 * * *" },
    { "path": "/api/cron/push-habit-reminders", "schedule": "0 * * * *" }
  ]
}
```

---

## 7. Graceful Degradation

| Kondisi | Behavior |
|---------|----------|
| Browser tidak support PushManager | Settings show info banner, tidak ada tombol enable |
| iOS tanpa install PWA | Banner "tambahkan ke Home Screen" |
| iOS < 16.4 | Banner "update iOS" |
| Permission denied | Banner dengan instruksi cara enable di browser settings |
| Push subscription expired (410) | pushService auto-delete subscription, email fallback tetap jalan |
| Push sent=0 (tidak ada subscription) | Email pipeline tidak terpengaruh (berjalan independen) |

**Fallback chain:** Push berhasil → tidak perlu email untuk tipe yang sama. Tidak ada subscription → email tetap jalan seperti biasa.

---

## 8. Testing Checklist

- [ ] **Phase 1** — `npm run type-check` pass setelah type extension
- [ ] **Phase 1** — Migration applied, tabel `push_subscriptions` ada di Supabase
- [ ] **Phase 2** — SW diupdate, test push event dengan DevTools → Application → Push
- [ ] **Phase 3** — POST `/api/push/subscribe` simpan row, DELETE hapus row
- [ ] **Phase 3** — `usePushSubscription` hook: subscribe flow bekerja di Chrome Android
- [ ] **Phase 3** — PWA push prompt muncul setelah delay (tidak bersamaan dengan install prompt)
- [ ] **Phase 4** — Tambah tombol trigger push di `/test-notifications` page untuk setiap tipe
- [ ] **Phase 4** — `push-habit-reminders` cron: test dengan habit yang `target_time` = jam sekarang
- [ ] **Phase 5** — Settings page: 3 state (unsupported/not-subscribed/subscribed) tampil benar
- [ ] **Phase 5** — Settings changes tersimpan ke `notification_settings.push` di DB
- [ ] **iOS** — Safari tanpa PWA install: tampil banner info, tidak ada push prompt
- [ ] **iOS 16.4+ dengan PWA** — permission prompt muncul, push bekerja
- [ ] **Chrome Android** — full flow: subscribe → tutup app → terima push notifikasi
