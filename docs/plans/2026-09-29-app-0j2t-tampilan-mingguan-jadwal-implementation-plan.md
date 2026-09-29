# app-0j2t — Tampilan mingguan rencana nyata · Implementation Plan

## ⛔ Aturan executor

**JANGAN `bd close`, `bd update --status`, atau ubah status beads apa pun.** Issue ditutup Claude setelah review + uji manual. JANGAN git commit/push. Selesai = lapor ringkasan per task, lalu berhenti.

Design & alasan keputusan: `docs/plans/2026-09-29-app-0j2t-tampilan-mingguan-jadwal-design.md`.
Baca itu dulu. Ringkas: toggle `Template ideal | Minggu ini` di Best Week, `WeeklyGrid` dipakai
ulang (generik + read-only), blok diwarnai per HFG #1–#3 (biru/hijau/oranye), sisanya abu-abu.

Singkatan path:
- `BW` = `src/app/(admin)/planning/best-week`
- `RW` = `src/app/(admin)/planning/best-week/actions/real-week`

Aturan umum: jangan install paket, jangan sentuh DB/migrasi, jangan ubah file di luar daftar.

---

## Task 1 — Tipe `GridBlock` + `BlockColors`

**File:** `src/lib/best-week/types.ts` — tambahkan di **akhir file** (setelah `BlockFormData`):

```ts
export interface BlockColors {
  color: string;
  bgColor: string;
  borderColor: string;
}

// Bentuk minimal yang dirender WeeklyGrid; BestWeekBlock memenuhinya, blok jadwal nyata juga.
export type GridBlock = Pick<BestWeekBlock, 'id' | 'days' | 'start_time' | 'end_time' | 'title'> & {
  category?: ActivityCategory;
  colors?: BlockColors;
};
```

Cek: `npm run type-check` → 0 error (belum ada pemakai).

---

## Task 2 — Pure functions `real-week/logic.ts` (TDD)

### 2a. Test dulu (RED)

**File baru:** `RW/__tests__/logic.test.ts`

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  getWeekStartWib,
  addDays,
  resolveQuestId,
  schedulesToBlocks,
  HFG_COLORS,
} from '../logic';
import type { RawWeekSchedule } from '../queries';
import type { RawTask, RawMilestone } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries';

const task = (id: string, milestone_id: string | null, parent_task_id: string | null = null): RawTask => ({
  id,
  title: `Title ${id}`,
  status: 'TODO',
  milestone_id,
  type: 'MAIN_QUEST',
  parent_task_id,
});

const taskMap = new Map<string, RawTask>([
  ['t1', task('t1', 'm1')],           // quest q1
  ['t2', task('t2', null, 't3')],     // sub task → parent t3 → quest q2
  ['t3', task('t3', 'm2')],           // quest q2
  ['t4', task('t4', null)],           // daily/side quest, tanpa milestone
]);

const milestoneMap = new Map<string, RawMilestone>([
  ['m1', { id: 'm1', title: 'M1', quest_id: 'q1' }],
  ['m2', { id: 'm2', title: 'M2', quest_id: 'q2' }],
]);

// HFG #1 = q2, #2 = q1, #3 = q3
const hfgQuestIds = ['q2', 'q1', 'q3'];
const WEEK = '2026-09-28'; // Senin

const sched = (id: string, start: string, end: string, itemId: string | null): RawWeekSchedule => ({
  id,
  scheduled_start_time: start,
  scheduled_end_time: end,
  daily_plan_items: itemId ? { item_id: itemId } : null,
});

describe('getWeekStartWib', () => {
  it('Selasa → Senin minggu yang sama', () => {
    expect(getWeekStartWib(new Date('2026-09-29T05:00:00Z'))).toBe('2026-09-28');
  });

  it('Minggu sore WIB → Senin sebelumnya', () => {
    expect(getWeekStartWib(new Date('2026-10-04T10:00:00Z'))).toBe('2026-09-28');
  });

  it('Minggu 17:30 UTC sudah Senin 00:30 WIB → minggu baru', () => {
    expect(getWeekStartWib(new Date('2026-10-04T17:30:00Z'))).toBe('2026-10-05');
  });
});

