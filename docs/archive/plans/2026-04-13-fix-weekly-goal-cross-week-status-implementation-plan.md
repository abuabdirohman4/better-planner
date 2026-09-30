# Implementation Plan: Fix Weekly Goal Item Status Cross-Week Contamination

**Issue:** bp-kr9 | **GH:** [#6](https://github.com/abuabdirohman4/better-planner/issues/6)
**Design:** `docs/plans/2026-04-13-fix-weekly-goal-cross-week-status-design.md`
**Date:** 2026-04-13

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/(admin)/execution/weekly-sync/actions/weekly-task/logic.ts` | Cek/tambah `getISOWeekNumber` dan `getISOYear` helpers |
| 2 | `src/app/(admin)/execution/weekly-sync/actions/weekly-task/queries.ts` | Tambah param `weeklyGoalId`, filter `.eq('weekly_goal_id', weeklyGoalId)` |
| 3 | `src/app/(admin)/execution/weekly-sync/actions/weekly-task/actions.ts` | Resolve `weeklyGoalId` sebelum panggil `updateWeeklyGoalItemsStatus` |

---

## Task 1 — Cek date helpers di `logic.ts`

**File:** `src/app/(admin)/execution/weekly-sync/actions/weekly-task/logic.ts`

**Step 1.1** — Baca file ini:
```bash
cat src/app/(admin)/execution/weekly-sync/actions/weekly-task/logic.ts
```

**Step 1.2** — Cek juga apakah helper sudah ada di lib:
```bash
grep -r "getISOWeek\|isoWeek\|weekNumber" src/lib/ --include="*.ts" -l
```

**Step 1.3** — Jika `getISOWeekNumber` dan `getISOYear` BELUM ada di file manapun, tambahkan ke `logic.ts`:

```typescript
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getISOYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}
```

> Jika sudah ada di `src/lib/`, gunakan import dari sana — jangan duplikasi.

**Checkpoint:** `npm run type-check` — harus 0 error.

---

## Task 2 — Fix `updateWeeklyGoalItemsStatus` di `queries.ts`

**File:** `src/app/(admin)/execution/weekly-sync/actions/weekly-task/queries.ts`

**Current code (lines 34-45):**
```typescript
export async function updateWeeklyGoalItemsStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goal_items')
    .update({ status })
    .eq('item_id', taskId);
  if (error) console.warn('Error updating weekly_goal_items status:', error);
  // Don't throw — task status already updated by RPC
}
```

**Replace dengan:**
```typescript
export async function updateWeeklyGoalItemsStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  weeklyGoalId: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goal_items')
    .update({ status })
    .eq('item_id', taskId)
    .eq('weekly_goal_id', weeklyGoalId);
  if (error) console.warn('Error updating weekly_goal_items status:', error);
  // Don't throw — task status already updated by RPC
}
```

**Checkpoint:** `npm run type-check` — akan ada error di `actions.ts` karena arity berubah. Lanjut ke Task 3.

---

## Task 3 — Update `actions.ts` untuk resolve `weeklyGoalId`

**File:** `src/app/(admin)/execution/weekly-sync/actions/weekly-task/actions.ts`

**Step 3.1** — Tambah import di bagian atas file:
```typescript
import { queryExistingWeeklyGoal } from '../weekly-goals/queries';
import { buildTitleMap, resolveWeekDate, getISOWeekNumber, getISOYear } from './logic';
// (sesuaikan jika getISOWeekNumber/getISOYear diimport dari src/lib/)
```

**Step 3.2** — Ganti fungsi `updateWeeklyTaskStatus` (lines 28-53):

**Current:**
```typescript
export async function updateWeeklyTaskStatus(
  taskId: string,
  goalSlot: number,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  weekDate?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const resolvedDate = resolveWeekDate(weekDate);
    const data = await rpcUpdateTaskStatus(supabase, taskId, status, user.id, goalSlot, resolvedDate);
    await updateWeeklyGoalItemsStatus(supabase, taskId, status);

    revalidatePath('/execution/weekly-sync');
    revalidatePath('/planning/main-quests');
    revalidatePath('/execution/daily-sync');
    return data;
  } catch (error) {
    console.error('Error in updateWeeklyTaskStatus:', error);
    throw error;
  }
}
```

**New:**
```typescript
export async function updateWeeklyTaskStatus(
  taskId: string,
  goalSlot: number,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  weekDate?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const resolvedDate = resolveWeekDate(weekDate);

    // Resolve weeklyGoalId agar update hanya menyentuh minggu yang aktif
    const dateObj = new Date(resolvedDate);
    const year = getISOYear(dateObj);
    const weekNumber = getISOWeekNumber(dateObj);
    const weeklyGoal = await queryExistingWeeklyGoal(supabase, user.id, year, weekNumber, goalSlot);

    const data = await rpcUpdateTaskStatus(supabase, taskId, status, user.id, goalSlot, resolvedDate);

    if (weeklyGoal) {
      await updateWeeklyGoalItemsStatus(supabase, taskId, status, weeklyGoal.id);
    }

    revalidatePath('/execution/weekly-sync');
    revalidatePath('/planning/main-quests');
    revalidatePath('/execution/daily-sync');
    return data;
  } catch (error) {
    console.error('Error in updateWeeklyTaskStatus:', error);
    throw error;
  }
}
```

**Checkpoint:** `npm run type-check` — harus 0 error.

---

## Task 4 — Final Verification

```bash
npm run type-check
```

Expected output: no errors.

### Manual Test Scenario:

1. Set Task A sebagai weekly goal di Minggu 1 → pastikan status: TODO
2. Navigasi ke Minggu 2, set Task A sebagai weekly goal di Minggu 2 juga
3. Di Minggu 2, klik checkbox Task A → set DONE
4. Kembali ke Minggu 1 → **Expected:** Task A di Minggu 1 tetap **TODO** (tidak ikut berubah)
5. Cek Minggu 2 → **Expected:** Task A di Minggu 2 = **DONE** ✓

---

## Commit Message

```
fix(weekly-sync): prevent cross-week goal status contamination (bp-kr9 fixes #6)

When the same task appears in weekly goals for multiple weeks,
completing it in week N no longer marks it as DONE in other weeks.

updateWeeklyGoalItemsStatus now scoped to specific weekly_goal_id
instead of updating all occurrences by item_id across all weeks.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
