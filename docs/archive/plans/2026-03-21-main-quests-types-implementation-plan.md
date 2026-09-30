# Main-Quests Internal Types Consolidation — Implementation Plan

**Date:** 2026-03-21
**Design doc:** `docs/plans/2026-03-21-main-quests-types-design.md`
**Beads issue:** `bp-7e9`
**Total files:** 1 baru + 11 diupdate

---

## Prerequisites

```bash
npm run type-check   # Record baseline — note pre-existing errors
git status           # Ensure working tree is clean
```

---

## Task 1 — Create `src/app/(admin)/planning/main-quests/types.ts`

Buat file baru dengan 4 canonical types:

```typescript
// Internal domain types for main-quests feature
// These types are NOT exported outside this feature folder

export interface Task {
  id: string
  title: string
  status: 'TODO' | 'DONE'
  parent_task_id?: string | null
  display_order?: number
}

export interface Milestone {
  id: string
  title: string
  display_order: number
  status?: 'TODO' | 'DONE'
}

export interface Quest {
  id: string
  title: string
  motivation?: string
}

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

**Checkpoint:**
```bash
npm run type-check   # Must have 0 new errors
```

---

## Task 2 — Update `main-quests/Quest.tsx`

File: `src/app/(admin)/planning/main-quests/Quest.tsx`

1. Read the file first
2. Remove `interface Task { ... }` (lines ~13-17)
3. Remove `interface QuestProps { ... }` — **KEEP** this (it's a prop type, stays collocated)
4. Add import di bagian atas (setelah existing imports):
   ```typescript
   import type { Task } from './types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 3 — Update `main-quests/Milestone.tsx`

File: `src/app/(admin)/planning/main-quests/Milestone.tsx`

1. Read the file first
2. Remove `interface Task { ... }` (lines ~13-17)
3. Remove `interface Milestone { ... }` (lines ~19-24)
4. Keep `interface MilestoneProps { ... }` — prop type, stays collocated
5. Add import:
   ```typescript
   import type { Task, Milestone } from './types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 4 — Update `main-quests/Task.tsx`

File: `src/app/(admin)/planning/main-quests/Task.tsx`

1. Read the file first
2. Remove `interface Task { ... }` (lines ~24-30)
3. Keep `interface TaskProps { ... }` — prop type, stays collocated
4. Add import:
   ```typescript
   import type { Task } from './types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 5 — Update `Milestone/components/MilestoneItem.tsx`

File: `src/app/(admin)/planning/main-quests/Milestone/components/MilestoneItem.tsx`

1. Read the file first
2. Remove `interface Milestone { ... }`
3. Keep `interface MilestoneItemProps { ... }` — prop type
4. Add import:
   ```typescript
   import type { Milestone } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 6 — Update `Milestone/components/MilestoneBar.tsx`

File: `src/app/(admin)/planning/main-quests/Milestone/components/MilestoneBar.tsx`

1. Read the file first
2. Remove `interface Milestone { ... }`
3. Keep `interface MilestoneBarProps { ... }` — prop type
4. Add import:
   ```typescript
   import type { Milestone } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 7 — Update `Milestone/hooks/useMilestoneState.ts`

File: `src/app/(admin)/planning/main-quests/Milestone/hooks/useMilestoneState.ts`

1. Read the file first
2. Remove `interface Milestone { ... }`
3. Add import:
   ```typescript
   import type { Milestone } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 8 — Update `Milestone/hooks/useMilestoneOperations.ts`

File: `src/app/(admin)/planning/main-quests/Milestone/hooks/useMilestoneOperations.ts`

1. Read the file first
2. Remove `interface Milestone { ... }`
3. Add import:
   ```typescript
   import type { Milestone } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 9 — Update `Quest/hooks/useQuestState.ts`

File: `src/app/(admin)/planning/main-quests/Quest/hooks/useQuestState.ts`

1. Read the file first
2. Remove `interface Quest { ... }`
3. Add import:
   ```typescript
   import type { Quest } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 10 — Update `Quest/hooks/useQuestProgress.ts`

File: `src/app/(admin)/planning/main-quests/Quest/hooks/useQuestProgress.ts`

1. Read the file first
2. Remove `interface QuestProgress { ... }`
3. Add import:
   ```typescript
   import type { QuestProgress } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 11 — Update `Task/components/TaskItem.tsx`

File: `src/app/(admin)/planning/main-quests/Task/components/TaskItem.tsx`

1. Read the file first
2. Remove `interface Task { ... }`
3. Keep `interface TaskItemProps { ... }` — prop type
4. Add import:
   ```typescript
   import type { Task } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 12 — Update `Task/hooks/useTaskState.ts`

File: `src/app/(admin)/planning/main-quests/Task/hooks/useTaskState.ts`

1. Read the file first
2. Remove `interface Task { ... }`
3. Add import:
   ```typescript
   import type { Task } from '../../types'
   ```

**Checkpoint:**
```bash
npm run type-check
```

---

## Task 13 — Final Verification

```bash
# Full type check
npm run type-check   # Must be 0 errors

# Build check
npm run build
```

Verifikasi manual: buka halaman Main Quests di browser, pastikan task/milestone/quest masih render normal.

---

## Commit Message

```
refactor(types): consolidate internal types in main-quests feature (bp-7e9)

- Create main-quests/types.ts with Task, Milestone, Quest, QuestProgress
- Remove 9 duplicate inline type definitions across 11 files
- All consumers import from ./types or ../../types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