describe('addDays', () => {
  it('melewati akhir bulan', () => {
    expect(addDays('2026-09-28', 6)).toBe('2026-10-04');
  });
});

describe('resolveQuestId', () => {
  it('task langsung → quest via milestone', () => {
    expect(resolveQuestId('t1', taskMap, milestoneMap)).toBe('q1');
  });

  it('sub task → quest via milestone parent', () => {
    expect(resolveQuestId('t2', taskMap, milestoneMap)).toBe('q2');
  });

  it('task tanpa milestone → null', () => {
    expect(resolveQuestId('t4', taskMap, milestoneMap)).toBeNull();
  });

  it('task tidak dikenal → null', () => {
    expect(resolveQuestId('tx', taskMap, milestoneMap)).toBeNull();
  });
});

describe('schedulesToBlocks', () => {
  const run = (schedules: RawWeekSchedule[]) =>
    schedulesToBlocks(schedules, WEEK, taskMap, milestoneMap, hfgQuestIds);

  it('konversi UTC → hari & jam WIB, sesi 25 menit dipertahankan', () => {
    const [b] = run([sched('s1', '2026-09-29T02:00:00Z', '2026-09-29T02:25:00Z', 't1')]);
    expect(b).toEqual({
      id: 's1',
      days: ['tue'],
      start_time: '09:00',
      end_time: '09:25',
      title: 'Title t1',
      hfgRank: 2,
      colors: HFG_COLORS[2],
    });
  });

  it('sub task mewarisi HFG parent', () => {
    const [b] = run([sched('s2', '2026-09-30T03:00:00Z', '2026-09-30T04:00:00Z', 't2')]);
    expect(b.hfgRank).toBe(1);
    expect(b.colors).toEqual(HFG_COLORS[1]);
  });

  it('bukan HFG → rank 0 abu-abu', () => {
    const [b] = run([sched('s3', '2026-09-30T03:00:00Z', '2026-09-30T04:00:00Z', 't4')]);
    expect(b.hfgRank).toBe(0);
    expect(b.colors).toEqual(HFG_COLORS[0]);
  });

  it('Senin 00:00 WIB (Minggu 17:00 UTC) masuk hari Senin', () => {
    const [b] = run([sched('s4', '2026-09-27T17:00:00Z', '2026-09-27T17:30:00Z', 't1')]);
    expect(b.days).toEqual(['mon']);
    expect(b.start_time).toBe('00:00');
  });

  it('di luar minggu dibuang', () => {
    expect(run([sched('s5', '2026-10-04T17:00:00Z', '2026-10-04T17:30:00Z', 't1')])).toEqual([]);
  });

  it('lewat tengah malam dipotong di 24:00', () => {
    const [b] = run([sched('s6', '2026-10-04T16:00:00Z', '2026-10-04T17:30:00Z', 't1')]);
    expect(b.days).toEqual(['sun']);
    expect(b.start_time).toBe('23:00');
    expect(b.end_time).toBe('24:00');
  });

  it('daily_plan_items null → Untitled Task, rank 0', () => {
    const [b] = run([sched('s7', '2026-09-29T02:00:00Z', '2026-09-29T02:25:00Z', null)]);
    expect(b.title).toBe('Untitled Task');
    expect(b.hfgRank).toBe(0);
  });
});
```

Jalankan:

```bash
npx vitest run "src/app/(admin)/planning/best-week/actions/real-week"
```

Expected: **FAIL** — `Failed to resolve import "../logic"` (file belum ada).

### 2b. Query dulu (dibutuhkan tipe `RawWeekSchedule`)

**File baru:** `RW/queries.ts`

```ts
// NO "use server" — importable in tests
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RawWeekSchedule {
  id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  daily_plan_items: { item_id: string } | null;
}

