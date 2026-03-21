# Playwright E2E Setup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Setup Playwright E2E testing infrastructure dengan 4 spec files (auth, daily-sync, quest-management, timer) dan critical Supabase-specific rules.

**Architecture:** Persistent test user di Supabase (global-setup), per-test data cleanup untuk ephemeral data, quarter store injection via addInitScript, workers:1 untuk Supabase rate limit safety.

**Tech Stack:** `@playwright/test`, `dotenv`, Supabase service role key, chromium only.

**Design doc:** `docs/plans/2026-03-21-playwright-e2e-setup-design.md`

---

## Task 1: Install Packages & Config

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `.env.test.example`
- Modify: `.gitignore`

**Step 1: Install Playwright dan dotenv**

```bash
npm install --save-dev @playwright/test dotenv
npx playwright install chromium
```

Expected: chromium browser ter-install, `@playwright/test` dan `dotenv` muncul di devDependencies.

**Step 2: Tambah test:e2e scripts ke package.json**

Di `package.json`, tambahkan di dalam `"scripts"` setelah `"test:coverage"`:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:headed": "playwright test --headed",
"test:e2e:report": "playwright show-report"
```

**Step 3: Buat `playwright.config.ts` di root project**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  workers: 1,
  timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 15000,
    navigationTimeout: 45000,
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**Step 4: Buat `.env.test.example` di root project**

```bash
# E2E Test Environment Variables
# Copy this file to .env.test and fill in your values
# NEVER commit .env.test to git

# Supabase Project URL (same as .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key (same as .env.local)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase Service Role Key (DIFFERENT from anon key - get from Supabase dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Test user credentials (will be created automatically by global-setup)
TEST_USER_EMAIL=test@better-planner.dev
TEST_USER_PASSWORD=TestPassword123!

# NOTE: NEXT_PUBLIC_ENABLE_TIMER_DEV=true sudah ada di .env.local
# Timer tests memerlukan ini untuk berjalan
```

**Step 5: Tambah entries ke `.gitignore`**

Tambahkan di bawah `# testing` section:

```
.env.test
test-results/
playwright-report/
```

**Step 6: Verifikasi**

```bash
npm run type-check
```

Expected: No errors (playwright.config.ts terbaca dengan benar).

**Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.ts .env.test.example .gitignore
git commit -m "feat(e2e): install Playwright and create base config (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Global Setup & Teardown

**Files:**
- Create: `tests/global-setup.ts`
- Create: `tests/global-teardown.ts`
- Create: `tests/.test-env.json` (auto-generated, gitignored)

**Step 1: Tambah `tests/.test-env.json` ke .gitignore**

Tambahkan ke `.gitignore`:
```
tests/.test-env.json
```

**Step 2: Buat `tests/global-setup.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.test' });

async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey || !testEmail || !testPassword) {
    throw new Error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD\n' +
      'Copy .env.test.example to .env.test and fill in values.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Upsert test user — check if exists, create if not (NEVER delete)
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = listData?.users.find((u) => u.email === testEmail);

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    console.log(`[global-setup] Test user already exists: ${userId}`);
  } else {
    const { data: createData, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (error || !createData.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }
    userId = createData.user.id;
    console.log(`[global-setup] Created test user: ${userId}`);
  }

  // Ensure daily_plan exists for today (so daily-sync renders with content)
  const today = new Date().toISOString().split('T')[0];
  const { error: planError } = await supabase
    .from('daily_plans')
    .upsert({ user_id: userId, plan_date: today }, { onConflict: 'user_id,plan_date' });

  if (planError) {
    console.warn(`[global-setup] Could not upsert daily_plan: ${planError.message}`);
  }

  // Write userId to .test-env.json so test helpers can use it
  const testEnvPath = path.join(process.cwd(), 'tests', '.test-env.json');
  fs.writeFileSync(testEnvPath, JSON.stringify({ userId }, null, 2));
  console.log(`[global-setup] Setup complete. userId: ${userId}`);
}

export default globalSetup;
```

**Step 3: Buat `tests/global-teardown.ts`**

