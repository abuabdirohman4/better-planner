# Habit Tracker — Implementation Plan
**Date:** 2026-03-28
**Design Doc:** `2026-03-28-habit-tracker-design.md`

## Phase 1A — Foundation (Data Layer)

### Step 1: Database Migration
- [ ] Create migration SQL: `habits` table + `habit_completions` table
- [ ] Add ENUMs: `habit_frequency`, `habit_category`, `habit_tracking_type`
- [ ] Add RLS policies for both tables
- [ ] Add indexes for performance
- [ ] Apply migration via Supabase MCP (`mcp__better-planner__apply_migration`)

**Files:** New migration in Supabase

### Step 2: TypeScript Types
- [ ] Create `src/types/habit.ts`
  - `Habit` interface
  - `HabitCompletion` interface
  - `HabitFormInput` interface
  - `HabitStats`, `MonthlyStats`, `StreakResult` computed types
  - Enums: `HabitFrequency`, `HabitCategory`, `HabitTrackingType`

### Step 3: SWR Keys
- [ ] Add `habitKeys` to `src/lib/swr.ts`

### Step 4: Server Actions — Habits
- [ ] `src/app/(admin)/habits/actions/habits/queries.ts`
  - `queryHabits(supabase, userId, includeArchived)`
  - `insertHabit(supabase, userId, data)`
  - `updateHabitById(supabase, habitId, userId, data)`
  - `archiveHabitById(supabase, habitId, userId)`
- [ ] `src/app/(admin)/habits/actions/habits/logic.ts`
  - `parseHabitFormData(formData)`
  - `toHabit(row)` transformer
- [ ] `src/app/(admin)/habits/actions/habits/actions.ts` (`"use server"`)
  - `getHabits(includeArchived?)`
  - `addHabit(formData)`
  - `updateHabit(habitId, updates)`
  - `archiveHabit(habitId)`

### Step 5: Server Actions — Completions
- [ ] `src/app/(admin)/habits/actions/completions/queries.ts`
  - `queryCompletionsForMonth(supabase, userId, year, month)`
  - `queryCompletion(supabase, habitId, userId, date)`
  - `insertCompletion(supabase, habitId, userId, date)`
  - `deleteCompletion(supabase, habitId, userId, date)`
- [ ] `src/app/(admin)/habits/actions/completions/logic.ts`
  - `buildCompletionSet(completions)` → `Set<"habitId:date">`
  - `calculateStreak(completedDates, today, daysInMonth, year, month)`
  - `calculateMonthlyStats(habits, completions, daysInMonth, year, month, today)`
- [ ] `src/app/(admin)/habits/actions/completions/actions.ts` (`"use server"`)
  - `getCompletionsForMonth(year, month)`
  - `toggleCompletion(habitId, date)` → `{ completed: boolean }`

### Step 6: Seed Script
- [ ] Create `scripts/seed-habits.ts` with all 18 habits
- [ ] Test: `SEED_USER_ID=<uuid> npx tsx scripts/seed-habits.ts`

**Checkpoint:** Verify data in Supabase dashboard. All 18 habits visible.

---

## Phase 1B — SWR Hooks

### Step 7: Hooks
- [ ] `src/app/(admin)/habits/hooks/useHabits.ts`
  - `getHabits` via SWR
  - `addHabit`, `updateHabit`, `archiveHabit` with optimistic updates
- [ ] `src/app/(admin)/habits/hooks/useHabitCompletions.ts`
  - `getCompletionsForMonth` via SWR keyed by `[year, month]`
  - `toggleCompletion` with optimistic update (insert/remove from local array)
- [ ] `src/app/(admin)/habits/hooks/useMonthlyStats.ts`
  - `useMemo` hook over `habits` + `completions` — no SWR fetch
  - Calls `calculateMonthlyStats` from logic.ts

---

## Phase 1C — Today's View (Build First — Validates Data Flow)

### Step 8: TodayHabitItem component
- [ ] `src/components/habits/TodayHabitItem.tsx`
  - Props: `habit`, `isCompleted`, `currentStreak`, `onToggle`
  - Large tap target (min-h-[44px])
  - Checkbox on right, habit name + time on left
  - Negative habit indicator

### Step 9: TodayHabitList component
- [ ] `src/components/habits/TodayHabitList.tsx`
  - Groups habits by time block: Morning (<12), Afternoon (12-17), Evening (17-20), Before Sleep (>20)
  - Habits without `target_time` go in the "Anytime" group
  - Shows group header with emoji

### Step 10: Today page
- [ ] `src/app/(admin)/habits/today/page.tsx`
  - `"use client"`
  - Uses `useHabits()`, `useHabitCompletions(year, month)`, `useMonthlyStats()`
  - Header: "X of Y habits done today"
  - Renders `TodayHabitList` for today's date

**Checkpoint:** Open `/habits/today`. See all 18 habits grouped. Click to toggle. Verify completion persists on reload.

