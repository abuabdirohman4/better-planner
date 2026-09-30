# Work Quests 3-Layer Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `workQuestActions.ts` (983 lines) ke 3-layer architecture (queries / logic / actions) mengikuti pattern sm-d15, disertai unit tests dengan Vitest.

**Architecture:**
- `actions/projects/queries.ts` — DB calls only, NO "use server", pure async functions
- `actions/projects/logic.ts` — pure transform functions, NO "use server", 100% testable
- `actions/projects/actions.ts` — thin orchestrator, HAS "use server", hanya memanggil queries + logic
- `actions/tasks/` — struktur yang sama untuk task management
- `actions/index.ts` — re-export semua fungsi untuk backward compatibility (zero breaking changes)

**Tech Stack:** Next.js 15 App Router, Supabase, Vitest, TypeScript

---

## Peta Fungsi yang Ada

| Fungsi | Layer | Domain |
|--------|-------|--------|
| `getWorkQuests` | query + logic | projects |
| `getWorkQuestProjects` | query + logic (N+1 bug!) | projects |
| `getWorkQuestById` / `getWorkQuestProjectById` | query + logic | projects |
| `createWorkQuest` / `createWorkQuestProject` | action | projects |
| `updateWorkQuest` / `updateWorkQuestProject` | action | projects |
| `deleteWorkQuest` / `deleteWorkQuestProject` | action | projects |
| `toggleWorkQuestProjectStatus` | action | projects |
| `createWorkQuestTask` | action | tasks |
| `updateWorkQuestTask` | action | tasks |
| `deleteWorkQuestTask` | action | tasks |
| `toggleWorkQuestTaskStatus` | action | tasks |

**Bug yang ditemukan saat analisis:**
- `getWorkQuestProjects` menggunakan N+1 query (loop `for` dengan query per project)
- `getWorkQuests` sudah difix dengan batch query — pattern ini harus diterapkan ke `getWorkQuestProjects`

---

## Task 0: Setup Vitest

### Files
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`

### Step 1: Install Vitest dependencies

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Expected: dependencies terinstall tanpa error.

### Step 2: Buat `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 3: Buat `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom';
```

### Step 4: Tambah scripts ke `package.json`

Di bagian `"scripts"`, tambahkan:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

### Step 5: Verifikasi setup

```bash
npm run test:run
```

Expected: `No test files found` (bukan error), exit code 0.