```typescript
// No-op teardown — test user is NEVER deleted (persistent)
// Ephemeral test data (quests, etc.) is cleaned up in afterEach hooks
async function globalTeardown() {
  // intentionally empty
}

export default globalTeardown;
```

**Step 4: Verifikasi setup (perlu .env.test terisi)**

Jika sudah punya `.env.test`:
```bash
npx tsx tests/global-setup.ts
```

Expected: `[global-setup] Setup complete. userId: <uuid>` dan file `tests/.test-env.json` terbuat.

**Step 5: Commit**

```bash
git add tests/global-setup.ts tests/global-teardown.ts .gitignore
git commit -m "feat(e2e): add global setup/teardown for persistent test user (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Auth Helper

**Files:**
- Create: `tests/e2e/helpers/auth.ts`

**Step 1: Buat direktori dan file `tests/e2e/helpers/auth.ts`**

```typescript
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load userId yang di-write oleh global-setup
export function getTestUserId(): string {
  const testEnvPath = path.join(process.cwd(), 'tests', '.test-env.json');
  const data = JSON.parse(fs.readFileSync(testEnvPath, 'utf-8'));
  return data.userId;
}

// Login dengan email/password — SELALU sequential, JANGAN Promise.all
export async function login(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  // Sequential steps — Supabase auth tidak bisa di-parallel
  await page.goto('/signin');
  await page.waitForLoadState('domcontentloaded'); // JANGAN 'networkidle' — Supabase cloud hang
  await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });

  await page.locator('[data-testid="signin-email"]').fill(email);
  await page.locator('[data-testid="signin-password"]').fill(password);
  await page.locator('[data-testid="signin-submit"]').click();

  // Wait for redirect ke dashboard — server action → middleware redirect
  await page.waitForURL('**/dashboard', { timeout: 45000 });
}

// Clear cookies dan permissions sebelum setiap test
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}

// Inject Zustand quarterStore ke localStorage SEBELUM navigasi ke daily-sync
// Diperlukan karena default store = Q1, tapi hari ini mungkin bukan Q1
export async function injectQuarterState(
  page: Page,
  year: number,
  quarter: number
): Promise<void> {
  await page.addInitScript(
    ({ y, q }) => {
      localStorage.setItem(
        'quarter-storage',
        JSON.stringify({ state: { year: y, quarter: q }, version: 0 })
      );
    },
    { y: year, q: quarter }
  );
}

// Helper: hitung quarter berdasarkan tanggal hari ini
export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const year = now.getFullYear();
  // Hitung week of year (1-52)
  const startOfYear = new Date(year, 0, 1);
  const weekOfYear = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  const quarter = Math.min(Math.ceil(weekOfYear / 13), 4);
  return { year, quarter };
}
```

*Note: `expect` perlu diimport dari `@playwright/test`. Tambahkan di baris pertama:*
```typescript
import { Page, expect } from '@playwright/test';
```

**Step 2: Commit**

```bash
git add tests/e2e/helpers/auth.ts
git commit -m "feat(e2e): add auth helper with login, session clear, quarter injection (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add data-testid — Auth Components

**Files:**
- Modify: `src/components/auth/SignInForm.server.tsx`
- Modify: `src/app/(full-width-pages)/(auth)/signin/page.tsx`

**Step 1: Tambah data-testid ke email input di SignInForm.server.tsx**

File: `src/components/auth/SignInForm.server.tsx`, line 27-34

```tsx
// SEBELUM:
<input
  name="email"
  type="email"
  required
  disabled={isPending}
  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
  placeholder="Enter your email"
/>

// SESUDAH:
<input
  name="email"
  type="email"
  required
  disabled={isPending}
  data-testid="signin-email"
  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
  placeholder="Enter your email"
/>
```

**Step 2: Tambah data-testid ke password input (line 39-46)**

```tsx
// SEBELUM:
<input
  name="password"
  type={showPassword ? "text" : "password"}
  required
  disabled={isPending}
  className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
  placeholder="Enter your password"
/>

// SESUDAH:
<input
  name="password"
  type={showPassword ? "text" : "password"}
  required
  disabled={isPending}
  data-testid="signin-password"
  className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
  placeholder="Enter your password"
/>
```

