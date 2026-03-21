# Type Centralization — Implementation Plan

**Date:** 2026-03-21
**Design doc:** `docs/plans/2026-03-21-type-centralization-design.md`
**Beads issue:** `bp-rxw`
**Estimated files:** 13 new + 14 updated/deleted + ~35 import updates

---

## Prerequisites

```bash
npm run type-check   # Record baseline — note any pre-existing errors
git status           # Ensure clean working tree before starting
```

---

## Phase 1 — Leaf types (no project dependencies)

Create 5 files. No imports from other project files needed.

### Task 1.1 — `src/types/brain-dump.ts`

Source: `src/app/(admin)/execution/daily-sync/BrainDump/types.ts`

Create file:
```typescript
export interface BrainDumpItem {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}
```

### Task 1.2 — `src/types/journal.ts`

Source: `src/app/(admin)/execution/daily-sync/Journal/types.ts`

Read the source file first, then create `src/types/journal.ts` with `JournalEntry` and `JournalData` types (data types only — NOT `OneMinuteJournalModalProps`).

### Task 1.3 — `src/types/daily-quest.ts`

Source: `src/app/(admin)/quests/daily-quests/types.ts`

Read the source file, then create `src/types/daily-quest.ts` with `DailyQuest` type (data type only — NOT prop types).

### Task 1.4 — `src/types/side-quest.ts`

Source: `src/app/(admin)/quests/side-quests/types.ts`

Read the source file, then create `src/types/side-quest.ts` with `SideQuest` and `SideQuestFormData` (data types only — NOT `SideQuestModalProps`).

### Task 1.5 — `src/types/vision.ts`

Sources:
- `src/app/(admin)/planning/12-week-quests/hooks/useVision.ts`
- `src/app/(admin)/planning/12-week-quests/hooks/vision/logic.ts` (if exists)

Read source files, then create `src/types/vision.ts` with `Vision` and `VisionEntry` types.

**Checkpoint after Phase 1:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Phase 2 — Independent types (no cross-domain deps)

### Task 2.1 — `src/types/activity-log.ts`

Sources:
- `src/app/(admin)/execution/daily-sync/ActivityLog/types.ts`
- `src/app/(admin)/execution/daily-sync/ActivityLog/hooks/useActivityLogs.ts`

**IMPORTANT — merge two `ActivityLogItem` definitions:**
- File `types.ts` version: ~10 fields, no `task_type`
- Hook version: ~11 fields, has `task_type?: string`

Use the hook version (superset) as canonical. Create `src/types/activity-log.ts`:

```typescript
export interface ActivityLogItem {
  // ... all fields from hook version including task_type?: string
}

export type ViewMode = 'GROUPED' | 'TIMELINE' | 'CALENDAR'
export type CalendarViewMode = '24_HOUR' | 'DYNAMIC'
```

**Do NOT move** `CalendarBlock` with `topPercent`/`heightPercent` (rendering concern — stays in ActivityLog folder).

### Task 2.2 — `src/types/sound.ts`

Sources:
- `src/stores/soundStore.ts`
- `src/app/(admin)/settings/profile/actions/user-profile/types.ts`
- `src/lib/soundUtils.ts`

**IMPORTANT — merge two identical `SoundSettings` definitions:**
Both have 4 fields: `soundId`, `volume`, `taskCompletionSoundId`, `focusSoundId`. Use one canonical.

Create `src/types/sound.ts`:
```typescript
export interface SoundSettings {
  soundId: string
  volume: number
  taskCompletionSoundId: string
  focusSoundId: string
}

export interface SoundOption {
  // ... from lib/soundUtils.ts
}
```

### Task 2.3 — `src/types/timer.ts`

Sources:
- `src/app/(admin)/execution/daily-sync/PomodoroTimer/types.ts`
- `src/stores/timerStore.ts`

**IMPORTANT — merge and rename:**
- `Task` (timerStore) → rename to `TimerTask` (superset, has `completed_sessions?`, `target_sessions?`)
- `ActiveTask` (PomodoroTimer) → ELIMINATE, it's a subset of `TimerTask`

