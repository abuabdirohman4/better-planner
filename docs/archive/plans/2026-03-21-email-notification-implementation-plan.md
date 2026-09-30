# Email Notification System — Implementation Plan
**Date:** 2026-03-21
**Epic:** bp-2we
**Design doc:** `docs/plans/2026-03-21-email-notification-design.md`

---

## STEP 0: Git Setup (Jalankan Manual di Terminal)

**Tujuan:** Merge update dari master ke branch email-notification supaya kode up-to-date.

```bash
# 1. Checkout branch email-notification
git checkout feature/email-notifications-ai

# 2. Merge master (ambil semua update: Vitest, 3-layer arch, useCurrentUser, dll)
git merge master

# 3. Jika ada conflict, resolve dulu sebelum lanjut
# Biasanya conflict di: package.json (versi deps), docs/claude/ files
# Ikuti aturan: ambil versi master untuk semua file di docs/claude/ dan .beads/

# 4. Setelah merge berhasil, push
git push origin feature/email-notifications-ai
```

**Checkpoint:** `git log --oneline -5` harus tampilkan commit dari master (useCurrentUser, dll).

---

## STEP 1: Centralized Types

**File:** `src/lib/notifications/types/index.ts`

```typescript
export type AICharacter =
  | 'MOTIVATIONAL_COACH'
  | 'ANALYTICAL_ADVISOR'
  | 'BALANCED_MENTOR'
  | 'FRIENDLY_BUDDY'

export interface NotificationSettings {
  enabled: boolean
  frequencies: {
    daily: boolean
    weekly: boolean
    monthly: boolean
    quarterly: boolean
  }
  aiCharacter: AICharacter
  preferredTime: string  // "HH:MM" — saat ini fixed 13:00 WIB
  timezone: string       // "Asia/Jakarta"
  email: string | null   // null = gunakan auth email
}

export interface AIInsight {
  headline: string
  narrative: string
  topWin: string
  challengeSpotted: string
  actionTip: string
  motivationalClose: string
  characterName: string
}

export interface EmailPayload {
  userId: string
  email: string
  userName: string
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  periodLabel: string    // e.g. "21 Maret 2026" atau "Minggu 12, 2026"
  metrics: PerformanceMetrics  // import dari performanceAggregation.ts
  insight: AIInsight
  character: AICharacter
}
```

> **Note:** `PerformanceMetrics` sudah ada di `performanceAggregation.ts`, re-export dari sana atau import langsung.

**Checkpoint:** `npm run type-check` lulus tanpa error.

---

## STEP 2: Service-Role Supabase Client

**File:** `src/lib/supabase/service.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

> **Penting:** Jangan export `createServiceClient` ke client components. Hanya untuk server-side (cron routes).

**Checkpoint:** File terbuat, type-check lulus.

---

## STEP 3: Gemini AI Insight Service

**File:** `src/lib/notifications/services/aiInsightService.ts`

Tidak ada `"use server"` — ini internal module, bukan server action.

**Struktur:**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AICharacter, AIInsight } from '../types'
import type { PerformanceMetrics } from './performanceAggregation'

const CHARACTER_PROMPTS: Record<AICharacter, string> = {
  MOTIVATIONAL_COACH: `You are an enthusiastic motivational coach...`,
  ANALYTICAL_ADVISOR: `You are a data-driven analytical advisor...`,
  BALANCED_MENTOR: `You are a warm, balanced mentor...`,
  FRIENDLY_BUDDY: `You are a casual, supportive friend...`,
}

const CHARACTER_NAMES: Record<AICharacter, string> = {
  MOTIVATIONAL_COACH: 'Coach Alex',
  ANALYTICAL_ADVISOR: 'Advisor Sam',
  BALANCED_MENTOR: 'Mentor Jordan',
  FRIENDLY_BUDDY: 'Buddy Riley',
}

const FALLBACK_INSIGHT: AIInsight = {
  headline: 'Keep up the great work!',
  narrative: 'You made progress today. Every step counts toward your goals.',
  topWin: 'You showed up and did the work.',
  challengeSpotted: 'Consistency is the key to long-term success.',
  actionTip: 'Plan your top 3 priorities for tomorrow.',
  motivationalClose: 'See you tomorrow!',
  characterName: 'Better Planner',
}

function buildUserPrompt(
  metrics: PerformanceMetrics,
  periodType: string,
  userName: string
): string { /* ... */ }

function parseGeminiResponse(raw: string, character: AICharacter): AIInsight { /* ... */ }

export async function generateInsight(
  metrics: PerformanceMetrics,
  character: AICharacter,
  userName: string
): Promise<AIInsight> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: CHARACTER_PROMPTS[character],
    })
    const result = await model.generateContent(buildUserPrompt(metrics, metrics.periodType, userName))
    return parseGeminiResponse(result.response.text(), character)
  } catch (error) {
    console.error('[aiInsightService] Gemini error:', error)
    return { ...FALLBACK_INSIGHT, characterName: CHARACTER_NAMES[character] }
  }
}
```