**Step 3: Tambah data-testid ke submit button (line 78-91)**

```tsx
// Cari: <button type="submit" disabled={isPending}
// Tambahkan: data-testid="signin-submit"

<button
  type="submit"
  disabled={isPending}
  data-testid="signin-submit"
  className="flex items-center justify-center w-full px-4 py-3 ..."
>
```

**Step 4: Tambah data-testid ke message div di signin/page.tsx**

File: `src/app/(full-width-pages)/(auth)/signin/page.tsx`, line 35-41

```tsx
// SEBELUM:
{message ? <div className={`mb-4 p-3 rounded text-center ${...}`}>
  {message}
</div> : null}

// SESUDAH:
{message ? <div
  data-testid="signin-message"
  className={`mb-4 p-3 rounded text-center ${...}`}
>
  {message}
</div> : null}
```

**Step 5: Verifikasi**

```bash
npm run type-check
```

Expected: No errors.

**Step 6: Commit**

```bash
git add src/components/auth/SignInForm.server.tsx src/app/(full-width-pages)/(auth)/signin/page.tsx
git commit -m "feat(e2e): add data-testid to auth components for E2E tests (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add data-testid — Daily Sync Components

**Files:**
- Modify: `src/app/(admin)/execution/daily-sync/DailyQuest/DailySyncClient.tsx`
- Modify: `src/app/(admin)/execution/daily-sync/DailyQuest/components/TaskItemCard.tsx`
- Modify: `src/app/(admin)/execution/daily-sync/PomodoroTimer/PomodoroTimer.tsx`

**Step 1: Baca file DailySyncClient.tsx dulu**

```bash
# Cari CollapsibleCard usage untuk daily quest dan work quest
grep -n "CollapsibleCard\|daily.*quest\|work.*quest" src/app/(admin)/execution/daily-sync/DailyQuest/DailySyncClient.tsx
```

**Step 2: Tambah data-testid ke daily quest section di DailySyncClient.tsx**

Cari wrapper element untuk daily quest CollapsibleCard, tambahkan:
- `data-testid="daily-sync-daily-quest-section"` pada container daily quests
- `data-testid="daily-sync-work-quest-section"` pada container work quests

Contoh pattern (sesuaikan dengan struktur aktual):
```tsx
<div data-testid="daily-sync-daily-quest-section">
  <CollapsibleCard title="Daily Quest" ...>
    ...
  </CollapsibleCard>
</div>
```

**Step 3: Baca TaskItemCard.tsx**

```bash
grep -n "checkbox\|status\|toggle\|done\|complete" src/app/(admin)/execution/daily-sync/DailyQuest/components/TaskItemCard.tsx | head -20
```

**Step 4: Tambah data-testid ke status toggle di TaskItemCard.tsx**

Cari element status toggle/checkbox, tambahkan `data-testid={`task-status-${item.id}`}`.

**Step 5: Baca PomodoroTimer.tsx**

```bash
grep -n "timeDisplay\|timer-display\|play\|pause\|action" src/app/(admin)/execution/daily-sync/PomodoroTimer/PomodoroTimer.tsx | head -20
```

**Step 6: Tambah data-testid ke timer display dan action button**

- Time display span: `data-testid="timer-display"`
- Play/Pause button: `data-testid="timer-action-btn"`

**Step 7: Verifikasi**

```bash
npm run type-check
```

**Step 8: Commit**

```bash
git add src/app/(admin)/execution/daily-sync/
git commit -m "feat(e2e): add data-testid to daily-sync components (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Add data-testid — Quest Components

**Files:**
- Modify: `src/app/(admin)/quests/daily-quests/components/DailyQuestList.tsx` (atau nearest component)
- Modify: `src/app/(admin)/quests/work-quests/components/ProjectForm.tsx`

**Step 1: Eksplorasi struktur DailyQuestList**

```bash
# Lihat struktur komponen
ls src/app/(admin)/quests/daily-quests/components/
grep -n "input\|button\|submit\|delete\|edit" src/app/(admin)/quests/daily-quests/components/DailyQuestList.tsx | head -30
```

