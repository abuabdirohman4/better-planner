# E2E Testing Quick Start

## Prerequisites

- Node.js 18+
- Project dependencies installed (`npm install`)
- Supabase project credentials

## First-Time Setup

1. **Copy env template:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in `.env.test`** dengan nilai dari Supabase dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (Settings > API > service_role)
   - `TEST_USER_EMAIL` — email untuk test user (akan dibuat otomatis oleh global-setup)
   - `TEST_USER_PASSWORD` — password minimal 8 karakter

3. **Install Playwright browser:**
   ```bash
   npx playwright install chromium
   ```

## Running Tests

```bash
# Run semua E2E tests
npm run test:e2e

# Interactive UI mode (recommended untuk debugging)
npm run test:e2e:ui

# Run dengan browser visible
npm run test:e2e:headed

# Debug mode (step-by-step)
npm run test:e2e:debug

# Lihat HTML report dari run terakhir
npm run test:e2e:report
```

## Test Structure

```
tests/
  global-setup.ts         # Buat test user di Supabase (auto-run sebelum tests)
  global-teardown.ts      # No-op
  e2e/
    helpers/auth.ts       # login(), clearSession(), injectQuarterState()
    auth.spec.ts          # Login, redirect, error tests
    daily-sync.spec.ts    # Daily sync page tests
    quest-management.spec.ts  # CRUD quests tests
    timer.spec.ts         # Timer tests
```

## Troubleshooting

**Test timeout pada login:**
- Pastikan dev server bisa dijalankan (`npm run dev`)
- Check `TEST_USER_EMAIL` dan `TEST_USER_PASSWORD` di `.env.test`

**"Cannot find .test-env.json":**
- Run global-setup manual: `npx tsx tests/global-setup.ts`
- Pastikan `.env.test` sudah terisi lengkap

**Daily-sync tests gagal dengan "section not visible":**
- Quarter state mungkin tidak ter-inject dengan benar
- Pastikan `injectQuarterState` dipanggil di `beforeEach` SEBELUM navigasi

**Timer tests gagal:**
- Pastikan `NEXT_PUBLIC_ENABLE_TIMER_DEV=true` ada di `.env.local`