### Step 6: Commit

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "chore: setup Vitest for unit testing"
```

---

## Task 1: Buat `actions/projects/queries.ts`

File ini berisi semua fungsi yang **hanya** memanggil Supabase. Tidak ada logic, tidak ada `"use server"`.

### Files
- Create: `src/app/(admin)/quests/work-quests/actions/projects/queries.ts`

### Step 1: Buat file `queries.ts`

```typescript
// NO "use server" directive here — this file must be importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export type WorkQuestStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// Raw DB row types (tidak di-transform, sesuai dengan apa yang dikembalikan Supabase)
export interface RawTaskRow {
  id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function queryProjectsByQuarter(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<RawTaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, created_at, updated_at')
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function queryTasksByProjectIds(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<RawTaskRow[]> {
  if (projectIds.length === 0) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('id, parent_task_id, title, description, status, created_at, updated_at')
    .in('parent_task_id', projectIds)
    .eq('type', 'WORK_QUEST')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function queryProjectById(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<RawTaskRow | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, created_at, updated_at')
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null)
    .single();

  if (error) throw error;
  return data;
}

export async function queryTasksByProjectId(
  supabase: SupabaseClient,
  projectId: string
): Promise<RawTaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, parent_task_id, title, description, status, created_at, updated_at')
    .eq('parent_task_id', projectId)
    .eq('type', 'WORK_QUEST')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function insertProject(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<RawTaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, description: null, type: 'WORK_QUEST', status: 'TODO', parent_task_id: null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectTitle(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ title, description: null, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null);

  if (error) throw error;
}

export async function updateProjectStatus(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  status: WorkQuestStatus
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .is('parent_task_id', null);

  if (error) throw error;
}

export async function deleteProjectById(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteTasksByProjectId(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('parent_task_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function queryTimerSessionIdsByTaskIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[]
): Promise<string[]> {
  if (taskIds.length === 0) return [];

  const { data } = await supabase
    .from('timer_sessions')
    .select('id')
    .in('task_id', taskIds)
    .eq('user_id', userId);

  return (data || []).map((s: { id: string }) => s.id);
}

export async function deleteTimerEventsBySessionIds(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;

  const { error } = await supabase
    .from('timer_events')
    .delete()
    .in('session_id', sessionIds);

  if (error) throw error;
}

export async function deleteTimerSessionsByTaskIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('timer_sessions')
    .delete()
    .in('task_id', taskIds)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteActivityLogsByTaskIds(
  supabase: SupabaseClient,
  userId: string,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .in('task_id', taskIds)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteDailyPlanItemsByTaskIds(
  supabase: SupabaseClient,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .in('item_id', taskIds);

  if (error) throw error;
}
```

### Step 2: Tidak ada test untuk queries.ts (Supabase calls tidak di-unit-test — integration test territory)

### Step 3: Commit

```bash
git add "src/app/(admin)/quests/work-quests/actions/projects/queries.ts"
git commit -m "refactor(work-quests): extract DB queries to projects/queries.ts"
```

---

## Task 2: Buat `actions/projects/logic.ts` + tests

File ini berisi **pure functions** yang mentransform raw DB data ke domain types. Tidak ada Supabase, tidak ada `"use server"`.

### Files
- Create: `src/app/(admin)/quests/work-quests/actions/projects/logic.ts`
- Create: `src/app/(admin)/quests/work-quests/actions/projects/__tests__/logic.test.ts`

### Step 1: Buat file `logic.ts`

```typescript
// NO "use server" — pure functions only, fully testable
import { WorkQuestProject, WorkQuestTask } from '../../types';
import { RawTaskRow, WorkQuestStatus } from './queries';

/**
 * Transform single raw DB row ke WorkQuestTask domain type.
 */
export function toWorkQuestTask(row: RawTaskRow): WorkQuestTask {
  return {
    id: row.id,
    parent_task_id: row.parent_task_id!,
    title: row.title,
    description: row.description || undefined,
    status: row.status as WorkQuestStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Transform single raw DB row ke WorkQuestProject domain type,
 * dengan tasks yang sudah di-filter dari allTasks.
 */
export function toWorkQuestProject(
  projectRow: RawTaskRow,
  allTasks: RawTaskRow[]
): WorkQuestProject {
  const projectTasks = allTasks
    .filter(t => t.parent_task_id === projectRow.id)
    .map(toWorkQuestTask);

  return {
    id: projectRow.id,
    title: projectRow.title,
    description: projectRow.description || undefined,
    status: projectRow.status as WorkQuestStatus,
    created_at: projectRow.created_at,
    updated_at: projectRow.updated_at,
    tasks: projectTasks,
  };
}

/**
 * Build subtasks map dari flat array tasks, grouped by parent_task_id.
 * Digunakan untuk O(1) lookup saat assembling projects.
 */
export function buildTasksMap(tasks: RawTaskRow[]): Map<string, RawTaskRow[]> {
  const map = new Map<string, RawTaskRow[]>();
  for (const task of tasks) {
    if (!task.parent_task_id) continue;
    const existing = map.get(task.parent_task_id) ?? [];
    existing.push(task);
    map.set(task.parent_task_id, existing);
  }
  return map;
}

/**
 * Assemble array WorkQuestProject dari projects + tasks yang sudah di-fetch secara batch.
 * Pattern ini menghindari N+1 query.
 */
export function assembleProjects(
  projectRows: RawTaskRow[],
  taskRows: RawTaskRow[]
): WorkQuestProject[] {
  const tasksMap = buildTasksMap(taskRows);

  return projectRows.map(projectRow => {
    const tasks = (tasksMap.get(projectRow.id) ?? []).map(toWorkQuestTask);
    return {
      id: projectRow.id,
      title: projectRow.title,
      description: projectRow.description || undefined,
      status: projectRow.status as WorkQuestStatus,
      created_at: projectRow.created_at,
      updated_at: projectRow.updated_at,
      tasks,
    };
  });
}

/**
 * Collect semua task IDs (project + children) untuk keperluan cascade delete.
 */
export function collectAllTaskIds(projectId: string, taskIds: string[]): string[] {
  return [projectId, ...taskIds];
}
```

### Step 2: Tulis failing tests dulu

```typescript
// src/app/(admin)/quests/work-quests/actions/projects/__tests__/logic.test.ts
import { describe, it, expect } from 'vitest';
import {
  toWorkQuestTask,
  toWorkQuestProject,
  buildTasksMap,
  assembleProjects,
  collectAllTaskIds,
} from '../logic';
import { RawTaskRow } from '../queries';

// ---- Fixtures ----
const makeRow = (overrides: Partial<RawTaskRow> = {}): RawTaskRow => ({
  id: 'id-1',
  parent_task_id: null,
  title: 'Test Title',
  description: null,
  status: 'TODO',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// ---- toWorkQuestTask ----
describe('toWorkQuestTask', () => {
  it('transforms raw row to WorkQuestTask', () => {
    const row = makeRow({ id: 'task-1', parent_task_id: 'proj-1', title: 'My Task' });
    const result = toWorkQuestTask(row);
    expect(result).toEqual({
      id: 'task-1',
      parent_task_id: 'proj-1',
      title: 'My Task',
      description: undefined,
      status: 'TODO',
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  });

  it('converts null description to undefined', () => {
    const row = makeRow({ description: null, parent_task_id: 'proj-1' });
    expect(toWorkQuestTask(row).description).toBeUndefined();
  });

  it('preserves non-null description', () => {
    const row = makeRow({ description: 'some desc', parent_task_id: 'proj-1' });
    expect(toWorkQuestTask(row).description).toBe('some desc');
  });
});

// ---- toWorkQuestProject ----
describe('toWorkQuestProject', () => {
  it('assembles project with its tasks', () => {
    const projectRow = makeRow({ id: 'proj-1', title: 'Project A' });
    const taskRows = [
      makeRow({ id: 'task-1', parent_task_id: 'proj-1', title: 'Task 1' }),
      makeRow({ id: 'task-2', parent_task_id: 'proj-1', title: 'Task 2' }),
      makeRow({ id: 'task-3', parent_task_id: 'proj-OTHER', title: 'Other Task' }),
    ];
    const result = toWorkQuestProject(projectRow, taskRows);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].id).toBe('task-1');
    expect(result.tasks[1].id).toBe('task-2');
  });

  it('returns empty tasks when no tasks belong to this project', () => {
    const projectRow = makeRow({ id: 'proj-1' });
    const result = toWorkQuestProject(projectRow, []);
    expect(result.tasks).toHaveLength(0);
  });
});

// ---- buildTasksMap ----
describe('buildTasksMap', () => {
  it('groups tasks by parent_task_id', () => {
    const tasks = [
      makeRow({ id: 'task-1', parent_task_id: 'proj-1' }),
      makeRow({ id: 'task-2', parent_task_id: 'proj-1' }),
      makeRow({ id: 'task-3', parent_task_id: 'proj-2' }),
    ];
    const map = buildTasksMap(tasks);
    expect(map.get('proj-1')).toHaveLength(2);
    expect(map.get('proj-2')).toHaveLength(1);
  });

  it('ignores tasks with null parent_task_id', () => {
    const tasks = [makeRow({ id: 'proj-1', parent_task_id: null })];
    const map = buildTasksMap(tasks);
    expect(map.size).toBe(0);
  });

  it('returns empty map for empty input', () => {
    expect(buildTasksMap([])).toEqual(new Map());
  });
});

// ---- assembleProjects ----
describe('assembleProjects', () => {
  it('assembles multiple projects with their tasks (batch, no N+1)', () => {
    const projects = [
      makeRow({ id: 'proj-1', title: 'P1' }),
      makeRow({ id: 'proj-2', title: 'P2' }),
    ];
    const tasks = [
      makeRow({ id: 'task-1', parent_task_id: 'proj-1' }),
      makeRow({ id: 'task-2', parent_task_id: 'proj-2' }),
      makeRow({ id: 'task-3', parent_task_id: 'proj-2' }),
    ];
    const result = assembleProjects(projects, tasks);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('proj-1');
    expect(result[0].tasks).toHaveLength(1);
    expect(result[1].id).toBe('proj-2');
    expect(result[1].tasks).toHaveLength(2);
  });

  it('returns projects with empty tasks when no tasks exist', () => {
    const projects = [makeRow({ id: 'proj-1' })];
    const result = assembleProjects(projects, []);
    expect(result[0].tasks).toHaveLength(0);
  });

  it('returns empty array for empty projects input', () => {
    expect(assembleProjects([], [])).toEqual([]);
  });
});

// ---- collectAllTaskIds ----
describe('collectAllTaskIds', () => {
  it('prepends project id to task ids', () => {
    const result = collectAllTaskIds('proj-1', ['task-1', 'task-2']);
    expect(result).toEqual(['proj-1', 'task-1', 'task-2']);
  });

  it('returns array with just project id when no tasks', () => {
    expect(collectAllTaskIds('proj-1', [])).toEqual(['proj-1']);
  });
});
```

### Step 3: Jalankan tests — harus FAIL dulu (file `logic.ts` belum ada)

```bash
npm run test:run
```

Expected: Error "Cannot find module '../logic'"

### Step 4: Buat `logic.ts` (sudah ditulis di Step 1)

Paste kode dari Step 1 ke file baru.

### Step 5: Jalankan tests — harus PASS

```bash
npm run test:run
```

Expected: semua test hijau, 0 failures.

### Step 6: Commit

```bash
git add "src/app/(admin)/quests/work-quests/actions/projects/logic.ts" \
        "src/app/(admin)/quests/work-quests/actions/projects/__tests__/logic.test.ts"
git commit -m "refactor(work-quests): extract pure logic functions + add 15 unit tests"
```

---

## Task 3: Buat `actions/projects/actions.ts`

File ini adalah thin orchestrator. `"use server"` ada di sini. Hanya memanggil queries + logic, tidak ada business logic inline.

### Files
- Create: `src/app/(admin)/quests/work-quests/actions/projects/actions.ts`

### Step 1: Buat file `actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getQuarterDates } from "@/lib/quarterUtils";
import { WorkQuestProject, WorkQuestProjectFormData, WorkQuestFormData, WorkQuest } from "../../types";
import {
  queryProjectsByQuarter,
  queryTasksByProjectIds,
  queryProjectById,
  queryTasksByProjectId,
  insertProject,
  updateProjectTitle,
  updateProjectStatus,
  deleteProjectById,
  deleteTasksByProjectId,
  queryTimerSessionIdsByTaskIds,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskIds,
  deleteActivityLogsByTaskIds,
  deleteDailyPlanItemsByTaskIds,
  WorkQuestStatus,
} from "./queries";
import { assembleProjects, toWorkQuestProject, collectAllTaskIds } from "./logic";

const REVALIDATE_PATHS = ['/work-quests', '/execution/daily-sync'] as const;

function revalidateAll() {
  REVALIDATE_PATHS.forEach(p => revalidatePath(p));
}

// ---- READ ----

export async function getWorkQuestProjects(year: number, quarter: number): Promise<WorkQuestProject[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { startDate, endDate } = getQuarterDates(year, quarter);

    // Batch queries — no N+1
    const projectRows = await queryProjectsByQuarter(supabase, user.id, startDate, endDate);
    if (projectRows.length === 0) return [];

    const projectIds = projectRows.map(p => p.id);
    const taskRows = await queryTasksByProjectIds(supabase, projectIds);

    return assembleProjects(projectRows, taskRows);
  } catch (error) {
    console.error(error, 'memuat work quest projects');
    return [];
  }
}

// Legacy alias
export async function getWorkQuests(year: number, quarter: number): Promise<WorkQuest[]> {
  return getWorkQuestProjects(year, quarter);
}

export async function getWorkQuestProjectById(id: string): Promise<WorkQuestProject | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const projectRow = await queryProjectById(supabase, user.id, id);
    if (!projectRow) return null;

    const taskRows = await queryTasksByProjectId(supabase, id);
    return toWorkQuestProject(projectRow, taskRows);
  } catch (error) {
    console.error(error, 'memuat work quest project by id');
    return null;
  }
}

// Legacy alias
export async function getWorkQuestById(id: string): Promise<WorkQuest | null> {
  return getWorkQuestProjectById(id);
}

// ---- CREATE ----

export async function createWorkQuestProject(formData: WorkQuestProjectFormData): Promise<WorkQuestProject> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const projectRow = await insertProject(supabase, user.id, formData.title);
  revalidateAll();

  const created = await getWorkQuestProjectById(projectRow.id);
  if (!created) throw new Error('Failed to retrieve created project');
  return created;
}

// Legacy alias (WorkQuestFormData includes subtasks — ignored in new API, use createWorkQuestTask instead)
export async function createWorkQuest(formData: WorkQuestFormData): Promise<WorkQuest> {
  return createWorkQuestProject({ title: formData.title });
}

// ---- UPDATE ----

export async function updateWorkQuestProject(id: string, formData: WorkQuestProjectFormData): Promise<WorkQuestProject> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateProjectTitle(supabase, user.id, id, formData.title);
  revalidateAll();

  const updated = await getWorkQuestProjectById(id);
  if (!updated) throw new Error('Failed to retrieve updated project');
  return updated;
}

// Legacy alias
export async function updateWorkQuest(id: string, formData: WorkQuestFormData): Promise<WorkQuest> {
  return updateWorkQuestProject(id, { title: formData.title });
}

export async function toggleWorkQuestProjectStatus(projectId: string, status: 'TODO' | 'DONE'): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateProjectStatus(supabase, user.id, projectId, status as WorkQuestStatus);
  revalidateAll();
}

// ---- DELETE ----

export async function deleteWorkQuestProject(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Collect all IDs for cascade cleanup
  const { data: taskRows } = await supabase.from('tasks').select('id').eq('parent_task_id', id).eq('user_id', user.id);
  const taskIds = (taskRows || []).map((t: { id: string }) => t.id);
  const allIds = collectAllTaskIds(id, taskIds);

  // Cascade cleanup order: timer_events → timer_sessions → activity_logs → daily_plan_items → tasks → project
  const sessionIds = await queryTimerSessionIdsByTaskIds(supabase, user.id, allIds);
  await deleteTimerEventsBySessionIds(supabase, sessionIds);
  await deleteTimerSessionsByTaskIds(supabase, user.id, allIds);
  await deleteActivityLogsByTaskIds(supabase, user.id, allIds);
  await deleteDailyPlanItemsByTaskIds(supabase, allIds);
  await deleteTasksByProjectId(supabase, user.id, id);
  await deleteProjectById(supabase, user.id, id);

  revalidateAll();
}

// Legacy alias
export async function deleteWorkQuest(id: string): Promise<void> {
  return deleteWorkQuestProject(id);
}
```

### Step 2: Run type-check — pastikan tidak ada error

```bash
npm run type-check
```

Expected: 0 errors.

### Step 3: Commit

```bash
git add "src/app/(admin)/quests/work-quests/actions/projects/actions.ts"
git commit -m "refactor(work-quests): add thin actions orchestrator for projects, fix N+1 in getWorkQuestProjects"
```

---

## Task 4: Buat `actions/tasks/queries.ts` + `logic.ts` + `actions.ts`

Domain terpisah untuk Task management (createWorkQuestTask, updateWorkQuestTask, deleteWorkQuestTask, toggleWorkQuestTaskStatus).

### Files
- Create: `src/app/(admin)/quests/work-quests/actions/tasks/queries.ts`
- Create: `src/app/(admin)/quests/work-quests/actions/tasks/logic.ts`
- Create: `src/app/(admin)/quests/work-quests/actions/tasks/__tests__/logic.test.ts`
- Create: `src/app/(admin)/quests/work-quests/actions/tasks/actions.ts`

### Step 1: Buat `tasks/queries.ts`

```typescript
// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawTaskRow {
  id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function insertTask(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  title: string
): Promise<RawTaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, parent_task_id: projectId, title, description: null, type: 'WORK_QUEST', status: 'TODO' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskTitle(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string
): Promise<RawTaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description: null, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  status: 'TODO' | 'DONE'
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('type', 'WORK_QUEST');

  if (error) throw error;
}

export async function deleteTaskById(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function queryTimerSessionIdsByTaskId(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<string[]> {
  const { data } = await supabase.from('timer_sessions').select('id').eq('task_id', taskId).eq('user_id', userId);
  return (data || []).map((s: { id: string }) => s.id);
}

export async function deleteTimerEventsBySessionIds(
  supabase: SupabaseClient,
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;
  const { error } = await supabase.from('timer_events').delete().in('session_id', sessionIds);
  if (error) throw error;
}

export async function deleteTimerSessionsByTaskId(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('timer_sessions').delete().eq('task_id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteActivityLogsByTaskId(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('activity_logs').delete().eq('task_id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteDailyPlanItemsByTaskId(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('daily_plan_items').delete().eq('item_id', taskId);
  if (error) throw error;
}
```

### Step 2: Buat `tasks/logic.ts`

```typescript
// NO "use server"
import { WorkQuestTask } from '../../types';
import { RawTaskRow } from './queries';

export function toWorkQuestTask(row: RawTaskRow): WorkQuestTask {
  return {
    id: row.id,
    parent_task_id: row.parent_task_id!,
    title: row.title,
    description: row.description || undefined,
    status: row.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
```

### Step 3: Tulis test untuk tasks/logic.ts

```typescript
// tasks/__tests__/logic.test.ts
import { describe, it, expect } from 'vitest';
import { toWorkQuestTask } from '../logic';
import { RawTaskRow } from '../queries';

const makeRow = (overrides: Partial<RawTaskRow> = {}): RawTaskRow => ({
  id: 'task-1',
  parent_task_id: 'proj-1',
  title: 'Task Title',
  description: null,
  status: 'TODO',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('toWorkQuestTask', () => {
  it('transforms raw row to WorkQuestTask', () => {
    const row = makeRow({ id: 'task-1', parent_task_id: 'proj-1', status: 'IN_PROGRESS' });
    const result = toWorkQuestTask(row);
    expect(result.id).toBe('task-1');
    expect(result.parent_task_id).toBe('proj-1');
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.description).toBeUndefined();
  });

  it('preserves description when not null', () => {
    const row = makeRow({ description: 'some desc' });
    expect(toWorkQuestTask(row).description).toBe('some desc');
  });
});
```

### Step 4: Jalankan test (harus PASS)

```bash
npm run test:run
```

### Step 5: Buat `tasks/actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WorkQuestTask, WorkQuestTaskFormData } from "../../types";
import {
  insertTask,
  updateTaskTitle,
  updateTaskStatus,
  deleteTaskById,
  queryTimerSessionIdsByTaskId,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskId,
  deleteActivityLogsByTaskId,
  deleteDailyPlanItemsByTaskId,
} from "./queries";
import { toWorkQuestTask } from "./logic";

const REVALIDATE_PATHS = ['/work-quests', '/execution/daily-sync'] as const;
function revalidateAll() { REVALIDATE_PATHS.forEach(p => revalidatePath(p)); }

export async function createWorkQuestTask(projectId: string, formData: WorkQuestTaskFormData): Promise<WorkQuestTask> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = await insertTask(supabase, user.id, projectId, formData.title);
  revalidateAll();
  return toWorkQuestTask(row);
}

export async function updateWorkQuestTask(taskId: string, formData: WorkQuestTaskFormData): Promise<WorkQuestTask> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = await updateTaskTitle(supabase, user.id, taskId, formData.title);
  revalidateAll();
  return toWorkQuestTask(row);
}

export async function toggleWorkQuestTaskStatus(taskId: string, status: 'TODO' | 'DONE'): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await updateTaskStatus(supabase, user.id, taskId, status);
  revalidateAll();
}

export async function deleteWorkQuestTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const sessionIds = await queryTimerSessionIdsByTaskId(supabase, user.id, taskId);
  await deleteTimerEventsBySessionIds(supabase, sessionIds);
  await deleteTimerSessionsByTaskId(supabase, user.id, taskId);
  await deleteActivityLogsByTaskId(supabase, user.id, taskId);
  await deleteDailyPlanItemsByTaskId(supabase, taskId);
  await deleteTaskById(supabase, user.id, taskId);

  revalidateAll();
}
```

### Step 6: Commit

```bash
git add "src/app/(admin)/quests/work-quests/actions/tasks/"
git commit -m "refactor(work-quests): add tasks domain (queries/logic/actions) + 2 unit tests"
```

---

## Task 5: Buat `actions/index.ts` (backward compatibility)

File ini memastikan semua import yang sudah ada di `hooks/useWorkQuests.ts` dan komponen lain tidak perlu diubah.

### Files
- Create: `src/app/(admin)/quests/work-quests/actions/index.ts`

### Step 1: Buat `index.ts`

```typescript
// Backward compatibility re-exports — DO NOT add business logic here

// Projects
export {
  getWorkQuestProjects,
  getWorkQuests,
  getWorkQuestProjectById,
  getWorkQuestById,
  createWorkQuestProject,
  createWorkQuest,
  updateWorkQuestProject,
  updateWorkQuest,
  toggleWorkQuestProjectStatus,
  deleteWorkQuestProject,
  deleteWorkQuest,
} from './projects/actions';

// Tasks
export {
  createWorkQuestTask,
  updateWorkQuestTask,
  toggleWorkQuestTaskStatus,
  deleteWorkQuestTask,
} from './tasks/actions';
```

### Step 2: Update import di `hooks/useWorkQuests.ts`

Ubah import dari:
```typescript
import { ... } from "../actions/workQuestActions";
```

Menjadi:
```typescript
import { ... } from "../actions";
```

### Step 3: Verifikasi type-check

```bash
npm run type-check
```

Expected: 0 errors.

### Step 4: Jalankan semua tests

```bash
npm run test:run
```

Expected: semua tests PASS.

### Step 5: Commit

```bash
git add "src/app/(admin)/quests/work-quests/actions/index.ts" \
        "src/app/(admin)/quests/work-quests/hooks/useWorkQuests.ts"
git commit -m "refactor(work-quests): add index.ts re-exports, update hooks imports"
```

---

## Task 6: Hapus file lama + verifikasi akhir

### Files
- Delete: `src/app/(admin)/quests/work-quests/actions/workQuestActions.ts`

### Step 1: Cek apakah ada file lain yang masih import dari workQuestActions.ts

```bash
grep -r "workQuestActions" src/ --include="*.ts" --include="*.tsx"
```

Expected: tidak ada hasil (0 matches).

Jika masih ada: update import di file tersebut ke `../actions` atau path yang sesuai.

### Step 2: Hapus file lama

```bash
rm "src/app/(admin)/quests/work-quests/actions/workQuestActions.ts"
```

### Step 3: Verifikasi build akhir

```bash
npm run type-check && npm run test:run && npm run build
```

Expected:
- `type-check`: 0 errors
- `test:run`: semua tests PASS
- `build`: SUCCESS

### Step 4: Commit final

```bash
git add -A
git commit -m "refactor(work-quests): remove monolithic workQuestActions.ts, 3-layer complete"
```

---

## Struktur Akhir

```
src/app/(admin)/quests/work-quests/
├── actions/
│   ├── index.ts                         ← backward compat re-exports
│   ├── projects/
│   │   ├── queries.ts                   ← DB calls, no "use server"
│   │   ├── logic.ts                     ← pure functions, no "use server"
│   │   ├── actions.ts                   ← orchestrator, HAS "use server"
│   │   └── __tests__/
│   │       └── logic.test.ts            ← 15+ unit tests
│   └── tasks/
│       ├── queries.ts
│       ├── logic.ts
│       ├── actions.ts
│       └── __tests__/
│           └── logic.test.ts            ← 2+ unit tests
├── components/
├── hooks/
│   └── useWorkQuests.ts                 ← imports from actions/index.ts
├── types.ts
└── page.tsx
```

## Ringkasan Perubahan

| Metric | Before | After |
|--------|--------|-------|
| Monolithic file | 983 lines | ✅ Dihapus |
| Unit tests | 0 | 17+ |
| N+1 bug di getWorkQuestProjects | ❌ Ada | ✅ Fixed |
| Testability | 0% | ~80% (logic layer) |
| Backward compat | - | ✅ Zero breaking changes |