**Step 2: Tambah data-testid ke DailyQuestList.tsx**

Cari dan tambahkan:
- Input field untuk quest baru: `data-testid="daily-quest-new-title-input"`
- Submit button: `data-testid="daily-quest-submit-btn"`
- Quest row container: `data-testid={`daily-quest-item-${quest.id}`}`
- Edit button per quest: `data-testid={`daily-quest-edit-${quest.id}`}`
- Delete button per quest: `data-testid={`daily-quest-delete-${quest.id}`}`

**Step 3: Eksplorasi ProjectForm**

```bash
grep -n "input\|button\|submit\|title" src/app/(admin)/quests/work-quests/components/ProjectForm.tsx | head -20
```

**Step 4: Tambah data-testid ke ProjectForm.tsx**

- Title input: `data-testid="project-form-title"`
- Submit button: `data-testid="project-form-submit"`

**Step 5: Verifikasi**

```bash
npm run type-check
```

**Step 6: Commit**

```bash
git add src/app/(admin)/quests/
git commit -m "feat(e2e): add data-testid to quest management components (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Write auth.spec.ts

**Files:**
- Create: `tests/e2e/auth.spec.ts`

**Step 1: Buat `tests/e2e/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('shows sign-in form at /signin', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="signin-password"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="signin-submit"]')).toBeVisible({ timeout: 15000 });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="signin-email"]').fill('wrong@example.com');
    await page.locator('[data-testid="signin-password"]').fill('wrongpassword');
    await page.locator('[data-testid="signin-submit"]').click();

    // Error redirect ke /signin?message=...
    await page.waitForURL('**/signin**', { timeout: 30000 });
    await expect(page.locator('[data-testid="signin-message"]')).toBeVisible({ timeout: 15000 });
  });

  test('successful login redirects to /dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 45000 });
  });

  test('unauthenticated user redirected from /execution/daily-sync to /signin', async ({ page }) => {
    await page.goto('/execution/daily-sync');
    // Middleware redirect unauthenticated → /signin
    await page.waitForURL('**/signin**', { timeout: 30000 });
    await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });
  });
});
```

**Step 2: Run test untuk verifikasi (perlu dev server running)**

```bash
npm run dev &
sleep 5
npx playwright test tests/e2e/auth.spec.ts --headed
```

Expected: Semua 4 test pass. Jika ada yang fail, debug dengan `--debug`.

**Step 3: Commit**

```bash
git add tests/e2e/auth.spec.ts
git commit -m "feat(e2e): add auth spec tests (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Write daily-sync.spec.ts

**Files:**
- Create: `tests/e2e/daily-sync.spec.ts`

**Step 1: Buat `tests/e2e/daily-sync.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Daily Sync', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);

    // Inject quarter state SEBELUM navigasi — critical untuk Zustand localStorage
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);

    await login(page);
    await page.goto('/execution/daily-sync');
    await page.waitForLoadState('domcontentloaded');

    // Tunggu skeleton hilang — DailySyncClient render setelah SWR fetch
    await expect(
      page.locator('[data-testid="daily-sync-daily-quest-section"]')
    ).toBeVisible({ timeout: 15000 });
  });

  test('daily sync page loads with quest sections visible', async ({ page }) => {
    await expect(
      page.locator('[data-testid="daily-sync-daily-quest-section"]')
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('[data-testid="daily-sync-work-quest-section"]')
    ).toBeVisible({ timeout: 15000 });
  });

  test('task status can be toggled', async ({ page }) => {
    // Cari task status toggle yang ada — jika tidak ada task, test ini skip
    const taskToggles = page.locator('[data-testid^="task-status-"]');
    const count = await taskToggles.count();

    if (count === 0) {
      test.skip(); // Tidak ada task untuk di-toggle, skip gracefully
      return;
    }

    const firstToggle = taskToggles.first();
    const initialAriaChecked = await firstToggle.getAttribute('aria-checked');
    await firstToggle.click();

    // State harus berubah
    await expect(firstToggle).not.toHaveAttribute('aria-checked', initialAriaChecked ?? '', {
      timeout: 10000,
    });
  });
});
```

