# Fix: weekly_goals cross-quarter overwrite (bp-kup)

**Date**: 2026-06-20  
**Issue**: bp-kup  
**Severity**: P1 Bug — confirmed data loss

---

## Root Cause Summary

`weekly_goals` uses `week_number` 1–13 per quarter (relative). Q1 week 5 and Q2 week 5 share the same `week_number=5`, causing constraint violation and UPDATE overwrite of cross-quarter rows.

**3 places to fix:**

| # | File | Bug |
|---|---|---|
| 1 | DB migration | `UNIQUE(user_id, year, week_number, goal_slot)` — missing `quarter` |
| 2 | `weekly-sync/actions/weekly-goals/queries.ts` | `queryExistingWeeklyGoal` — no `quarter` filter |
| 3 | `daily-sync/DailyQuest/actions/weekly-tasks/queries.ts` | `queryWeeklyGoals` — no `quarter` param/filter |
| 4 | `daily-sync/DailyQuest/actions/weekly-tasks/actions.ts` | `getTasksForWeek` — no `quarter` param |

---

## Task 1 — DB Migration: Fix Unique Constraint

**File**: `supabase/migrations/20260620000001_fix_weekly_goals_quarter_constraint.sql`

```sql
-- Drop old constraint (without quarter)
ALTER TABLE weekly_goals
  DROP CONSTRAINT IF EXISTS weekly_goals_user_id_year_week_number_goal_slot_key;

-- Add correct constraint (with quarter)
ALTER TABLE weekly_goals
  ADD CONSTRAINT weekly_goals_user_id_year_quarter_week_number_goal_slot_key
  UNIQUE(user_id, year, quarter, week_number, goal_slot);
```

**Expected**: Migration applies without error. Old constraint gone, new one exists.

**Apply via MCP**: Use `mcp__better-planner__apply_migration` with the SQL above.

Also update `docs/products/ERD.sql` line 73:
```sql
-- Old:
UNIQUE(user_id, year, week_number, goal_slot)
-- New:
UNIQUE(user_id, year, quarter, week_number, goal_slot)
```

---

## Task 2 — Fix `queryExistingWeeklyGoal` (weekly-sync queries)

**File**: `src/app/(admin)/execution/weekly-sync/actions/weekly-goals/queries.ts`

**Bug**: `queryExistingWeeklyGoal` fetches by `(user_id, year, week_number, goal_slot)` — missing `quarter` filter. Finds Q1 row when you're in Q2.

**Fix** — add `quarter` param and `.eq('quarter', quarter)`:

```typescript
export async function queryExistingWeeklyGoal(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,       // ADD PARAM
  weekNumber: number,
  goalSlot: number
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('id')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)   // ADD FILTER
    .eq('week_number', weekNumber)
    .eq('goal_slot', goalSlot)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}
```

**Caller update** — `actions.ts` line ~40 (the `setWeeklyGoalItems` function):

```typescript
const existingGoal = await queryExistingWeeklyGoal(
  supabase,
  user.id,
  data.year,
  data.quarter,   // ADD — was missing
  data.weekNumber,
  data.goalSlot
);
```

---

## Task 3 — Fix `queryWeeklyGoals` (daily-sync weekly-tasks queries)

**File**: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries.ts`

**Bug**: `queryWeeklyGoals` fetches by `(user_id, year, week_number)` — missing `quarter`. Returns goals from all quarters with same week number.

**Fix** — add `quarter` param and `.eq('quarter', quarter)`:

```typescript
export async function queryWeeklyGoals(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,       // ADD PARAM
  weekNumber: number
): Promise<RawWeeklyGoal[]> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('id, goal_slot')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)   // ADD FILTER
    .eq('week_number', weekNumber);
  if (error) throw error;
  return data || [];
}
```

---

## Task 4 — Fix `getTasksForWeek` action (daily-sync)

**File**: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/actions.ts`

**Bug**: `getTasksForWeek(year, weekNumber, selectedDate?)` — no `quarter` param passed down to `queryWeeklyGoals`.

**Fix** — add `quarter` param:

```typescript
export async function getTasksForWeek(
  year: number,
  quarter: number,         // ADD PARAM
  weekNumber: number,
  selectedDate?: string
) {
  // ...
  const weeklyGoals = await queryWeeklyGoals(supabase, userId, year, quarter, weekNumber);
  // rest unchanged
}
```

**Find all callers of `getTasksForWeek`**:
```bash
grep -r "getTasksForWeek" src/ --include="*.ts" --include="*.tsx" -n
```

Update each caller to pass `quarter`. The quarter can be derived from `weekNumber` using `getQuarterFromWeek(weekNumber)` from `@/lib/quarterUtils`.

---

## Task 5 — Update Tests

### 5a. `weekly-goals/queries.test.ts`

Update `queryExistingWeeklyGoal` tests — add `quarter` arg (e.g. `2026, 1, 1, 1` → `2026, 1, 1, 1` where new sig is `userId, year, quarter, weekNumber, goalSlot`):

```typescript
// Old:
const result = await queryExistingWeeklyGoal(supabase, 'user-1', 2026, 1, 1);
// New:
const result = await queryExistingWeeklyGoal(supabase, 'user-1', 2026, 1, 1, 1);
//                                                              year^ q^ wk^ slot^
```

Add test: two goals same `(year, week_number, goal_slot)` but different `quarter` should match only the correct one.

### 5b. `weekly-tasks/queries.test.ts`

Update `queryWeeklyGoals` tests — add `quarter` arg:
```typescript
// Old:
const result = await queryWeeklyGoals(supabase, 'user-1', 2026, 12);
// New:
const result = await queryWeeklyGoals(supabase, 'user-1', 2026, 1, 12);
//                                                         year^ q^ wk^
```

Add test: verify `.eq('quarter', quarter)` is called.

---

## Task 6 — Verify Type-Check

```bash
npm run type-check
```

Expected: 0 errors.

---

## Commit Message Template

```
fix(weekly-goals): add quarter filter to prevent cross-quarter data overwrite (bp-kup)

- DB migration: add quarter to UNIQUE constraint on weekly_goals
- queryExistingWeeklyGoal: add quarter param + .eq filter
- queryWeeklyGoals (daily-sync): add quarter param + .eq filter  
- getTasksForWeek: add quarter param, propagate to queryWeeklyGoals
- Update all callers of getTasksForWeek to pass quarter
- Update test assertions for new signatures

fixes #<GH_ISSUE_NUMBER>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## CLAUDE.md Check
- [ ] Apakah ada pattern/arsitektur BARU yang diperkenalkan di task ini?
- [ ] Apakah ada tabel database baru yang perlu ditambahkan ke Key Tables?
- [ ] Apakah ada route/page baru yang perlu ditambahkan ke App Router Structure?
- [ ] Apakah ada permission pattern baru yang perlu didokumentasikan?
- [ ] Jika ada yang perlu diupdate → update `CLAUDE.md` atau file di `docs/claude/` setelah implementasi selesai
