# Main-Quests Internal Types Consolidation — Design

**Date:** 2026-03-21
**Beads issue:** `bp-7e9`
**Status:** Planned

---

## Problem

Di dalam folder `src/app/(admin)/planning/main-quests/` terdapat banyak duplikasi type definitions:

- **`interface Task`** didefinisikan di 5 file berbeda (shape identik)
- **`interface Milestone`** didefinisikan di 4 file berbeda (shape identik)
- **`interface Quest`** didefinisikan di 1 file hook (hanya dipakai internal)
- **`interface QuestProgress`** didefinisikan inline di hook
- **`interface MilestoneFormData`** sudah di-export dari action file (benar)

Semua types ini **tidak diimport dari luar folder main-quests** — murni internal. Solusi: buat satu `types.ts` lokal di root `main-quests/` dan share di sana.

---

## Canonical Type Shapes

### `Task` (superset dari semua 5 definisi)

```typescript
export interface Task {
  id: string
  title: string
  status: 'TODO' | 'DONE'
  parent_task_id?: string | null
  display_order?: number
}
```

Catatan: `Quest.tsx` dan `Milestone.tsx` pakai subset (tanpa `parent_task_id` dan `display_order`) — TypeScript structural typing memungkinkan superset dipakai sebagai pengganti subset, jadi aman.

### `Milestone` (identik di semua 4 definisi)

```typescript
export interface Milestone {
  id: string
  title: string
  display_order: number
  status?: 'TODO' | 'DONE'
}
```

### `Quest` (dari `Quest/hooks/useQuestState.ts`)

```typescript
export interface Quest {
  id: string
  title: string
  motivation?: string
}
```

### `QuestProgress` (dari `Quest/hooks/useQuestProgress.ts`)

```typescript
export interface QuestProgress {
  totalMilestones: number
  completedMilestones: number
  totalTasks: number
  completedTasks: number
  totalSubtasks: number
  completedSubtasks: number
  overallProgress: number
  milestoneProgress: number
  taskProgress: number
  subtaskProgress: number
  isLoading: boolean
}
```

---

## Design Decision

### File yang dibuat

**`src/app/(admin)/planning/main-quests/types.ts`** — satu file untuk semua data types internal:

```typescript
// Data types (shared across main-quests feature)
export interface Task { ... }
export interface Milestone { ... }
export interface Quest { ... }
export interface QuestProgress { ... }
```

### Yang TIDAK dipindahkan ke types.ts

- `MilestoneFormData` — tetap di `actions/milestones/logic.ts` (server action DTO, bukan domain type)
- Semua `*Props` interfaces — tetap collocated di masing-masing component file
- `TaskItemProps`, `MilestoneItemProps`, `MilestoneBarProps`, `TaskProps`, dll — tetap di file komponen

### Kenapa tidak ke `src/types/`?

Tidak ada consumer dari luar `main-quests/` folder. Sesuai aturan di `docs/claude/type-management.md`: types yang hanya dipakai dalam 1 feature boleh collocated.

---

## Files to Modify

| File | Action |
|------|--------|
| `main-quests/types.ts` | **CREATE** — 4 domain types |
| `main-quests/Quest.tsx` | Remove `interface Task`, import dari `./types` |
| `main-quests/Milestone.tsx` | Remove `interface Task` + `interface Milestone`, import dari `./types` |
| `main-quests/Task.tsx` | Remove `interface Task`, import dari `./types` |
| `main-quests/Milestone/components/MilestoneItem.tsx` | Remove `interface Milestone`, import dari `../../types` |
| `main-quests/Milestone/components/MilestoneBar.tsx` | Remove `interface Milestone`, import dari `../../types` |
| `main-quests/Milestone/hooks/useMilestoneState.ts` | Remove `interface Milestone`, import dari `../../types` |
| `main-quests/Milestone/hooks/useMilestoneOperations.ts` | Remove `interface Milestone`, import dari `../../types` |
| `main-quests/Quest/hooks/useQuestState.ts` | Remove `interface Quest`, import dari `../../types` |
| `main-quests/Quest/hooks/useQuestProgress.ts` | Remove `interface QuestProgress`, import dari `../../types` |
| `main-quests/Task/components/TaskItem.tsx` | Remove `interface Task`, import dari `../../types` |
| `main-quests/Task/hooks/useTaskState.ts` | Remove `interface Task`, import dari `../../types` |

**Total: 1 file baru + 11 file diupdate**

---

## Verification

```bash
npm run type-check   # Zero errors
```

Manual: buka halaman Main Quests di browser, pastikan task/milestone/quest masih render normal.