**Step 2: Run test**

```bash
npx playwright test tests/e2e/daily-sync.spec.ts --headed
```

**Step 3: Commit**

```bash
git add tests/e2e/daily-sync.spec.ts
git commit -m "feat(e2e): add daily-sync spec tests (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Write quest-management.spec.ts

**Files:**
- Create: `tests/e2e/quest-management.spec.ts`

**Step 1: Buat `tests/e2e/quest-management.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { login, clearSession } from './helpers/auth';

dotenv.config({ path: '.env.test' });

function getTestUserId(): string {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests', '.test-env.json'), 'utf-8'));
  return data.userId;
}

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('Daily Quest Management', () => {
  const createdQuestIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/quests/daily-quests');
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (createdQuestIds.length > 0) {
      const supabase = getServiceRoleClient();
      await supabase.from('daily_quests').delete().in('id', createdQuestIds);
      createdQuestIds.length = 0;
    }
  });

  test('can create a new daily quest', async ({ page }) => {
    const testTitle = `E2E Test Quest ${Date.now()}`;

    await page.locator('[data-testid="daily-quest-new-title-input"]').fill(testTitle);
    await page.locator('[data-testid="daily-quest-submit-btn"]').click();

    // Quest baru harus muncul di list
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 15000 });

    // Catat ID untuk cleanup — ambil dari data-testid
    const questRow = page.locator(`[data-testid^="daily-quest-item-"]`).filter({ hasText: testTitle });
    const testId = await questRow.getAttribute('data-testid');
    if (testId) {
      const questId = testId.replace('daily-quest-item-', '');
      createdQuestIds.push(questId);
    }
  });

  test('can delete a quest', async ({ page }) => {
    // Buat quest dulu via Supabase langsung untuk isolation
    const supabase = getServiceRoleClient();
    const userId = getTestUserId();
    const { data } = await supabase
      .from('daily_quests')
      .insert({ user_id: userId, title: `E2E Delete Test ${Date.now()}` })
      .select()
      .single();

    if (!data) throw new Error('Failed to create test quest');
    // Reload untuk tampilkan quest baru
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const deleteBtn = page.locator(`[data-testid="daily-quest-delete-${data.id}"]`);
    await expect(deleteBtn).toBeVisible({ timeout: 15000 });
    await deleteBtn.click();

    // Tunggu confirm dialog dan konfirmasi
    // (sesuaikan selector dengan ConfirmModal yang digunakan)
    const confirmBtn = page.locator('button', { hasText: /hapus|delete|confirm/i }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    // Quest harus hilang dari list
    await expect(page.locator(`[data-testid="daily-quest-item-${data.id}"]`)).not.toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Work Quest Management', () => {
  const createdProjectIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/quests/work-quests');
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (createdProjectIds.length > 0) {
      const supabase = getServiceRoleClient();
      await supabase.from('work_quests').delete().in('id', createdProjectIds);
      createdProjectIds.length = 0;
    }
  });

  test('can create a new project', async ({ page }) => {
    const testTitle = `E2E Project ${Date.now()}`;

    // Cari dan klik "Add Project" button
    await page.locator('button', { hasText: /add project|tambah project/i }).click();

    await expect(page.locator('[data-testid="project-form-title"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="project-form-title"]').fill(testTitle);
    await page.locator('[data-testid="project-form-submit"]').click();

    // Project baru harus muncul
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 15000 });
  });
});
```

**Step 2: Run test**

```bash
npx playwright test tests/e2e/quest-management.spec.ts --headed
```

**Step 3: Commit**

```bash
git add tests/e2e/quest-management.spec.ts
git commit -m "feat(e2e): add quest management spec tests (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Write timer.spec.ts

**Files:**
- Create: `tests/e2e/timer.spec.ts`