Create `src/types/timer.ts`:
```typescript
export type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK'

export interface TimerTask {
  id: string
  title: string
  item_type: string
  focus_duration?: number
  completed_sessions?: number
  target_sessions?: number
}

export interface TimerSettings {
  // ... from PomodoroTimer/types.ts
}

export interface TimerSession {
  // ... from PomodoroTimer/types.ts
}
```

### Task 2.4 — `src/types/work-quest.ts`

Source: `src/app/(admin)/quests/work-quests/types.ts`

Read source file. Create `src/types/work-quest.ts` with:
- `WorkQuestProject`, `WorkQuestTask` (core data types)
- `WorkQuestProjectFormData`, `WorkQuestTaskFormData`
- Legacy aliases if present: `WorkQuest`, `WorkQuestSubtask`, etc.

Do NOT move prop types like `WorkQuestProjectListProps`, `WorkQuestProjectFormProps`.

**Checkpoint after Phase 2:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Phase 3 — Types with one level of dependency

### Task 3.1 — `src/types/user-profile.ts`

Source: `src/app/(admin)/settings/profile/actions/user-profile/types.ts`

Read source file. Create `src/types/user-profile.ts`:
```typescript
import type { SoundSettings } from '@/types/sound'

export interface UserProfile {
  // ... all fields, with sound_settings: SoundSettings
}
```

### Task 3.2 — `src/types/daily-plan.ts`

Source: `src/app/(admin)/execution/daily-sync/DailyQuest/types.ts`

Read source file. Extract data types only:
- `DailyPlan`, `DailyPlanItem`, `TaskSchedule`
- `WeeklyTaskItem`, `SideQuestItem`
- `DailyPlanItemWithSchedules`, `ScheduleBlockInput`
- `ActivityViewMode = 'PLAN' | 'ACTUAL' | 'CALENDAR'`

Do NOT move: `DailySyncClientProps`, `TaskColumnProps`, `TaskCardProps`, `TaskSelectionModalProps`, `SideQuestFormProps`.

### Task 3.3 — `src/types/weekly-sync.ts`

Sources:
- `src/app/(admin)/execution/weekly-sync/WeeklySyncClient/types.ts`
- `src/app/(admin)/execution/weekly-sync/ToDontList/types.ts`

Read both source files. Create `src/types/weekly-sync.ts` with data types:
- `GoalItem`, `WeeklyGoal`, `HierarchicalItem`, `SelectedItem`
- `Milestone` (weekly-sync display shape — different from planning Milestone)
- `Quest` (weekly-sync display shape: `{ id, title, milestones? }`)
- `ProgressData`, `WeeklyGoalsProgress`
- `Rule`

Do NOT move prop types: `MainContentProps`, `WeekSelectorProps`, `ToDontListCardProps`.

**Checkpoint after Phase 3:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Phase 4 — Planning layer

### Task 4.1 — `src/types/planning-quest.ts`

Sources:
- `src/app/(admin)/planning/12-week-quests/hooks/useQuestState.ts`
- `src/app/(admin)/planning/12-week-quests/hooks/useQuarter.ts`
- `src/app/(admin)/planning/12-week-quests/hooks/useQuestHistory.ts`
- `src/app/(admin)/planning/12-week-quests/hooks/useRankingCalculation.ts`
- `src/app/(admin)/planning/12-week-quests/hooks/quest-operations/logic.ts` (if QuestInput exists here)

**IMPORTANT — rename `Quest` → `PlanningQuest`** to avoid clash with `Quest` in `@/types/weekly-sync`.

Read all source files. Create `src/types/planning-quest.ts`:
```typescript
export interface PlanningQuest {
  // ... all fields from useQuestState's Quest interface
}

export interface QuarterData {
  // ... from useQuarter.ts
}

export interface QuestHistoryItem {
  // ... from useQuestHistory.ts
}

export interface RankedQuest extends PlanningQuest {
  // ... from useRankingCalculation.ts
}

export interface QuestInput {
  // ... form/upsert payload type
}

export interface SeparatedQuests {
  // ...
}
```

