# Habit Tracker — Design Document
**Date:** 2026-03-28
**Status:** Approved

## Context

Abu currently tracks 17–18 habits (prayer times, health, productivity, avoidance) in a Google Spreadsheet. The tracker needs to move into Better Planner for:
- Mobile-first quick daily check-in
- Automatic streak & progress calculation
- Integration with the existing productivity system (Daily Quest, Best Week)
- Persistent history across months

This document covers Phase 1 MVP — a standalone habit tracker. Daily Quest / Best Week integration is deferred.

---

## Architecture Decisions

### 1. Database — New Tables (Not ERD Reuse)
The ERD defines `habits` and `habit_logs` but they were never migrated to the live database. The ERD schema is also missing critical columns (`category`, `frequency`, `monthly_goal`, `tracking_type`, `target_time`, `sort_order`). Decision: create fresh tables with the correct schema.

**`habits` table:**
```sql
CREATE TABLE habits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  category       habit_category NOT NULL DEFAULT 'other',
  frequency      habit_frequency NOT NULL DEFAULT 'flexible',
  monthly_goal   INTEGER NOT NULL DEFAULT 20,
  tracking_type  habit_tracking_type NOT NULL DEFAULT 'positive',
  target_time    TIME,
  is_archived    BOOLEAN NOT NULL DEFAULT false,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
```

**`habit_completions` table — existence model:**
Completion is modeled as **row existence**, not a boolean field. Toggle = INSERT or DELETE. This avoids stale boolean states and leverages the `UNIQUE(habit_id, date)` constraint.
```sql
CREATE TABLE habit_completions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, date)
);
```

### 2. Monthly Stats — Calculated On-the-Fly
No `monthly_stats` table in MVP. All stats (completion %, streaks, category breakdown) are computed in `logic.ts` from the completions array already fetched for the month. This keeps the data layer simple and avoids sync complexity.

### 3. Streak Scope — Within-Month Only
Streaks are calculated within the current month only. This matches the "Monthly Challenge" concept. Cross-month streak tracking is deferred to a future enhancement.

### 4. Monthly Grid — HTML `<table>` with Sticky Columns
A 31-day × 18-habit grid in a horizontal scroll container. The habit name column is `sticky left-0` and the progress summary column is `sticky right-0`. HTML `<table>` is used (not CSS Grid) because `position: sticky` on individual cells inside `overflow-x: auto` is most reliable with table layout.

---

## File Structure

```
src/
├── types/
│   └── habit.ts                              # All TypeScript interfaces
├── lib/
│   └── swr.ts                                # ADD: habitKeys
├── app/(admin)/habits/
│   ├── layout.tsx                            # Shared layout with Monthly/Today tab nav
│   ├── monthly/page.tsx                      # Monthly grid orchestrator
│   ├── today/page.tsx                        # Today checklist orchestrator
│   ├── actions/
│   │   ├── habits/
│   │   │   ├── actions.ts                    # "use server" — CRUD
│   │   │   ├── queries.ts                    # Raw Supabase queries
│   │   │   └── logic.ts                      # Form parsing, validation, sorting
│   │   └── completions/
│   │       ├── actions.ts                    # "use server" — toggle completion, get completions
│   │       ├── queries.ts                    # Raw Supabase queries
│   │       └── logic.ts                      # Streak algorithm, monthly stats
│   └── hooks/
│       ├── useHabits.ts
│       ├── useHabitCompletions.ts
│       └── useMonthlyStats.ts
└── components/habits/
    ├── HabitGrid.tsx                         # Main monthly grid
    ├── HabitGridRow.tsx                      # Single habit row
    ├── HabitGridCell.tsx                     # One day cell
    ├── HabitProgressBar.tsx                  # Colored progress bar
    ├── HabitStatsCard.tsx                    # Stat card (streak, score)
    ├── HabitForm.tsx                         # Add/Edit form
    ├── HabitFormModal.tsx                    # Modal wrapper
    ├── TodayHabitList.tsx                    # Mobile daily checklist
    ├── TodayHabitItem.tsx                    # Single today item
    └── MonthNavigator.tsx                    # Month prev/next navigation
```

---

## Key Algorithms

### Toggle Completion (Server Action)
```typescript
// Toggle = try INSERT, if UNIQUE conflict then DELETE
async function toggleCompletion(habitId, date) {
  const existing = await queryCompletion(supabase, habitId, userId, date);
  if (existing) {
    await deleteCompletion(supabase, habitId, userId, date);
    return { completed: false };
  } else {
    await insertCompletion(supabase, habitId, userId, date);
    return { completed: true };
  }
}
```

### Streak Calculation (Pure Logic)
```typescript
function calculateStreak(
  completedDates: Set<string>,  // Set<"YYYY-MM-DD"> for ONE habit
  today: string,
  daysInMonth: number,
  year: number,
  month: number
): { current_streak: number; best_streak: number }

// Current streak: walk backwards from today, stop on first gap
// Best streak: longest consecutive run in past dates (excluding future)
```

### Monthly Stats
One pass over completions, one pass over habits. Returns per-habit stats, overall %, category breakdown, best streak.

---

## Navigation

Add to the already-defined (but commented-out) `trackingNav` in `AppSidebar.tsx`:
```typescript
const trackingNav: NavItem[] = [
  { icon: <CheckCircleIcon />, name: "Habit Tracker", path: "/habits/monthly" }
];
```
Then uncomment the TRACKING section in `SidebarContent`.

---

## UI Specifications

### Monthly Grid
```
┌─────────────────────────────────────────────────────────────┐
│ [< March 2026 >]          Score: 72%   Best Streak: 7 🔥    │
├─────────────────────────────────────────────────────────────┤
│ ─── SPIRITUAL ───────────────────────────────────────────── │
│ Shalat Tahajud  │●│●│○│●│●│●│○│...│  8/20  40% ░░░░░░      │
│ Shalat Subuh    │●│●│●│●│●│●│●│...│ 27/30  90% ████████    │
├─────────────────────────────────────────────────────────────┤
│ ─── KESEHATAN ──────────────────────────────────────────── │
│ Exercise        │○│●│●│○│●│●│●│...│ 12/20  60% ████░░      │
└─────────────────────────────────────────────────────────────┘
```

**Color codes:**
- 80%+ → green (`#10B981`)
- 60–79% → amber (`#F59E0B`)
- <60% → red (`#EF4444`)

**Cell states:**
- Completed: filled circle `●` (green dot)
- Not completed: empty circle `○` (gray ring)
- Future date: dash `–` (disabled, no interaction)
- Negative habit completed: green `✓` (inverse icon)

### Today's View
- Habits grouped by time block (Morning / Afternoon / Evening / Before Sleep)
- Large tap targets (min 44×44px)
- Shows current streak per habit
- Header shows X/Y habits done today

---

## Seed Data

Script: `scripts/seed-habits.ts`
Run: `SEED_USER_ID=<uuid> npx tsx scripts/seed-habits.ts`

18 habits seeded:
- 9 Spiritual (5 daily prayers + Tahajud, Duha, Qur'an, Tasbih)
- 3 Kesehatan (Sleep, No-phone, Exercise)
- 3 Karir (Reading, Habit Tracker meta, Weekly Review)
- 3 Negative (No Twitter, No Youtube, No Instagram)

---

## Out of Scope (Phase 1)

- Daily Quest ↔ Habit auto-sync
- Best Week integration
- CSV import
- Monthly stats table
- Cross-month streaks
- Advanced analytics charts
- Notifications / reminders
