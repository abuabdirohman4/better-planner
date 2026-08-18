# E2E Testing Patterns — Better Planner

Lessons learned dari school-management project, diadaptasi untuk better-planner dengan Supabase.

## Critical Rules

### 1. JANGAN gunakan `waitForLoadState('networkidle')`

```typescript
// SALAH — Supabase cloud TIDAK PERNAH resolve networkidle
await page.waitForLoadState('networkidle');

// BENAR
await page.waitForLoadState('domcontentloaded');
```

Supabase membuat persistent WebSocket connections. Browser tidak pernah mencapai "network idle".

### 2. Login HARUS sequential — JANGAN Promise.all

```typescript
// SALAH — race condition
await Promise.all([
  page.fill('[data-testid="signin-email"]', email),
  page.fill('[data-testid="signin-password"]', password),
]);

// BENAR
await page.locator('[data-testid="signin-email"]').fill(email);
await page.locator('[data-testid="signin-password"]').fill(password);
await page.locator('[data-testid="signin-submit"]').click();
```

### 3. SELALU explicit timeout pada `toBeVisible()`

```typescript
// SALAH — default timeout terlalu pendek untuk network calls
await expect(element).toBeVisible();

// BENAR — minimum 15000ms
await expect(element).toBeVisible({ timeout: 15000 });
```

### 4. Gunakan `data-testid` — JANGAN CSS classes

```typescript
// SALAH — CSS classes berubah dengan Tailwind
page.locator('.quest-list-item')
page.locator('button').nth(3)

// BENAR — stable selectors
page.locator('[data-testid="daily-quest-item-uuid"]')
page.locator('[data-testid="daily-quest-submit-btn"]')
```

## Quarter Store Injection

Zustand `quarterStore` persist ke localStorage, default ke Q1. Jika hari ini bukan Q1, daily-sync tests akan gagal.

```typescript
// Di beforeEach untuk semua daily-sync dan timer tests:
const { year, quarter } = getCurrentQuarter();
await injectQuarterState(page, year, quarter); // SEBELUM page.goto()
await login(page);
await page.goto('/execution/daily-sync');
```

## Test Data Management

- **Global setup**: Persistent test user + daily_plan untuk today
- **Per-test**: Create data → test → cleanup di `afterEach`
- **JANGAN hapus test user** di teardown — user persistent, hanya ephemeral data yang dibersihkan

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

## Timer Tests

Memerlukan `NEXT_PUBLIC_ENABLE_TIMER_DEV=true` di `.env.local`. Tanpa ini, timer disabled di dev mode dan tests akan gagal.

## Seeding & Cleanup Helper

Pakai `tests/e2e/helpers/db.ts` — jangan duplikasi service-role client di spec:

```ts
import { getServiceRoleClient, getTestUserId, cleanupIds } from './helpers/db';
const created: string[] = [];
// seed → created.push(id) ; afterEach → await cleanupIds('tasks', created);
```

Quest pages (side/work) filter by `created_at` dalam quarter aktif → **selalu** `injectQuarterState(page, ...getCurrentQuarter())` sebelum `login`.

## Coverage Map (spec → area)

| Spec | Area | Testid kunci |
|---|---|---|
| `auth.spec.ts` | Sign-in | `signin-*` |
| `daily-sync.spec.ts` | Daily quest section + toggle | `daily-sync-*-section`, `task-status-{id}` |
| `timer.spec.ts` | Timer idle + start/pause/stop (skip tanpa `NEXT_PUBLIC_ENABLE_TIMER_DEV=true`) | `task-play-{id}`, `timer-action-btn`, `timer-stop-btn`, `break-*-btn` |
| `quest-management.spec.ts` | Daily quest CRUD, project create | `daily-quest-*`, `project-add-btn`, `project-form-*` |
| `side-quests.spec.ts` | Side quest toggle/edit/delete | `side-quest-item/status/edit/delete-{id}`, `side-quest-edit-input`, `side-quest-save-btn` |
| `work-quest-tasks.spec.ts` | Task CRUD dalam project | `project-toggle/add-task-{id}`, `task-form-input/save`, `task-item/edit/delete-{id}` |
| `best-week.spec.ts` | Template + grid block CRUD | `template-*`, `grid-slot-{day}-{slot}`, `grid-block-{id}`, `block-modal-*` |
| `activity-plan.spec.ts` | Calendar/List/Quest switch | `activity-view-{calendar,list,quest}` (+`aria-pressed`) |
| `dashboard.spec.ts` | Nav cards + quarter selector | `dashboard-card-{route-slug}`, `quarter-prev/toggle/next` |

Shared: `confirm-modal-confirm` / `confirm-modal-cancel` (semua `ConfirmModal`). Delete task/block/template masih `window.confirm` → `page.once('dialog', d => d.accept())`.

## Bug Fixing Workflow (P0/P1)

1. **Replicate** → Buat E2E test yang mereproduksi bug
2. **Prove** → Confirm test FAIL (RED)
3. **Fix** → Fix kode
4. **Verify** → Confirm test PASS (GREEN)
5. **Protect** → Test tetap ada sebagai regression guard

```bash
# Debug specific test
npx playwright test tests/e2e/auth.spec.ts --debug
npx playwright test --grep "shows error on invalid credentials" --headed
```