**Checkpoint:** Buat temp route `GET /api/test/ai-insight` yang call `generateInsight()` dengan fixture metrics dan return JSON. Verifikasi response valid.

---

## STEP 4: Email Templates (React Email)

### 4a. Shared Layout
**File:** `src/lib/notifications/templates/EmailLayout.tsx`

```typescript
import { Html, Head, Body, Container, Section, Text, Hr, Link } from '@react-email/components'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
  userId: string
}

export function EmailLayout({ preview, children, userId }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Header dengan warna #1496F6 */}
          <Section style={{ backgroundColor: '#1496F6', padding: '24px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
              Better Planner
            </Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Hr />
          <Section style={{ padding: '16px', textAlign: 'center' }}>
            <Link href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/unsubscribe?userId=${userId}`}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

### 4b. Period Templates
**Files:**
- `src/lib/notifications/templates/DailyEmailTemplate.tsx`
- `src/lib/notifications/templates/WeeklyEmailTemplate.tsx`
- `src/lib/notifications/templates/MonthlyEmailTemplate.tsx`
- `src/lib/notifications/templates/QuarterlyEmailTemplate.tsx`

Semua accept `EmailPayload` sebagai props dan render `EmailLayout` + content spesifik period.

### 4c. Template Registry
**File:** `src/lib/notifications/templates/index.ts`

```typescript
import { render } from '@react-email/components'
import type { EmailPayload } from '../types'
import { DailyEmailTemplate } from './DailyEmailTemplate'
// ... import lainnya

export async function renderEmailTemplate(payload: EmailPayload): Promise<string> {
  const templateMap = {
    daily: DailyEmailTemplate,
    weekly: WeeklyEmailTemplate,
    monthly: MonthlyEmailTemplate,
    quarterly: QuarterlyEmailTemplate,
  }
  const Template = templateMap[payload.periodType]
  return await render(<Template payload={payload} />)
}
```

**Checkpoint:** Buat route `GET /api/test/email-preview?period=daily` yang render template dengan fixture data dan return `Content-Type: text/html`. Buka di browser, verifikasi visual.

---

## STEP 5: Email Sending Service

**File:** `src/lib/notifications/services/emailService.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject,
      html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[emailService] Send failed:', message)
    return { success: false, error: message }
  }
}
```

**Checkpoint:** Panggil `sendEmail()` langsung dengan email test dari test route. Cek inbox.

---

## STEP 6: Queue Processor

**File:** `src/lib/notifications/services/queueProcessor.ts`

```typescript
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
  const { data: items } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'PENDING')
    .or('next_retry_at.is.null,next_retry_at.lte.' + new Date().toISOString())
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
```

**Checkpoint:** Insert row manual ke `notification_queue` via Supabase dashboard. Hit `/api/cron/process-email-queue` dengan Bearer token. Verifikasi email terkirim dan row pindah ke `notification_history`.

---

## STEP 7: Cron Auth Guard

**File:** `src/lib/notifications/utils/cronAuth.ts`