**Checkpoint after Phase 4:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Phase 5 — Update existing src/types/ files

### Task 5.1 — Update `src/types/calendar.ts`

Currently imports `ActivityLogItem` from a hook file. Update to:
```typescript
import type { ActivityLogItem } from '@/types/activity-log'
```

### Task 5.2 — Update `src/lib/soundUtils.ts`

Remove `SoundOption` definition, replace with:
```typescript
import type { SoundOption } from '@/types/sound'
```

**Checkpoint after Phase 5:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Phase 6 — Update all consumer imports (~35 files)

For each domain, update all files that import from the old scattered location.

### Task 6.1 — Timer consumers

Find all files importing from `timerStore.ts` that use `Task` type:
```bash
grep -r "from.*timerStore" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*PomodoroTimer/types" src/ --include="*.ts" --include="*.tsx" -l
```

For each file found:
- Change `import { Task } from '@/stores/timerStore'` → `import type { TimerTask } from '@/types/timer'`
- Rename all usages of `Task` type → `TimerTask`
- Change `import { ActiveTask } from ...` → `import type { TimerTask } from '@/types/timer'`
- Rename all usages of `ActiveTask` → `TimerTask`

Also update `src/stores/timerStore.ts`:
- Remove local `Task` interface definition
- Remove local `TimerState` type definition
- Add imports: `import type { TimerState, TimerTask, TimerSettings, TimerSession } from '@/types/timer'`

### Task 6.2 — PlanningQuest consumers

Find all files importing `Quest` from useQuestState:
```bash
grep -r "from.*useQuestState" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*useQuarter" src/ --include="*.ts" --include="*.tsx" -l
```

For each file:
- Change import to `import type { PlanningQuest } from '@/types/planning-quest'`
- Rename all type usages `Quest` → `PlanningQuest`
- Update `useQuestState.ts`, `useQuarter.ts`, `useQuestHistory.ts`, `useRankingCalculation.ts` to import from `@/types/planning-quest` and remove local definitions

### Task 6.3 — ActivityLog consumers

```bash
grep -r "from.*ActivityLog/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*useActivityLogs" src/ --include="*.ts" --include="*.tsx" -l
grep -r "ActivityLogItem" src/ --include="*.ts" --include="*.tsx" -l
```

Update each file to import `ActivityLogItem` from `@/types/activity-log`.

### Task 6.4 — SoundSettings consumers

```bash
grep -r "SoundSettings" src/ --include="*.ts" --include="*.tsx" -l
grep -r "SoundOption" src/ --include="*.ts" --include="*.tsx" -l
```

Update `soundStore.ts` and all consumers to import from `@/types/sound`.

### Task 6.5 — DailyPlan consumers

```bash
grep -r "from.*DailyQuest/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "DailyPlanItem\|TaskSchedule\|DailyPlan" src/ --include="*.ts" --include="*.tsx" -l
```

Update to import from `@/types/daily-plan`.

### Task 6.6 — WeeklySync consumers

```bash
grep -r "from.*WeeklySyncClient/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*ToDontList/types" src/ --include="*.ts" --include="*.tsx" -l
```

Update `WeeklySyncModal/types.ts` and `WeeklySyncTable/types.ts` to import from `@/types/weekly-sync`.

### Task 6.7 — Remaining domains

```bash
grep -r "from.*daily-quests/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*work-quests/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*side-quests/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*BrainDump/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*Journal/types" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*user-profile/types" src/ --include="*.ts" --include="*.tsx" -l
```

Update each to import from respective `@/types/<domain>`.

**Checkpoint after Phase 6:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Phase 7 — Delete/trim old type files

Only after ALL consumers are updated and type-check passes.

### Delete entirely:
- `src/app/(admin)/quests/daily-quests/types.ts`
- `src/app/(admin)/execution/daily-sync/PomodoroTimer/types.ts`
- `src/app/(admin)/settings/profile/actions/user-profile/types.ts`

