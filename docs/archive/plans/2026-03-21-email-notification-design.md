# Email Notification System — Design Document
**Date:** 2026-03-21
**Epic:** bp-2we — Setup email notification system with AI integration
**Branch:** feature/email-notifications-ai (merge master first)

---

## Problem

Branch `feature/email-notifications-ai` sudah berisi Phase 1-2 (database schema + performance aggregation) tapi ketinggalan banyak perubahan di master:
- Vitest setup & 3-layer architecture refactor
- useCurrentUser hook & dynamic user profiles
- Beads init & docs migration

Branch perlu di-rebase/merge ke master sebelum lanjut, lalu implementasi Phase 3-7.

---

## Current State (sudah ada di branch)

### Database Tables (sudah di-migrate ke Supabase)
| Table | Kolom Utama |
|-------|-------------|
| `user_profiles.notification_settings` | JSONB: enabled, frequencies, aiCharacter, preferredTime, timezone |
| `performance_summaries` | periodType, periodStart, periodEnd, metrics (22 kolom) |
| `notification_queue` | status, payload JSONB, retry_count, resend_message_id |
| `notification_history` | user_id, period_type, sent_at, resend_message_id |

### Dependencies (sudah di-install)
- `resend@^6.9.1` — email sending
- `react-email@^5.2.5` + `@react-email/components@^1.0.6` — email templates
- `@google/generative-ai@^0.24.1` — AI insight generation

### Services (sudah ada)
- `src/lib/notifications/services/performanceAggregation.ts` — aggregasi dari activity_logs, daily_plan_items, tasks, milestones, quests. Exports: `getDailyPerformance`, `getWeeklyPerformance`, `getMonthlyPerformance`, `getQuarterlyPerformance`, `aggregatePerformance`, `savePerformanceSummary`
- `src/lib/notifications/utils/periodUtils.ts` — kalkulasi periode & timezone WIB (UTC+7)
- `src/app/api/test/performance-aggregation/route.ts` — test API
- `src/app/(admin)/test-performance/page.tsx` — test UI

---

## Architecture Decisions

### Decision 1: Supabase Client untuk Cron Routes
**Problem:** Cron routes tidak punya browser session, tapi `createClient()` dari `src/lib/supabase/server.ts` berbasis cookie.
**Decision:** Buat `src/lib/supabase/service.ts` dengan service-role key untuk digunakan di semua cron routes.
**Why:** Service-role key bypass RLS, cocok untuk server-to-server operations seperti cron.

### Decision 2: AI Insight Generation Timing
**Problem:** Di mana memanggil Gemini — saat aggregasi (midnight) atau saat queue-ing (pagi)?
**Decision:** Panggil Gemini di cron queue-population (pagi hari), BUKAN saat agregasi.
**Why:** Aggregasi harus cepat (banyak users, midnight). Gemini latency 2-5s per call. Pisahkan concerns.

### Decision 3: Email Template Structure
**Decision:** Gunakan `react-email` untuk render template ke HTML string, lalu pass ke Resend.
**Why:** React Email sudah terinstall, component-based dan mudah maintain. Preview bisa di browser.

### Decision 4: Notification Settings Storage
**Decision:** Simpan di `user_profiles.notification_settings` JSONB (sudah ada kolom-nya).
**Why:** Sudah ada di schema Phase 1. Satu query untuk get semua user prefs.

### Decision 5: Cron Authentication
**Decision:** Gunakan `CRON_SECRET_TOKEN` di Authorization header, ikuti pattern `auto-complete-timers/route.ts`.
**Why:** Vercel otomatis inject header ini saat invoke cron. Konsisten dengan pattern existing.

### Decision 6: Rate Limiting untuk Gemini Free Tier
**Problem:** Gemini 1.5 Flash free tier = 15 RPM. Jika banyak users, akan kena limit.
**Decision:** Tambah 4 detik delay antar Gemini calls di queue-population crons.
**Why:** 15 RPM = 1 call per 4 detik. Simple dan tidak butuh library tambahan.

### Decision 7: Preferred Delivery Time (Simplified)
**Decision:** Fixed delivery time 1 PM WIB (06:00 UTC) untuk semua users. UI bisa menampilkan ini.
**Why:** Per-user preferred time butuh cron yang lebih kompleks. MVP dulu dengan fixed time.

---

## Data Flow

```
[Midnight UTC]
aggregate-performance cron
  → aggregatePerformance(userId, periodType, date)
  → savePerformanceSummary()
  → performance_summaries table

[06:00 UTC = 13:00 WIB]
queue-daily/weekly/monthly/quarterly cron
  → Read user_profiles WHERE notification_settings->>'enabled' = 'true'
  → Filter by frequency setting
  → Read performance_summaries for user + period
  → generateInsight(metrics, character, userName)  ← Gemini API
  → Build EmailPayload
  → INSERT notification_queue ON CONFLICT DO NOTHING

[Every 15 minutes]
process-email-queue cron
  → Fetch pending queue items (max 20 per run)
  → Lock: status = 'PROCESSING'
  → renderEmailTemplate(payload)  ← React Email
  → sendEmail(to, subject, html)  ← Resend
  → On success: status = 'SENT', insert notification_history
  → On failure: retry_count++, set next_retry_at or FAILED (>= 3 retries)
```