```typescript
export function verifyCronRequest(request: Request): boolean {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET_TOKEN}`
}
```

Pattern ini sama persis dengan `src/app/api/cron/auto-complete-timers/route.ts`.

---

## STEP 8: 6 Vercel Cron API Routes

### Pattern untuk semua cron routes (ikuti auto-complete-timers):

```typescript
// src/app/api/cron/[route-name]/route.ts
import { verifyCronRequest } from '@/lib/notifications/utils/cronAuth'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // logic here
    return Response.json({ success: true, /* result */ })
  } catch (error) {
    console.error('[cron/route-name]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 8a. aggregate-performance
**File:** `src/app/api/cron/aggregate-performance/route.ts`
**Schedule:** `0 0 * * *` (midnight UTC)

Logic:
1. Fetch users dari `user_profiles` WHERE `notification_settings->>'enabled' = 'true'`
2. Untuk setiap user, panggil `aggregatePerformance(userId, 'daily', yesterday)`
3. Jika hari Senin → juga aggregate 'weekly'
4. Jika tanggal 1 periode bulan → juga aggregate 'monthly'
5. Jika tanggal 1 Q-start → juga aggregate 'quarterly'
6. Gunakan `getYesterday()`, `getLastWeekStart()` dari `periodUtils.ts`

### 8b. queue-daily-emails
**File:** `src/app/api/cron/queue-daily-emails/route.ts`
**Schedule:** `0 6 * * *` (06:00 UTC = 13:00 WIB)

Logic:
1. Fetch users dengan `frequencies.daily = true`
2. Read `performance_summaries` WHERE `user_id = ? AND period_type = 'daily' AND period_start = yesterday`
3. Call `generateInsight(metrics, character, userName)` — 4 detik delay antar user
4. Build `EmailPayload`
5. `INSERT INTO notification_queue ... ON CONFLICT (user_id, period_type, period_start) DO NOTHING`

### 8c-e. queue-weekly/monthly/quarterly-emails
**Files:** `src/app/api/cron/queue-{weekly|monthly|quarterly}-emails/route.ts`
**Schedules:**
- Weekly: `0 6 * * 1` (Senin 06:00 UTC)
- Monthly: `0 6 1 * *`
- Quarterly: `0 6 1 1,4,7,10 *`

Logic sama dengan daily, ganti `period_type` dan query `performance_summaries`.

### 8f. process-email-queue
**File:** `src/app/api/cron/process-email-queue/route.ts`
**Schedule:** `*/15 * * * *`

```typescript
const result = await processEmailQueue(20)
return Response.json({ success: true, ...result })
```

### 8g. vercel.json
**File:** `vercel.json` (root project)

```json
{
  "crons": [
    { "path": "/api/cron/aggregate-performance",   "schedule": "0 0 * * *"       },
    { "path": "/api/cron/queue-daily-emails",       "schedule": "0 6 * * *"       },
    { "path": "/api/cron/queue-weekly-emails",      "schedule": "0 6 * * 1"       },
    { "path": "/api/cron/queue-monthly-emails",     "schedule": "0 6 1 * *"       },
    { "path": "/api/cron/queue-quarterly-emails",   "schedule": "0 6 1 1,4,7,10 *" },
    { "path": "/api/cron/process-email-queue",      "schedule": "*/15 * * * *"    }
  ]
}
```

**Checkpoint per route:** `curl -X POST http://localhost:3000/api/cron/<route> -H "Authorization: Bearer <CRON_SECRET_TOKEN>"` — verifikasi response JSON sukses.

---

## STEP 9: Notification Settings UI

### 9a. Server Actions
**File:** `src/app/(admin)/settings/notifications/actions/notificationSettingsActions.ts`

Ikuti pattern `src/app/(admin)/settings/profile/actions/userProfileActions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NotificationSettings } from '@/lib/notifications/types'

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('notification_settings')
    .eq('id', user.id)
    .single()

  return data?.notification_settings ?? null
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Get existing settings first
  const current = await getNotificationSettings()
  const merged = { ...current, ...settings }

  await supabase
    .from('user_profiles')
    .update({ notification_settings: merged })
    .eq('id', user.id)

  revalidatePath('/settings/notifications')
}
```

### 9b. SWR Key & Hook

**Modify:** `src/lib/swr.ts` — tambah:
```typescript
export const notificationKeys = {
  all: ['notification-settings'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
}
```

**File:** `src/app/(admin)/settings/notifications/hooks/useNotificationSettings.ts`

Ikuti pattern `src/hooks/useCurrentUser.ts`:
```typescript
'use client'

import useSWR from 'swr'
import { notificationKeys } from '@/lib/swr'
import { getNotificationSettings, updateNotificationSettings } from '../actions/notificationSettingsActions'
import type { NotificationSettings } from '@/lib/notifications/types'

export function useNotificationSettings() {
  const { data, isLoading, mutate } = useSWR(
    notificationKeys.settings(),
    () => getNotificationSettings()
  )

  const updateSettings = async (partial: Partial<NotificationSettings>) => {
    await updateNotificationSettings(partial)
    mutate()
  }

  return { settings: data, isLoading, updateSettings }
}
```

### 9c. Settings Form Component
**File:** `src/app/(admin)/settings/notifications/components/NotificationSettingsForm.tsx`

Sections (dalam urutan):
1. **Master toggle** — `<Checkbox>` dari `src/components/form/input/Checkbox.tsx` — jika off, disable semua kontrol lain
2. **Frequency checkboxes** — 4 checkbox: Daily, Weekly, Monthly, Quarterly
3. **AI Character** — 4 radio cards dengan nama + deskripsi singkat karakter
4. **Email address** — `<InputField>` dari `src/components/form/input/InputField.tsx`, placeholder = auth email, kosong = pakai auth email
5. **Delivery info** — text statis: "Email dikirim setiap hari pukul 13:00 WIB"
6. **Save button** — `<Button>` dari `src/components/ui/button/Button.tsx`

On save: panggil `updateSettings()`, toast sukses/error via `sonner`.

### 9d. Page
**File:** `src/app/(admin)/settings/notifications/page.tsx`

```typescript
import { NotificationSettingsForm } from './components/NotificationSettingsForm'

export default function NotificationsSettingsPage() {
  return (
    <div>
      <h1>Notification Settings</h1>
      <NotificationSettingsForm />
    </div>
  )
}
```

### 9e. Settings Navigation
Temukan settings sidebar navigation (cek `src/app/(admin)/settings/` untuk layout atau nav component), tambah link ke `/settings/notifications`.

**Checkpoint:** Buka `/settings/notifications` di browser, simpan settings, verifikasi di Supabase dashboard tabel `user_profiles` kolom `notification_settings` ter-update.

---

## STEP 10: Update Environment Files

**File:** `.env.example` — tambah:
```bash
# Email Notifications
RESEND_API_KEY=re_xxxxxxxxxxxx
GEMINI_API_KEY=AIzaSy...
CRON_SECRET_TOKEN=your-random-secret-min-32-chars
EMAIL_FROM="Better Planner <notifications@yourdomain.com>"
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## End-to-End Verification (Full Pipeline Test)

```bash
# 1. Trigger aggregation untuk user sendiri
curl -X POST http://localhost:3000/api/cron/aggregate-performance \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN"

# 2. Trigger queue email
curl -X POST http://localhost:3000/api/cron/queue-daily-emails \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN"

# 3. Verifikasi row masuk ke notification_queue via Supabase dashboard

# 4. Trigger processor
curl -X POST http://localhost:3000/api/cron/process-email-queue \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN"

# 5. Cek inbox email

# 6. Verifikasi notification_history di Supabase dashboard
```

---

## Suggested Commit Messages

```
feat(notifications): add shared types and service-role client (bp-2we)
feat(notifications): add Gemini AI insight service with 4 characters (bp-2we)
feat(notifications): add React Email templates for all 4 periods (bp-2we)
feat(notifications): add email sending service with Resend (bp-2we)
feat(notifications): add queue processor with retry logic (bp-2we)
feat(notifications): add 6 Vercel cron API routes and vercel.json (bp-2we)
feat(notifications): add notification settings UI in settings page (bp-2we)
chore: add email notification env vars to .env.example
```

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