---

## Phase 1D — Monthly Grid

### Step 11: HabitGridCell component
- [ ] `src/components/habits/HabitGridCell.tsx`
  - Filled dot = completed, empty ring = not completed, dash = future
  - 32×32px minimum, onClick calls `onToggle(habitId, date)`
  - Disabled if date > today
  - Green tint for negative habit success

### Step 12: HabitProgressBar component
- [ ] `src/components/habits/HabitProgressBar.tsx`
  - Props: `completed`, `goal`, `percentage`
  - Color: green (≥80%), amber (60–79%), red (<60%)
  - Shows "8/20 40%" label

### Step 13: HabitGridRow component
- [ ] `src/components/habits/HabitGridRow.tsx`
  - Sticky first cell: habit name + icon
  - 31 day cells using `HabitGridCell`
  - Sticky last cell: `HabitProgressBar`
  - Negative habit visual indicator on name

### Step 14: MonthNavigator component
- [ ] `src/components/habits/MonthNavigator.tsx`
  - Props: `year`, `month`, `onChange`
  - Shows "March 2026" with < > arrows
  - Prevents navigating to future months

### Step 15: HabitGrid component
- [ ] `src/components/habits/HabitGrid.tsx`
  - `overflow-x-auto` container with `<table>`
  - Header row: day numbers (1–31)
  - Habit rows grouped by category with separator rows
  - Category separator is a full-width spanning row

### Step 16: HabitStatsCard component
- [ ] `src/components/habits/HabitStatsCard.tsx`
  - Variants: "Best Streak", "Overall Score", "Habits Count"

### Step 17: Monthly page
- [ ] `src/app/(admin)/habits/monthly/page.tsx`
  - `"use client"`
  - `year`/`month` state, initialized to current month
  - Uses all three hooks
  - Header with `MonthNavigator` + 3 `HabitStatsCard`s
  - `HabitGrid` + "+ Add Habit" button

**Checkpoint:** Open `/habits/monthly`. Full grid visible. Click cells to toggle. Progress bars update. Navigate months.

---

## Phase 1E — Habit Management

### Step 18: HabitForm component
- [ ] `src/components/habits/HabitForm.tsx`
  - Controlled form: name, description, category select, frequency select, monthly_goal number, tracking_type radio, target_time (optional)
  - Uses existing `Button`, `Input` from `src/components/ui/`
  - Calls `onSubmit(HabitFormInput)`

### Step 19: HabitFormModal component
- [ ] `src/components/habits/HabitFormModal.tsx`
  - Wraps `HabitForm` in existing modal component
  - Mode: "add" | "edit"
  - On submit: calls `addHabit` or `updateHabit` from `useHabits`

### Step 20: Wire management into pages
- [ ] Add "+ Add Habit" button → opens `HabitFormModal` in "add" mode
- [ ] Add edit button on each habit row → opens `HabitFormModal` in "edit" mode
- [ ] Add archive button on each habit row

---

## Phase 1F — Navigation & Layout

### Step 21: Habits layout
- [ ] `src/app/(admin)/habits/layout.tsx`
  - Tab navigation: "Monthly Grid" | "Today's Habits"
  - "+ Add Habit" button (opens modal)

### Step 22: AppSidebar navigation
- [ ] `src/components/layouts/AppSidebar.tsx`
  - Uncomment or add `trackingNav` array
  - Add `{ icon: <CheckCircleIcon />, name: "Habit Tracker", path: "/habits/monthly" }`
  - Uncomment TRACKING section in `SidebarContent`

**Checkpoint (Final):** Full E2E flow:
1. Navigate to Habits via sidebar
2. See monthly grid with 18 seeded habits
3. Toggle completions
4. Switch to Today view
5. Add a new habit via form
6. Edit an existing habit
7. Archive a habit (disappears from grid)

---

## Testing

```bash
# Type check
npm run type-check

# Dev server
npm run dev
# Then manually test:
# - /habits/monthly
# - /habits/today
# - Toggle completion (optimistic + persist)
# - Month navigation
# - Add / edit / archive habit
# - Seed data visibility
```

---

## Beads Issues to Create

| # | Title | Type | Priority | Blocked by |
|---|-------|------|----------|------------|
| 1 | Habit Tracker DB migration + seed | task | P1 | — |
| 2 | Habit Tracker types + SWR keys | task | P1 | — |
| 3 | Habit Tracker server actions (habits) | task | P1 | #1, #2 |
| 4 | Habit Tracker server actions (completions) + streak logic | task | P1 | #1, #2 |
| 5 | Habit Tracker SWR hooks | task | P1 | #3, #4 |
| 6 | Today's View UI | feature | P1 | #5 |
| 7 | Monthly Grid UI | feature | P1 | #5 |
| 8 | Habit Form CRUD | feature | P1 | #5 |
| 9 | Navigation + layout wiring | task | P2 | #6, #7, #8 |
