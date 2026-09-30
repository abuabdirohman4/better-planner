# Type Centralization Design — Better Planner

**Date:** 2026-03-21
**Branch:** refactoring-3-layer (or new branch)
**Status:** Planned

---

## Problem

Types di proyek tersebar di ~14 lokasi berbeda (feature folders, hooks, stores, lib files). Hanya 2 file (`calendar.ts`, `questContinuity.ts`) yang sudah centralized di `src/types/`. Ini menyebabkan:
- Types sulit ditemukan
- Duplikasi definisi (misal: `SoundSettings` didefinisikan 2x, `ActivityLogItem` 2x)
- Inkonsistensi shapes antar feature
- Import dari lokasi yang tidak intuitif (misal: `import { Quest } from '@/app/.../hooks/useQuestState'`)

## Goal

Centralize semua domain types ke `src/types/` mengikuti pola flat-file yang sudah berhasil di proyek `school-management`.

---

## Reference Pattern (school-management)

```
src/types/
├── README.md
├── student.ts          # Base → Extended → Full hierarchy
├── user.ts
├── class.ts
├── organization.ts
├── attendance.ts
└── ...
```

**Aturan:**
- Satu file per domain
- Flat (tanpa subdirectory)
- Tanpa barrel `index.ts`
- Import eksplisit: `import type { X } from '@/types/domain'`
- Prop/UI types tetap collocated di component folders

---

## Files to Create

### Phase 1 — Leaf types (no project dependencies)

**`src/types/brain-dump.ts`**
- `BrainDumpItem`
- Source: `execution/daily-sync/BrainDump/types.ts`

**`src/types/journal.ts`**
- `JournalEntry`, `JournalData`
- Source: `execution/daily-sync/Journal/types.ts`

**`src/types/daily-quest.ts`**
- `DailyQuest`
- Source: `quests/daily-quests/types.ts`

**`src/types/side-quest.ts`**
- `SideQuest`, `SideQuestFormData`
- Source: `quests/side-quests/types.ts`

**`src/types/vision.ts`**
- `Vision`, `VisionEntry`
- Source: `planning/12-week-quests/hooks/useVision.ts` + `vision/logic.ts`

### Phase 2 — Independent types

**`src/types/activity-log.ts`**
- `ActivityLogItem` (merge dari 2 definisi — gunakan superset dari hook)
- `ViewMode = 'GROUPED' | 'TIMELINE' | 'CALENDAR'`
- `CalendarViewMode = '24_HOUR' | 'DYNAMIC'`
- Source: `execution/daily-sync/ActivityLog/types.ts` + hook

**`src/types/sound.ts`**
- `SoundSettings` (merge dari 2 definisi identik)
- `SoundOption`
- Source: `soundStore.ts` + `settings/.../types.ts` + `lib/soundUtils.ts`

**`src/types/timer.ts`**
- `TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK'`
- `TimerTask` (rename dari `Task` di timerStore)
- `TimerSettings`
- `TimerSession`
- Source: `PomodoroTimer/types.ts` + `stores/timerStore.ts`

**`src/types/work-quest.ts`**
- `WorkQuestProject`, `WorkQuestTask`
- `WorkQuestProjectFormData`, `WorkQuestTaskFormData`
- Legacy aliases: `WorkQuest`, `WorkQuestSubtask`, `WorkQuestFormData`, `WorkQuestSubtaskFormData`
- Source: `quests/work-quests/types.ts`

### Phase 3 — One level dependency

**`src/types/user-profile.ts`**
- `UserProfile`
- Depends on: `@/types/sound` (SoundSettings)
- Source: `settings/profile/actions/user-profile/types.ts`

**`src/types/daily-plan.ts`**
- `DailyPlan`, `DailyPlanItem`, `TaskSchedule`
- `WeeklyTaskItem`, `SideQuestItem`
- `DailyPlanItemWithSchedules`, `ScheduleBlockInput`
- `ActivityViewMode = 'PLAN' | 'ACTUAL' | 'CALENDAR'`
- Source: `execution/daily-sync/DailyQuest/types.ts`