**Step 1: Buat `tests/e2e/timer.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
    await page.goto('/execution/daily-sync');
    await page.waitForLoadState('domcontentloaded');
  });

  test('timer display is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible({ timeout: 15000 });
  });

  test('timer shows idle state on load', async ({ page }) => {
    const timerDisplay = page.locator('[data-testid="timer-display"]');
    await expect(timerDisplay).toBeVisible({ timeout: 15000 });

    // Timer idle state menampilkan 25:00 (default Pomodoro duration)
    const displayText = await timerDisplay.textContent();
    expect(displayText).toMatch(/25:00|Ready|Focus/i);
  });

  test('start button is visible and clickable', async ({ page }) => {
    const actionBtn = page.locator('[data-testid="timer-action-btn"]');
    await expect(actionBtn).toBeVisible({ timeout: 15000 });
    await expect(actionBtn).toBeEnabled({ timeout: 5000 });
  });
});
```

**Step 2: Run test**

```bash
npx playwright test tests/e2e/timer.spec.ts --headed
```

**Step 3: Commit**

```bash
git add tests/e2e/timer.spec.ts
git commit -m "feat(e2e): add timer spec tests (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Documentation

**Files:**
- Create: `tests/QUICK_START.md`
- Create: `docs/claude/e2e-testing-patterns.md`
- Modify: `CLAUDE.md`

**Step 1: Buat `tests/QUICK_START.md`**

```markdown
# E2E Testing Quick Start

## Prerequisites

- Node.js 18+
- Project dependencies installed (`npm install`)
- Dev server credentials (Supabase URL, keys)

## First-Time Setup

1. **Copy env template:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in `.env.test`** dengan nilai dari Supabase dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (Settings > API)
   - `TEST_USER_EMAIL` — email untuk test user (akan dibuat otomatis)
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
- Pastikan dev server berjalan atau `npm run dev` bisa dijalankan
- Check `TEST_USER_EMAIL` dan `TEST_USER_PASSWORD` di `.env.test`

**"Cannot find .test-env.json":**
- Run global-setup manual: `npx tsx tests/global-setup.ts`
- Pastikan `.env.test` sudah terisi

**Daily-sync tests gagal dengan "section not visible":**
- Quarter state mungkin tidak ter-inject. Check `injectQuarterState` dipanggil di beforeEach
- Pastikan `daily_plans` row ada untuk hari ini (global-setup membuat ini)

**Timer tests: timer disabled:**
- Pastikan `NEXT_PUBLIC_ENABLE_TIMER_DEV=true` ada di `.env.local`
```

**Step 2: Buat `docs/claude/e2e-testing-patterns.md`**

```markdown
# E2E Testing Patterns — Better Planner

Dokumen ini berisi lessons learned dari school-management project dan adaptasinya untuk better-planner.

## ⛔ CRITICAL: Supabase Anti-Patterns

### 1. JANGAN gunakan `waitForLoadState('networkidle')`

```typescript
// ❌ SALAH — Supabase cloud TIDAK PERNAH resolve networkidle
await page.waitForLoadState('networkidle');

// ✅ BENAR
await page.waitForLoadState('domcontentloaded');
```

**Kenapa:** Supabase membuat persistent WebSocket connections untuk realtime. Browser tidak pernah mencapai state "network idle".

### 2. Login flow HARUS sequential

```typescript
// ❌ SALAH — race condition pada Supabase auth
await Promise.all([
  page.fill('[data-testid="signin-email"]', email),
  page.fill('[data-testid="signin-password"]', password),
]);

// ✅ BENAR — sequential steps
await page.locator('[data-testid="signin-email"]').fill(email);
await page.locator('[data-testid="signin-password"]').fill(password);
await page.locator('[data-testid="signin-submit"]').click();
```

### 3. SELALU gunakan explicit timeout pada `toBeVisible()`

```typescript
// ❌ SALAH — timeout default terlalu pendek untuk network calls
await expect(element).toBeVisible();

// ✅ BENAR — minimum 15000ms untuk Supabase data fetching
await expect(element).toBeVisible({ timeout: 15000 });
```

## Selectors

**WAJIB gunakan `data-testid`** — CSS classes berubah dengan Tailwind, element types tidak spesifik:

```typescript
// ❌ JANGAN
page.locator('.quest-list-item')
page.locator('button').nth(3)
page.locator('tr[role="row"]')

// ✅ GUNAKAN
page.locator('[data-testid="daily-quest-item-uuid"]')
page.locator('[data-testid="daily-quest-submit-btn"]')
```