---

## File Structure (yang akan dibuat)

```
src/
├── lib/
│   ├── supabase/
│   │   └── service.ts                          ← NEW: service-role client
│   └── notifications/
│       ├── types/
│       │   └── index.ts                        ← NEW: shared types
│       ├── services/
│       │   ├── performanceAggregation.ts       ← EXISTS (branch)
│       │   ├── aiInsightService.ts             ← NEW: Gemini integration
│       │   ├── emailService.ts                 ← NEW: Resend wrapper
│       │   └── queueProcessor.ts              ← NEW: queue processor
│       ├── templates/
│       │   ├── EmailLayout.tsx                ← NEW: shared layout
│       │   ├── DailyEmailTemplate.tsx         ← NEW
│       │   ├── WeeklyEmailTemplate.tsx        ← NEW
│       │   ├── MonthlyEmailTemplate.tsx       ← NEW
│       │   ├── QuarterlyEmailTemplate.tsx     ← NEW
│       │   └── index.ts                       ← NEW: template registry
│       └── utils/
│           ├── periodUtils.ts                 ← EXISTS (branch)
│           └── cronAuth.ts                    ← NEW: auth guard
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   ├── aggregate-performance/
│   │   │   │   └── route.ts                   ← NEW
│   │   │   ├── queue-daily-emails/
│   │   │   │   └── route.ts                   ← NEW
│   │   │   ├── queue-weekly-emails/
│   │   │   │   └── route.ts                   ← NEW
│   │   │   ├── queue-monthly-emails/
│   │   │   │   └── route.ts                   ← NEW
│   │   │   ├── queue-quarterly-emails/
│   │   │   │   └── route.ts                   ← NEW
│   │   │   └── process-email-queue/
│   │   │       └── route.ts                   ← NEW
│   │   └── test/
│   │       ├── performance-aggregation/       ← EXISTS (branch)
│   │       └── email-preview/
│   │           └── route.ts                   ← NEW: template preview
│   └── (admin)/
│       ├── test-performance/                  ← EXISTS (branch)
│       └── settings/
│           └── notifications/
│               ├── actions/
│               │   └── notificationSettingsActions.ts  ← NEW
│               ├── hooks/
│               │   └── useNotificationSettings.ts      ← NEW
│               ├── components/
│               │   └── NotificationSettingsForm.tsx    ← NEW
│               └── page.tsx                            ← NEW
└── lib/
    └── swr.ts                                 ← MODIFY: add notificationKeys
vercel.json                                    ← NEW: cron schedule
```

---

## AI Character Personalities

| Character | Tone | Style |
|-----------|------|-------|
| `MOTIVATIONAL_COACH` | Energik, action-first | Exclamation marks, imperatives, "You can do this!" |
| `ANALYTICAL_ADVISOR` | Data-driven, tenang | Cite percentages, bullet reasoning, logical |
| `BALANCED_MENTOR` | Hangat tapi grounded | Acknowledge effort + room to grow |
| `FRIENDLY_BUDDY` | Casual, supportive | Informal language, "hey!", emoji sparingly |

---

## Email Template Visual Structure

**All templates share:**
- Header: Better Planner logo + brand color `#1496F6`
- AI Character greeting
- Period label (e.g., "Week 12, 2026" atau "21 Maret 2026")
- Hero metrics (focus time, sessions, completion rate)
- AI narrative (headline + story)
- Top win & action tip
- Footer dengan unsubscribe link

**Additional per period:**
- Daily: top 3 completed tasks
- Weekly: quest breakdown table + weekly goals progress bar
- Monthly: 4-week trend arrows (up/down vs previous month)
- Quarterly: main quest progress card + milestone highlights

---

## Environment Variables

```bash
# Tambah ke .env.local dan .env.example
RESEND_API_KEY=re_xxxxxxxxxxxx
GEMINI_API_KEY=AIzaSy...
CRON_SECRET_TOKEN=your-random-secret-min-32-chars
EMAIL_FROM="Better Planner <notifications@yourdomain.com>"
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # dari Supabase dashboard → Settings → API
```

**Juga set di Vercel:** Project Settings → Environment Variables → semua key di atas.

---

## Existing Patterns to Follow

| Pattern | File Referensi |
|---------|----------------|
| Cron route auth + error handling | `src/app/api/cron/auto-complete-timers/route.ts` |
| JSONB settings read/write | `src/app/(admin)/settings/profile/actions/userProfileActions.ts` |
| SWR hook pattern | `src/hooks/useCurrentUser.ts` |
| SWR key registration | `src/lib/swr.ts` |
| Server action pattern | `src/app/(admin)/settings/profile/actions/userProfileActions.ts` |
| Existing UI components | `src/components/ui/button/Button.tsx`, `src/components/form/input/Checkbox.tsx` |