### Trim (remove data types, keep only prop types):
- `src/app/(admin)/execution/daily-sync/BrainDump/types.ts` → keep only `BrainDumpProps`
- `src/app/(admin)/execution/daily-sync/Journal/types.ts` → keep only `OneMinuteJournalModalProps`
- `src/app/(admin)/execution/daily-sync/DailyQuest/types.ts` → keep only `*Props` types
- `src/app/(admin)/execution/weekly-sync/WeeklySyncClient/types.ts` → keep only `MainContentProps`
- `src/app/(admin)/execution/weekly-sync/ToDontList/types.ts` → keep only `ToDontListCardProps`
- `src/app/(admin)/quests/work-quests/types.ts` → keep only `*Props` types
- `src/app/(admin)/quests/side-quests/types.ts` → keep only `SideQuestModalProps`

### Keep untouched (all prop types, nothing to centralize):
- `src/app/(admin)/execution/daily-sync/DateSelector/types.ts`
- `src/app/(admin)/execution/weekly-sync/WeeklySyncModal/types.ts`
- `src/app/(admin)/execution/weekly-sync/WeeklySyncTable/types.ts`

---

## Phase 8 — Create README + Final verification

### Task 8.1 — Create `src/types/README.md`

```markdown
# Types Directory

Centralized domain types for Better Planner. One file per domain, flat structure.

## Files

| File | Domain | Key Types |
|------|--------|-----------|
| `activity-log.ts` | Activity tracking | `ActivityLogItem`, `ViewMode` |
| `brain-dump.ts` | Brain dump | `BrainDumpItem` |
| `calendar.ts` | Calendar display | `CalendarBlock`, `TimeSlot` |
| `daily-plan.ts` | Daily execution | `DailyPlan`, `DailyPlanItem`, `TaskSchedule` |
| `daily-quest.ts` | Daily quests | `DailyQuest` |
| `journal.ts` | Journaling | `JournalEntry`, `JournalData` |
| `planning-quest.ts` | 12-week planning | `PlanningQuest`, `QuarterData`, `RankedQuest` |
| `questContinuity.ts` | Quest continuity | `QuestWithContinuity` |
| `side-quest.ts` | Side quests | `SideQuest`, `SideQuestFormData` |
| `sound.ts` | Sound settings | `SoundSettings`, `SoundOption` |
| `timer.ts` | Pomodoro timer | `TimerState`, `TimerTask`, `TimerSettings` |
| `user-profile.ts` | User profile | `UserProfile` |
| `vision.ts` | Vision/goals | `Vision`, `VisionEntry` |
| `weekly-sync.ts` | Weekly planning | `WeeklyGoal`, `GoalItem`, `Rule` |
| `work-quest.ts` | Work quests | `WorkQuestProject`, `WorkQuestTask` |

## Rules

1. **Import from here**: `import type { X } from '@/types/domain'`
2. **No barrel index.ts** — import explicitly by domain file
3. **No subdirectories** — flat structure only
4. **Prop/UI types stay collocated** — `*Props` types live with their component
5. **Nullable FK columns**: always include `| null`
6. **No re-export shims** from old locations

## What Goes Here vs Stays Collocated

✅ **Centralize here**: Database entities, shared domain types, types used across 2+ files
❌ **Keep collocated**: `*Props` types, hook-return shapes, component-internal types
```

### Task 8.2 — Final verification

```bash
npm run type-check   # Zero errors (or same as baseline)
npm run build        # Catches module resolution issues
```

### Task 8.3 — Manual smoke test

1. Open Daily Sync page — verify loads, timer starts
2. Open Weekly Sync modal — verify opens, can save
3. Open 12-Week Quests — verify pairwise comparison works

---

## Commit Message (after all phases complete)

```
refactor(types): centralize all domain types to src/types/ (bp-rxw)

- Create 13 domain type files in src/types/
- Merge duplicate SoundSettings and ActivityLogItem definitions
- Rename Quest→PlanningQuest, Task→TimerTask to resolve clashes
- Update ~35 consumer files to import from @/types/<domain>
- Delete/trim old scattered type files
- Add src/types/README.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
