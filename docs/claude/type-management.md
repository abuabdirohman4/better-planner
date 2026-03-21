# Type/Interface Management Guidelines

**CRITICAL**: Semua domain types harus centralized di `src/types/`. Jangan buat type baru di feature folders untuk data/domain types.

---

## Aturan Utama

1. **Satu file per domain** di `src/types/` (flat, tanpa subdirectory, tanpa barrel `index.ts`)
2. **Import eksplisit**: `import type { X } from '@/types/domain'` — jangan dari action/hook/store
3. **Tidak ada duplikasi** — sebelum buat type, grep dulu
4. **Tidak ada re-export shims** dari lokasi lama — langsung delete setelah consumers diupdate

---

## Struktur `src/types/` (Status: Centralized 2026-03-21, issue bp-rxw)

| File | Domain | Key Types |
|------|--------|-----------|
| `activity-log.ts` | Activity tracking | `ActivityLogItem`, `ViewMode`, `CalendarViewMode` |
| `brain-dump.ts` | Brain dump | `BrainDumpItem` |
| `calendar.ts` | Calendar display | `CalendarBlock`, `TimeSlot` |
| `daily-plan.ts` | Daily execution | `DailyPlan`, `DailyPlanItem`, `TaskSchedule`, `ActivityViewMode` |
| `daily-quest.ts` | Daily quests | `DailyQuest` |
| `journal.ts` | Journaling | `JournalEntry`, `JournalData` |
| `planning-quest.ts` | 12-week planning | `PlanningQuest`, `QuarterData`, `RankedQuest`, `QuestInput` |
| `questContinuity.ts` | Quest continuity | `QuestWithContinuity` |
| `side-quest.ts` | Side quests | `SideQuest`, `SideQuestFormData` |
| `sound.ts` | Sound settings | `SoundSettings`, `SoundOption` |
| `timer.ts` | Pomodoro timer | `TimerState`, `TimerTask`, `TimerSettings`, `TimerSession` |
| `user-profile.ts` | User profile | `UserProfile` |
| `vision.ts` | Vision/goals | `Vision`, `VisionEntry` |
| `weekly-sync.ts` | Weekly planning | `WeeklyGoal`, `GoalItem`, `Quest` (display shape), `Rule` |
| `work-quest.ts` | Work quests | `WorkQuestProject`, `WorkQuestTask`, form variants |

> **Note**: `src/types/README.md` berisi index lengkap dengan panduan import untuk developer.

---

## ⚠️ Critical Type Renames (jangan pakai nama lama)

| ❌ Nama Lama | Lokasi Lama | ✅ Nama Baru | File Baru |
|---|---|---|---|
| `Quest` | `useQuestState.ts` | `PlanningQuest` | `@/types/planning-quest` |
| `Task` | `timerStore.ts` | `TimerTask` | `@/types/timer` |
| `ActiveTask` | `PomodoroTimer/types.ts` | `TimerTask` | `@/types/timer` |

---

## Apa yang Centralized vs Collocated

✅ **Masuk `src/types/`**:
- Database entities
- Shared domain types (dipakai di 2+ file)
- API request/response types

❌ **Tetap collocated** (di sebelah komponen/hook):
- `*Props` types (component props)
- Hook-return shapes internal
- Server action DTO yang hanya dipakai di 1 action file

---

## Cara Membuat Type Baru

1. **Cek dulu apakah sudah ada:**
   ```bash
   grep -r "interface MyType\|type MyType" src/types/
   ```

2. **Jika sudah ada** — import, jangan buat ulang:
   ```typescript
   import type { MyType } from '@/types/domain'
   ```

3. **Jika belum ada dan shared** — buat di `src/types/[domain].ts`

4. **Jika hanya untuk satu komponen** — boleh collocated

---

## Type Hierarchy Pattern

```typescript
// src/types/quest.ts — Base → Extended → Full
export interface QuestBase { id: string; title: string; type: string }
export interface QuestWithStatus extends QuestBase { status: string; updated_at: string }
export interface QuestWithProgress extends QuestWithStatus { progress: number; completed_at?: string | null }
```

---

## Nullable FK Columns

Supabase mengembalikan `null` untuk nullable columns — selalu include `| null`:

```typescript
// ✅ Benar
quest_id: string | null

// ❌ Salah
quest_id?: string
```

---

## Referensi

- `src/types/README.md` — index semua types dengan panduan import
- `docs/plans/2026-03-21-type-centralization-design.md` — design doc migrasi lengkap
- `docs/plans/2026-03-21-type-centralization-implementation-plan.md` — implementation plan untuk Antigravity