// ponytail: tanpa .range() — PostgREST cap 1000 baris, seminggu jadwal jauh di bawah itu.
export async function queryWeekSchedules(
  supabase: SupabaseClient,
  userId: string,
  startUTC: string,
  endUTC: string
): Promise<RawWeekSchedule[]> {
  const { data, error } = await supabase
    .from('task_schedules')
    .select('id, scheduled_start_time, scheduled_end_time, daily_plan_items!inner(item_id, daily_plans!inner(user_id))')
    .eq('daily_plan_items.daily_plans.user_id', userId)
    .gte('scheduled_start_time', startUTC)
    .lte('scheduled_start_time', endUTC)
    .order('scheduled_start_time', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as RawWeekSchedule[];
}
```

### 2c. Logic (GREEN)

**File baru:** `RW/logic.ts`

```ts
// NO "use server" — pure functions
import { getLocalDateString, getLocalTimeString } from '@/lib/dateUtils';
import { DAY_CODES } from '@/lib/best-week/constants';
import type { BlockColors, DayCode } from '@/lib/best-week/types';
import type { RawTask, RawMilestone } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries';
import type { RawWeekSchedule } from './queries';

export type HfgRank = 0 | 1 | 2 | 3;

// Palet slot Weekly Sync (questColors biru/hijau/oranye) dalam hex; 0 = bukan HFG.
export const HFG_COLORS: Record<HfgRank, BlockColors> = {
  0: { color: '#374151', bgColor: '#F3F4F6', borderColor: '#D1D5DB' },
  1: { color: '#1D4ED8', bgColor: '#DBEAFE', borderColor: '#93C5FD' },
  2: { color: '#15803D', bgColor: '#DCFCE7', borderColor: '#86EFAC' },
  3: { color: '#C2410C', bgColor: '#FFEDD5', borderColor: '#FDBA74' },
};

export interface RealWeekBlock {
  id: string;
  days: DayCode[];
  start_time: string; // "HH:MM" WIB
  end_time: string;   // "HH:MM" WIB, "24:00" kalau lewat tengah malam
  title: string;
  hfgRank: HfgRank;
  colors: BlockColors;
}

/** Senin (YYYY-MM-DD) minggu berjalan menurut kalender WIB. */
export function getWeekStartWib(now: Date): string {
  const d = new Date(`${getLocalDateString(now)}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** task → milestone → quest; sub task memakai milestone parent-nya. */
export function resolveQuestId(
  taskId: string,
  taskMap: Map<string, RawTask>,
  milestoneMap: Map<string, RawMilestone>
): string | null {
  const task = taskMap.get(taskId);
  if (!task) return null;
  const parent = task.parent_task_id ? taskMap.get(task.parent_task_id) : undefined;
  const milestoneId = task.milestone_id ?? parent?.milestone_id;
  return (milestoneId && milestoneMap.get(milestoneId)?.quest_id) || null;
}

export function schedulesToBlocks(
  schedules: RawWeekSchedule[],
  weekStart: string,
  taskMap: Map<string, RawTask>,
  milestoneMap: Map<string, RawMilestone>,
  hfgQuestIds: string[]
): RealWeekBlock[] {
  const weekDates = DAY_CODES.map((_, i) => addDays(weekStart, i));
  const blocks: RealWeekBlock[] = [];

  for (const s of schedules) {
    const start = new Date(s.scheduled_start_time);
    const end = new Date(s.scheduled_end_time);
    const startDate = getLocalDateString(start);
    const dayIndex = weekDates.indexOf(startDate);
    if (dayIndex === -1) continue;

    const taskId = s.daily_plan_items?.item_id;
    const questId = taskId ? resolveQuestId(taskId, taskMap, milestoneMap) : null;
    const hfgRank = (questId ? hfgQuestIds.indexOf(questId) + 1 : 0) as HfgRank;

    blocks.push({
      id: s.id,
      days: [DAY_CODES[dayIndex]],
      start_time: getLocalTimeString(start),
      end_time: getLocalDateString(end) === startDate ? getLocalTimeString(end) : '24:00',
      title: (taskId && taskMap.get(taskId)?.title) || 'Untitled Task',
      hfgRank,
      colors: HFG_COLORS[hfgRank],
    });
  }
  return blocks;
}
```

Jalankan ulang:

```bash
npx vitest run "src/app/(admin)/planning/best-week/actions/real-week"
```

Expected: **PASS**, 15 test (3 + 1 + 4 + 7).

### 2d. Test query

**File baru:** `RW/__tests__/queries.test.ts`

```ts
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryWeekSchedules } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryWeekSchedules', () => {
  it('filter user lewat daily_plans dan rentang start_time', async () => {
    const rows = [{ id: 's1', scheduled_start_time: 'a', scheduled_end_time: 'b', daily_plan_items: { item_id: 't1' } }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryWeekSchedules(supabase, 'user-1', 'S', 'E');

    expect(supabase.from).toHaveBeenCalledWith('task_schedules');
    expect(builder.eq).toHaveBeenCalledWith('daily_plan_items.daily_plans.user_id', 'user-1');
    expect(builder.gte).toHaveBeenCalledWith('scheduled_start_time', 'S');
    expect(builder.lte).toHaveBeenCalledWith('scheduled_start_time', 'E');
    expect(result).toEqual(rows);
  });

  it('lempar error dari Supabase', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'boom' } });
    await expect(queryWeekSchedules(makeSupabaseFrom(builder), 'u', 'S', 'E')).rejects.toEqual({ message: 'boom' });
  });
});
```

Expected: **PASS** (2 test).

> Catatan reviewer: string `.select()` PostgREST tidak tercakup test/TS. Wajib dibuktikan di cek
> manual Task 6 (blok muncul = join + filter benar).

---

## Task 3 — Server action `getRealWeekSchedules`

**File baru:** `RW/actions.ts`

```ts
"use server";

import { createClient } from '@/lib/supabase/server';
import { quarterOfDate } from '@/lib/quarterUtils';
import { wibDateToUtcRange } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/logic';
import { queryTasksByIds, queryMilestonesByIds } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries';
import { queryCommittedQuests } from '@/app/(admin)/planning/main-quests/actions/quests/queries';
import { queryWeekSchedules } from './queries';
import { addDays, schedulesToBlocks, type RealWeekBlock } from './logic';

export interface RealWeekData {
  blocks: RealWeekBlock[];
  hfgs: { rank: number; title: string }[];
}

export async function getRealWeekSchedules(weekStart: string): Promise<RealWeekData> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error('Invalid weekStart');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { startUTC } = wibDateToUtcRange(weekStart);
  const { endUTC } = wibDateToUtcRange(addDays(weekStart, 6));
  // Minggu berjalan milik quarter berjalan, bukan quarter yang sedang dipilih di header.
  const { year, quarter } = quarterOfDate(new Date(`${weekStart}T12:00:00+07:00`));

  const [schedules, hfgQuests] = await Promise.all([
    queryWeekSchedules(supabase, user.id, startUTC, endUTC),
    queryCommittedQuests(supabase, user.id, year, quarter, true, 3),
  ]);

  const taskIds = [...new Set(schedules.map(s => s.daily_plan_items?.item_id).filter((id): id is string => !!id))];
  const tasks = taskIds.length ? await queryTasksByIds(supabase, taskIds) : [];
  const parentIds = [...new Set(
    tasks.map(t => t.parent_task_id).filter((id): id is string => !!id && !taskIds.includes(id))
  )];
  const parents = parentIds.length ? await queryTasksByIds(supabase, parentIds) : [];
  const taskMap = new Map([...tasks, ...parents].map(t => [t.id, t]));

  const milestoneIds = [...new Set([...taskMap.values()].map(t => t.milestone_id).filter((id): id is string => !!id))];
  const milestones = await queryMilestonesByIds(supabase, milestoneIds);
  const milestoneMap = new Map(milestones.map(m => [m.id, m]));

  return {
    blocks: schedulesToBlocks(schedules, weekStart, taskMap, milestoneMap, hfgQuests.map(q => q.id)),
    hfgs: hfgQuests.map((q, i) => ({ rank: i + 1, title: q.title })),
  };
}
```

Tidak perlu test unit terpisah (orkestrasi tipis; logika sudah di-test di Task 2). Jangan tambahkan
ke `BW/actions/index.ts` — hook meng-import langsung.

Cek: `npm run type-check` → 0 error.

---

## Task 4 — `WeeklyGrid` generik + read-only

**File:** `BW/components/WeeklyGrid.tsx`. Ubah blok per blok (nomor baris = file saat ini):

**Baris 4-5** (import) →

```ts
import { CATEGORY_CONFIG, DAY_CODES, DAY_LABELS, TIME_SLOTS } from '@/lib/best-week/constants';
import type { DayCode, GridBlock } from '@/lib/best-week/types';
```

**Baris 14-23** (`WeeklyGridProps` + `timeToSlot`) →

```ts
// Tanpa onAddBlock/onEditBlock grid jadi read-only (dipakai tampilan jadwal nyata).
interface WeeklyGridProps<T extends GridBlock> {
  blocks: T[];
  onAddBlock?: (prefill: { start_time: string; end_time: string; day: DayCode }) => void;
  onEditBlock?: (block: T) => void;
}

// Pecahan, bukan floor: sesi 25 menit tetap punya tinggi.
function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + m / 30;
}
```

**Baris 31** →

```ts
export default function WeeklyGrid<T extends GridBlock>({ blocks, onAddBlock, onEditBlock }: WeeklyGridProps<T>) {
```

**Baris 51** (`onAddBlockRef.current({`) → `onAddBlockRef.current?.({`

**Baris 61-62** (awal `handleMouseDown`) → tambah guard di baris pertama body:

```ts
  const handleMouseDown = (dayIndex: number, slotIndex: number, e: React.MouseEvent) => {
    if (!onAddBlock) return;
    if ((e.target as HTMLElement).closest('[data-block]')) return;
```

**Baris 75** (`onAddBlock({`) → `onAddBlock?.({`

**Baris 99-125** (`renderBlocksForDay`) → ganti seluruhnya:

```tsx
  const renderBlocksForDay = (dayBlocks: T[]) => {
    return dayBlocks.map(block => {
      const startSlot = timeToSlot(block.start_time);
      const endSlot = timeToSlot(block.end_time);
      const config = block.colors ?? CATEGORY_CONFIG[block.category ?? 'transition'];
      const heightSlots = endSlot - startSlot;

      return (
        <div
          key={block.id}
          data-block="true"
          data-testid={`grid-block-${block.id}`}
          title={`${block.start_time.slice(0, 5)}–${block.end_time.slice(0, 5)} · ${block.title}`}
          onClick={onEditBlock ? () => onEditBlock(block) : undefined}
          className={`absolute left-0.5 right-0.5 rounded text-xs overflow-hidden z-10 flex items-center justify-center text-center px-1 ${onEditBlock ? 'cursor-pointer hover:opacity-90' : ''}`}
          style={{
            top: `${startSlot * 20}px`,
            height: `${heightSlots * 20}px`,
            backgroundColor: config.bgColor,
            color: config.color,
            border: `1px solid ${config.borderColor}`,
          }}
        >
          <span className="leading-tight font-medium truncate">{block.title}</span>
        </div>
      );
    });
  };
```

(Parameter `day` dibuang karena tidak dipakai.)

**Baris 181** (akhir className slot) → ganti `} cursor-crosshair\`}` dengan
`} ${onAddBlock ? 'cursor-crosshair' : ''}\`}`. Sisa className (termasuk `isDragSelected` dan
`hover:bg-gray-50`) biarkan.

**Baris 190** → `{renderBlocksForDay(blocksByDay[dayIndex])}`

Cek:

```bash
npm run type-check
```

Expected: 0 error. `BestWeekClient` tetap valid karena `BestWeekBlock` memenuhi `GridBlock` dan
`handleEditBlock(block: BestWeekBlock)` cocok dengan `onEditBlock?: (block: T) => void` (T disimpulkan
`BestWeekBlock`).

---

## Task 5 — Hook + `RealWeekView` + toggle di Best Week

### 5a. Hook

**File baru:** `BW/hooks/useRealWeekSchedules.ts`

```ts
import useSWR from 'swr';
import { getRealWeekSchedules } from '../actions/real-week/actions';
import { getWeekStartWib } from '../actions/real-week/logic';

export function useRealWeekSchedules() {
  const weekStart = getWeekStartWib(new Date());
  const { data, isLoading, error } = useSWR(
    `best-week-real-${weekStart}`,
    () => getRealWeekSchedules(weekStart)
  );

  return {
    weekStart,
    blocks: data?.blocks ?? [],
    hfgs: data?.hfgs ?? [],
    isLoading,
    error,
  };
}
```

(Key baru, jadi aman dari cache SWR persisten di localStorage. Kalau bentuk `RealWeekData` berubah
nanti, **ganti key-nya**.)

### 5b. Komponen

**File baru:** `BW/components/RealWeekView.tsx`

```tsx
"use client";

import React from 'react';
import WeeklyGrid from './WeeklyGrid';
import { useRealWeekSchedules } from '../hooks/useRealWeekSchedules';
import { HFG_COLORS, type HfgRank } from '../actions/real-week/logic';
import { formatDateIndo } from '@/lib/dateUtils';

// Berdiri sendiri (ambil data sendiri) supaya bisa dipindah ke tab Mingguan (app-5r0j) tanpa prop.
export default function RealWeekView() {
  const { weekStart, blocks, hfgs, isLoading, error } = useRealWeekSchedules();

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800" />;
  if (error) return <p className="p-4 text-sm text-red-500">Gagal memuat jadwal minggu ini.</p>;

  const legend = [
    ...hfgs.map(h => ({ key: `hfg-${h.rank}`, label: `HFG #${h.rank} · ${h.title}`, colors: HFG_COLORS[h.rank as HfgRank] })),
    { key: 'other', label: 'Lainnya', colors: HFG_COLORS[0] },
  ];

  return (
    <div data-testid="real-week-view">
      <WeeklyGrid blocks={blocks} />
      <div
        data-testid="real-week-legend"
        className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm"
      >
        <span className="text-gray-500 dark:text-gray-400">
          Minggu mulai {formatDateIndo(new Date(`${weekStart}T12:00:00+07:00`))}
        </span>
        {legend.map(item => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.colors.bgColor, border: `1px solid ${item.colors.borderColor}` }}
            />
            {item.label}
          </span>
        ))}
        {blocks.length === 0 && (
          <span className="text-gray-400">
            Belum ada jadwal minggu ini. Jadwalkan task lewat Activity Plan di Daily Sync.
          </span>
        )}
      </div>
    </div>
  );
}
```

### 5c. Toggle di `BW/BestWeekClient.tsx`

1. **Baris 10** — tambah import di bawahnya:
   ```ts
   import RealWeekView from './components/RealWeekView';
   ```
2. **Setelah baris 21** (penutup `useState` modal) — tambah (harus sebelum early return baris 40):
   ```ts
   const [view, setView] = useState<'template' | 'real'>('template');
   ```
3. **Baris 65-71** (header row) → ganti:
   ```tsx
      <div className="flex flex-wrap items-center justify-between gap-2">
        {view === 'template' ? (
          <TemplateSelector
            templates={templates}
            activeTemplate={activeTemplate}
            onMutate={mutateTemplates}
          />
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Jadwal nyata dari Activity Plan, warna per HFG</span>
        )}
        <div data-testid="best-week-view-switch" className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {([['template', 'Template ideal'], ['real', 'Minggu ini']] as const).map(([value, label]) => (
            <button
              key={value}
              data-testid={`best-week-view-${value}`}
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${view === value
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
   ```
   (Gaya segmented control disalin dari `ActivityLog.tsx:490-498`.)
4. **Baris 74-85** (isi card) → bungkus:
   ```tsx
        {view === 'real' ? (
          <RealWeekView />
        ) : loadingBlocks ? (
          <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800" />
        ) : (
          <>
            <WeeklyGrid
              blocks={blocks}
              onAddBlock={handleAddBlock}
              onEditBlock={handleEditBlock}
            />
            <HourSummary blocks={blocks} />
          </>
        )}
   ```

Cek: `npm run type-check` → 0 error.

---

## Task 6 — Verifikasi

1. `npm run test:run` → semua PASS (termasuk 17 test baru di `real-week/__tests__`).
2. `npm run type-check` → 0 error.
3. Manual (`npm run dev`, http://localhost:5100/planning/best-week, login akun Abu):
   - [ ] Default tampil **Template ideal**: grid & HourSummary persis seperti sebelumnya; drag di slot
         kosong masih membuka BlockModal; klik blok masih membuka edit.
   - [ ] Klik **Minggu ini**: TemplateSelector diganti teks keterangan, grid tampil tanpa kursor
         crosshair; drag/klik slot **tidak** membuka modal; klik blok tidak melakukan apa-apa.
   - [ ] Blok muncul untuk jadwal Activity Plan minggu ini (**bukti join + filter `.select()` benar**).
         Bandingkan satu hari dengan tab Plan di Daily Sync hari itu: jam & judul sama (WIB).
   - [ ] Sesi 25 menit tampil sebagai blok pendek (bukan hilang); hover menampilkan tooltip
         `HH:MM–HH:MM · judul`.
   - [ ] Warna: task dari HFG #1 biru, #2 hijau, #3 oranye (cocokkan urutan tab HIGH FOCUS GOAL di
         Main Quests); daily quest / side quest abu-abu.
   - [ ] Legenda menampilkan tanggal Senin minggu ini + 3 judul HFG + "Lainnya".
   - [ ] Ganti quarter di header ke quarter lain → tab Minggu ini **tidak berubah** (tetap quarter berjalan).
   - [ ] Mobile (DevTools ~390px): grid bisa di-scroll horizontal, toggle tidak terpotong.
   - [ ] Buka Daily Sync, tambah jadwal baru, kembali ke Best Week → Minggu ini ikut memuat blok baru
         (revalidate on focus / remount).

## Commit

```
feat(best-week): tampilan jadwal nyata minggu ini, warna per HFG (app-0j2t)

fixes #24

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Pattern baru: `WeeklyGrid` generik + read-only (tanpa handler) dan `HFG_COLORS` sebagai sumber
      warna HFG dalam hex — catat di `docs/claude/architecture-patterns.md` bagian Activity Plan /
      Best Week: "tampilan mingguan jadwal nyata = `RealWeekView`; HFG = committed quest urut
      priority_score (limit 3) di quarter tanggal itu, bukan quarter di store".
- [ ] Business rule baru? Pemetaan jadwal → HFG (task → milestone → quest, sub task via parent) —
      tambahkan satu paragraf di `docs/claude/business-rules.md`.
- [ ] Tabel/kolom baru? Tidak.
- [ ] Route baru? Tidak (tab di `/planning/best-week`).
- [ ] Permission pattern baru? Tidak (filter user eksplisit lewat `daily_plans!inner`, pola lama).
- [ ] `docs/products/roadmap.md` — centang item tampilan mingguan setelah `bd close app-0j2t`.
