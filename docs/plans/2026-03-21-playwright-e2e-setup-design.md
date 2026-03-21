# Playwright E2E Setup — Design

## Context

Better Planner membutuhkan E2E testing untuk:
1. **Bug fixing workflow P0/P1**: Replicate → Write failing test → Fix → Verify → Protect
2. **Regression protection**: Fitur kritis tidak rusak di future releases
3. **TDD untuk fitur baru**: Executable specs sebelum implementasi

Saat ini hanya ada Vitest unit tests (`src/**/__tests__/`). Playwright akan hidup di `tests/e2e/` — direktori terpisah, tidak ada konflik.

---

## Architecture

### Test Isolation Strategy

```
global-setup.ts
  └── Upsert persistent test user (never delete)
  └── Create daily_plan for today (upsert, idempotent)

Per-test:
  beforeEach → clearSession + login
  afterEach  → delete ephemeral data (quests created during test)
```

**Kenapa bukan semua di global-setup?** Quest CRUD tests harus isolated — jika test gagal di tengah, run berikutnya tidak boleh menemukan stale data.

### Quarter Store Problem

`quarterStore` (Zustand + localStorage) default ke Q1 current year. Jika hari ini bukan Q1, daily-sync akan show week 1 Q1 yang kosong.

**Solusi**: `injectQuarterState(page, year, quarter)` — `page.addInitScript` meng-inject localStorage SEBELUM navigasi:

```typescript
await page.addInitScript(({ year, quarter }) => {
  localStorage.setItem('quarter-storage', JSON.stringify({
    state: { year, quarter },
    version: 0
  }));
}, { year, quarter });
await page.goto('/execution/daily-sync');
```

### Supabase Critical Rules (dari school-management lessons)

| ❌ JANGAN | ✅ GUNAKAN |
|-----------|-----------|
| `waitForLoadState('networkidle')` | `waitForLoadState('domcontentloaded')` |
| `Promise.all([fill, fill, click])` | Sequential: fill → fill → click |
| `toBeVisible()` tanpa timeout | `toBeVisible({ timeout: 15000 })` |
| CSS classes sebagai selector | `data-testid` attributes |

---

## File Structure

```
playwright.config.ts                    ← root config
.env.test.example                       ← template env vars
tests/
  global-setup.ts                       ← upsert user + daily_plan
  global-teardown.ts                    ← no-op
  QUICK_START.md                        ← setup instructions
  e2e/
    helpers/
      auth.ts                           ← login(), clearSession(), injectQuarterState()
    auth.spec.ts                        ← login/logout/redirect tests
    daily-sync.spec.ts                  ← page load + task toggle
    quest-management.spec.ts            ← CRUD daily/work quests
    timer.spec.ts                       ← timer display + start/pause
docs/claude/
  e2e-testing-patterns.md              ← Supabase rules reference
```

---

## playwright.config.ts Key Decisions

```typescript
{
  testDir: './tests/e2e',
  workers: 1,              // Supabase rate limits + shared test data
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 15000,
    navigationTimeout: 45000,
    serviceWorkers: 'block',  // prevent PWA SW interference
  },
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  reporter: [['list'], ['html', { open: 'never' }]],
}
```

---

## data-testid Strategy

**Prinsip**: Hanya tambah `data-testid`, tidak ubah logic atau styling.

| Page/Component | Element | testid |
|----------------|---------|--------|
| SignInForm | Email input | `signin-email` |
| SignInForm | Password input | `signin-password` |
| SignInForm | Submit button | `signin-submit` |
| signin/page.tsx | Message div | `signin-message` |
| DailySyncClient | Daily quest section | `daily-sync-daily-quest-section` |
| DailySyncClient | Work quest section | `daily-sync-work-quest-section` |
| TaskItemCard | Status toggle | `task-status-{id}` |
| PomodoroTimer | Time display | `timer-display` |
| PomodoroTimer | Action button | `timer-action-btn` |
| DailyQuestList | New title input | `daily-quest-new-title-input` |
| DailyQuestList | Submit button | `daily-quest-submit-btn` |
| DailyQuestList | Quest row | `daily-quest-item-{id}` |
| DailyQuestList | Edit button | `daily-quest-edit-{id}` |
| DailyQuestList | Delete button | `daily-quest-delete-{id}` |
| ProjectForm | Title input | `project-form-title` |
| ProjectForm | Submit button | `project-form-submit` |

---

## .env.test Required Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # untuk global-setup admin operations
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
# NEXT_PUBLIC_ENABLE_TIMER_DEV=true sudah ada di .env.local
```

---

## Test Scope per Spec File

### auth.spec.ts
1. Halaman /signin menampilkan form
2. Error message muncul saat kredensial salah
3. Login sukses redirect ke /dashboard
4. User tidak terautentikasi redirect dari /execution/daily-sync ke /signin

### daily-sync.spec.ts
1. Page load dengan quest sections visible
2. Task status bisa di-toggle (mark done)
*Note: beforeEach inject quarter state yang benar*

### quest-management.spec.ts
Daily Quests: create, edit title, delete
Work Quests: create project, add task to project
*Note: afterEach cleanup via service role client*

### timer.spec.ts
1. Timer display visible
2. Idle state UI benar
3. Start timer → display berubah setelah 2 detik
4. Pause timer → state update

---

## Verification Checklist

- [ ] `npm run test:e2e` — semua spec pass
- [ ] `npm run test:e2e:ui` — UI mode tampil test tree
- [ ] `.env.test` tidak ter-commit (gitignore works)
- [ ] `npm run type-check` — no TypeScript errors
- [ ] Test user muncul di Supabase dashboard setelah first run
- [ ] `npm run test:run` masih works (Vitest tidak terganggu)