**`src/types/weekly-sync.ts`**
- `GoalItem`, `WeeklyGoal`, `HierarchicalItem`, `SelectedItem`
- `Milestone`, `Quest` (weekly-sync display shape)
- `ProgressData`, `WeeklyGoalsProgress`
- `Rule`
- Source: `execution/weekly-sync/WeeklySyncClient/types.ts` + `ToDontList/types.ts`

### Phase 4 — Planning layer

**`src/types/planning-quest.ts`**
- `PlanningQuest` (**rename dari** `Quest` di useQuestState)
- `QuarterData`
- `QuestHistoryItem`, `RankedQuest`
- `QuestInput`, `SeparatedQuests`
- Source: hooks di `planning/12-week-quests/hooks/`

---

## Critical Renames

| Old | New | Reason |
|-----|-----|--------|
| `Quest` (useQuestState.ts) | `PlanningQuest` | Clash dengan `Quest` di weekly-sync |
| `Task` (timerStore.ts) | `TimerTask` | Clash dengan domain lain |
| `ActiveTask` (PomodoroTimer) | Dihapus | Digabung ke `TimerTask` (superset) |

---

## Existing Files to Update (Phase 5)

- `src/types/calendar.ts` — update import `ActivityLogItem` dari `@/types/activity-log`
- `src/lib/soundUtils.ts` — import `SoundOption` dari `@/types/sound`

---

## Consumer Files to Update (Phase 6, ~35 files)

Setelah semua `src/types/` files dibuat, update imports di:

**Critical clusters:**
- `src/stores/timerStore.ts` + ~10 consumer files (TimerTask rename)
- `src/app/(admin)/planning/12-week-quests/hooks/*.ts` + 7 consumer files (PlanningQuest rename)
- `src/app/(admin)/execution/weekly-sync/**/*.ts` — 3+ files

---

## Old Type Files — Delete/Trim (Phase 7)

| File | Action |
|------|--------|
| `quests/daily-quests/types.ts` | Delete |
| `PomodoroTimer/types.ts` | Delete |
| `settings/profile/actions/user-profile/types.ts` | Delete |
| `BrainDump/types.ts` | Trim (keep only `BrainDumpProps`) |
| `Journal/types.ts` | Trim (keep only `OneMinuteJournalModalProps`) |
| `DailyQuest/types.ts` | Trim (keep only prop types) |
| `WeeklySyncClient/types.ts` | Trim (keep only `MainContentProps`) |
| `ToDontList/types.ts` | Trim (keep only `ToDontListCardProps`) |
| `quests/work-quests/types.ts` | Trim (keep only prop types) |
| `quests/side-quests/types.ts` | Trim (keep only `SideQuestModalProps`) |

**Prop/UI types that stay collocated (untouched):**
- `DateSelector/types.ts` — `WeekSelectorProps`, `DaySelectorProps`
- `WeeklySyncModal/types.ts` — prop types
- `WeeklySyncTable/types.ts` — prop types

---

## Verification

```bash
# After each phase:
npm run type-check   # Must be 0 new errors

# After Phase 7:
npm run type-check   # Full clean
npm run build        # Catch any module resolution issues

# Manual smoke test:
# 1. Daily Sync page loads + timer berjalan (TimerTask, DailyPlan, ActivityLogItem)
# 2. Weekly Sync modal buka + save (Quest/WeeklySync types)
# 3. 12-Week Quests comparison bekerja (PlanningQuest, QuarterData)
```

---

## README.md for src/types/

Buat `src/types/README.md` dengan aturan:
1. Import dari `@/types/<domain>` — jangan dari action/hook/store files
2. Tidak ada barrel `index.ts`
3. Prop types dan hook-return types tetap collocated di feature folders
4. FK nullable columns selalu include `| null`