## Quarter Store Injection

Zustand `quarterStore` persist ke localStorage dan default ke Q1. Jika hari ini bukan Q1, daily-sync test akan gagal karena quarter salah.

```typescript
// Di beforeEach untuk semua daily-sync tests:
const { year, quarter } = getCurrentQuarter();
await injectQuarterState(page, year, quarter); // SEBELUM page.goto()
await page.goto('/execution/daily-sync');
```

## Test Data Management

**Global setup**: Persistent test user + daily_plan untuk today.
**Per-test**: Create data → test → cleanup di afterEach.

```typescript
const createdIds: string[] = [];

test.afterEach(async () => {
  if (createdIds.length > 0) {
    const supabase = getServiceRoleClient();
    await supabase.from('daily_quests').delete().in('id', createdIds);
    createdIds.length = 0;
  }
});
```

**JANGAN hapus test user di teardown** — user persistent, hanya ephemeral data yang dibersihkan.

## Timer Tests

Memerlukan `NEXT_PUBLIC_ENABLE_TIMER_DEV=true` di `.env.local`. Tanpa ini, timer disabled di dev mode.

## Bug Fixing Workflow (P0/P1)

1. **Replicate** → Buat E2E test yang mereproduksi bug
2. **Prove** → Confirm test FAIL (RED)
3. **Fix** → Fix kode
4. **Verify** → Confirm test PASS (GREEN)
5. **Protect** → Test tetap ada sebagai regression guard

```bash
# Jalankan test specific untuk debug
npx playwright test tests/e2e/auth.spec.ts --debug
npx playwright test --grep "shows error on invalid credentials" --headed
```
```

**Step 3: Tambah pointer ke CLAUDE.md**

Di `CLAUDE.md`, di section `## 📖 Additional Documentation`, tambahkan setelah baris Type Management:

```markdown
- **E2E Testing Patterns**: [`docs/claude/e2e-testing-patterns.md`](docs/claude/e2e-testing-patterns.md)
```

**Step 4: Verifikasi CLAUDE.md line count**

```bash
wc -l CLAUDE.md
```

Expected: Tidak lebih dari 310 (masih dalam batas).

**Step 5: Commit**

```bash
git add tests/QUICK_START.md docs/claude/e2e-testing-patterns.md CLAUDE.md
git commit -m "docs(e2e): add E2E testing patterns doc, QUICK_START, and CLAUDE.md pointer (bp-8t9)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Full Test Run & Verification

**Step 1: Run semua E2E tests**

Pastikan `.env.test` sudah terisi dan dev server bisa dijalankan.

```bash
npm run test:e2e
```

Expected: Semua spec files pass. Report HTML terbuat di `playwright-report/`.

**Step 2: Verifikasi Vitest tidak terganggu**

```bash
npm run test:run
```

Expected: Semua unit tests masih pass.

**Step 3: Type check final**

```bash
npm run type-check
```

Expected: No errors.

**Step 4: Verifikasi .env.test tidak ter-commit**

```bash
git status
```

Expected: `.env.test` tidak muncul (ter-gitignore).

**Step 5: Close beads issue**

```bash
bd close bp-8t9 --reason="Playwright E2E testing setup complete with auth, daily-sync, quest-management, and timer specs"
```

**Step 6: Final commit check**

```bash
git log --oneline -8
```

Expected: Semua commits dari Task 1-11 tercatat.

---

## Checklist Selesai

- [ ] `npm run test:e2e` — semua pass
- [ ] `npm run test:run` — Vitest tidak terganggu
- [ ] `npm run type-check` — no errors
- [ ] `.env.test` ada di `.gitignore` (tidak ter-commit)
- [ ] Test user muncul di Supabase dashboard
- [ ] `tests/.test-env.json` ada di `.gitignore`
- [ ] `docs/claude/e2e-testing-patterns.md` terbuat
- [ ] `CLAUDE.md` updated dengan pointer
- [ ] `bd close bp-8t9` — issue ditutup
