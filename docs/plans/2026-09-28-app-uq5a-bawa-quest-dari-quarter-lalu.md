# app-uq5a — Bawa quest dari quarter lalu

**Bergantung pada:** `app-0ank` (menambah helper `createdAtForQuarter` di `src/lib/quarterUtils.ts`). Kerjakan app-0ank dulu.

## Masalah

Quest daily/work/side tidak punya kolom quarter. Semuanya masuk quarter lewat
`tasks.created_at` dalam rentang `getQuarterDates(year, quarter)`:

| Tipe | Query | Filter quarter |
|---|---|---|
| Daily | `execution/daily-sync/DailyQuest/actions/daily-quest/queries.ts:128` `queryDailyQuests` | `created_at` |
| Side | `quests/side-quests/actions/side-quest/queries.ts:3` `querySideQuests` | `created_at` |
| Work | `quests/work-quests/actions/projects/queries.ts:17` `queryProjectsByQuarter` | `created_at` project induk; anak (`parent_task_id`) ikut induknya tanpa filter tanggal |

Jadi saat pindah quarter, semua quest lama hilang dari daftar. Abu ingin memilih quest
quarter sebelumnya untuk dimasukkan lagi.

## Keputusan (Abu, 28 Sep 2026)

1. **Salin, bukan pindah.** Quest terpilih dibuat ulang sebagai baris `tasks` baru di quarter
   target, status `TODO`. Baris lama tidak disentuh, jadi riwayat pomodoro, activity log,
   dan statistik quarter lama tetap utuh. Tidak ada migrasi DB.
2. **Tombol di tiap halaman quest:** "Ambil dari quarter lalu" di Daily, Work, dan Side
   Quest. Tombol itu membuka modal checklist quest dari quarter sebelumnya.

## Aturan salin

| Tipe | Kandidat (dari quarter sebelumnya) | Yang disalin |
|---|---|---|
| Daily | yang `is_archived = false` | `title`, `focus_duration`, `type`; status `TODO` |
| Side | yang `status != 'DONE'` | `title`, `description`; status `TODO` |
| Work | project induk yang `status != 'DONE'` | project (`title`, `description`) + **anak yang `status != 'DONE'`** (`title`, `description`, `parent_task_id` = id project baru); semua status `TODO` |

- Quarter sumber = `getPrevQuarter(year, quarter)` (`src/lib/quarterUtils.ts:88`), dengan `year/quarter` = quarter yang sedang dilihat di `useQuarterStore`.
- `created_at` baris baru = `createdAtForQuarter(year, quarter)` (dari app-0ank) — supaya salinan masuk quarter yang sedang dilihat, bukan quarter hari ini.
- **Cegah dobel:** kandidat yang judulnya (trim + lowercase) sudah ada di quarter target ditandai "sudah ada" dan checkbox-nya disabled.
- Kandidat default: semua **tidak** tercentang (Abu memilih sendiri).

---

## Task 1 — Logic murni (TDD)

**Folder baru:** `src/app/(admin)/quests/actions/carry-over/` — ikuti pola 3 file yang sudah dipakai (`logic.ts` murni, `queries.ts` tanpa "use server", `actions.ts` "use server").

**`logic.ts`**

```ts
// NO "use server" — pure functions only
export type CarryOverType = 'DAILY_QUEST' | 'SIDE_QUEST' | 'WORK_QUEST';

export interface SourceTask {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  is_archived?: boolean | null;
  focus_duration?: number | null;
  parent_task_id?: string | null;
}

export interface CarryOverCandidate {
  id: string;
  title: string;
  detail: string | null;    // Work: "3 tugas belum selesai"; lainnya null
  alreadyExists: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();

export function isCandidate(type: CarryOverType, t: SourceTask): boolean {
  if (type === 'DAILY_QUEST') return !t.is_archived;
  return t.status !== 'DONE';
}

export function buildCandidates(
  type: CarryOverType,
  sourceTop: SourceTask[],
  sourceChildren: SourceTask[],
  targetTitles: string[]
): CarryOverCandidate[] {
  const existing = new Set(targetTitles.map(norm));
  return sourceTop.filter(t => isCandidate(type, t)).map(t => {
    const openChildren = sourceChildren.filter(c => c.parent_task_id === t.id && c.status !== 'DONE').length;
    return {
      id: t.id,
      title: t.title,
      detail: type === 'WORK_QUEST' ? `${openChildren} tugas belum selesai` : null,
      alreadyExists: existing.has(norm(t.title)),
    };
  });
}

export function buildCopyRow(type: CarryOverType, t: SourceTask, userId: string, createdAt: string, parentId: string | null = null) {
  const row: Record<string, unknown> = {
    user_id: userId,
    title: t.title,
    description: t.description ?? null,
    type,
    status: 'TODO',
    milestone_id: null,
    parent_task_id: parentId,
    created_at: createdAt,
  };
  if (type === 'DAILY_QUEST') row.focus_duration = t.focus_duration ?? 25;
  return row;
}
```

**Test `__tests__/logic.test.ts`** (tulis dulu, harus FAIL):
- `isCandidate`: daily archived → false; daily tidak archived meski DONE → true; side DONE → false; work IN_PROGRESS → true.
- `buildCandidates`: judul `"  Olahraga "` vs target `["olahraga"]` → `alreadyExists: true`; work project dengan 3 anak (1 DONE) → `detail: "2 tugas belum selesai"`; kandidat yang tidak lolos `isCandidate` tidak muncul.
- `buildCopyRow`: daily membawa `focus_duration`; side tidak punya key `focus_duration`; status selalu `TODO`; `parent_task_id` sesuai argumen; `created_at` sesuai argumen.

`npx vitest run "src/app/(admin)/quests/actions/carry-over"` → FAIL → implement → PASS.

## Task 2 — Queries

**`queries.ts`**

```ts
// NO "use server" — importable in tests
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CarryOverType, SourceTask } from './logic';

const COLS = 'id, title, description, status, is_archived, focus_duration, parent_task_id';

export async function queryTopTasksInRange(
  supabase: SupabaseClient, userId: string, type: CarryOverType, startIso: string, endIso: string
): Promise<SourceTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(COLS)
    .eq('user_id', userId)
    .eq('type', type)
    .is('parent_task_id', null)
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function queryTasksByIds(
  supabase: SupabaseClient, userId: string, type: CarryOverType, ids: string[]
): Promise<SourceTask[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks').select(COLS).eq('user_id', userId).eq('type', type).in('id', ids);
  if (error) throw error;
  return data ?? [];
}

export async function queryChildren(
  supabase: SupabaseClient, userId: string, parentIds: string[]
): Promise<SourceTask[]> {
  if (parentIds.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks').select(COLS).eq('user_id', userId).in('parent_task_id', parentIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertTasks(supabase: SupabaseClient, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('tasks').insert(rows).select('id');
  if (error) throw error;
  return (data ?? []) as { id: string }[];
}
```

> Catatan: `.is('parent_task_id', null)` aman untuk daily/side (kolomnya selalu null untuk tipe itu). `.in()` dengan puluhan id aman; quest per quarter tidak sampai ratusan.

## Task 3 — Server actions (TDD)

**`actions.ts`**

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getQuarterDates, getPrevQuarter, createdAtForQuarter } from '@/lib/quarterUtils';
import { buildCandidates, buildCopyRow, type CarryOverType, type CarryOverCandidate } from './logic';
import { queryTopTasksInRange, queryTasksByIds, queryChildren, insertTasks } from './queries';

const PATHS: Record<CarryOverType, string> = {
  DAILY_QUEST: '/quests/daily-quests',
  SIDE_QUEST: '/quests/side-quests',
  WORK_QUEST: '/quests/work-quests',
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return { supabase, userId: user.id };
}

function rangeIso(year: number, quarter: number) {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  return [startDate.toISOString(), endDate.toISOString()] as const;
}

export async function getCarryOverCandidates(type: CarryOverType, year: number, quarter: number): Promise<CarryOverCandidate[]> {
  const { supabase, userId } = await requireUser();
  const prev = getPrevQuarter(year, quarter);
  const source = await queryTopTasksInRange(supabase, userId, type, ...rangeIso(prev.year, prev.quarter));
  const target = await queryTopTasksInRange(supabase, userId, type, ...rangeIso(year, quarter));
  const children = type === 'WORK_QUEST' ? await queryChildren(supabase, userId, source.map(s => s.id)) : [];
  return buildCandidates(type, source, children, target.map(t => t.title));
}

export async function carryOverQuests(type: CarryOverType, ids: string[], year: number, quarter: number): Promise<number> {
  if (ids.length === 0) return 0;
  const { supabase, userId } = await requireUser();
  const createdAt = createdAtForQuarter(year, quarter);
  const sources = await queryTasksByIds(supabase, userId, type, ids);

  if (type !== 'WORK_QUEST') {
    await insertTasks(supabase, sources.map(s => buildCopyRow(type, s, userId, createdAt)));
  } else {
    const children = await queryChildren(supabase, userId, sources.map(s => s.id));
    for (const project of sources) {
      const [created] = await insertTasks(supabase, [buildCopyRow(type, project, userId, createdAt)]);
      const openChildren = children.filter(c => c.parent_task_id === project.id && c.status !== 'DONE');
      await insertTasks(supabase, openChildren.map(c => buildCopyRow(type, c, userId, createdAt, created.id)));
    }
  }

  revalidatePath(PATHS[type]);
  return sources.length;
}
```

> `queryTasksByIds` memfilter `user_id` dan `type`, jadi id milik user lain / tipe lain diabaikan (id dikirim dari client).
> `ponytail:` loop insert per project (N+1 kecil) — cukup karena project per quarter sedikit; ganti ke RPC transaksi kalau jumlahnya besar atau butuh atomik.

**Test `__tests__/actions.test.ts`** (pola sama dengan `quests/side-quests/actions/side-quest/__tests__/actions.test.ts`: mock `next/cache`, `@/lib/supabase/server`, `@/lib/quarterUtils`; pakai `makeQueryBuilder`/`makeSupabase` dari `@/test-utils/supabase-mock`):
- `getCarryOverCandidates` throw `User not authenticated` kalau user null.
- `carryOverQuests([], ...)` → `0` tanpa memanggil `createClient`.
- `carryOverQuests('SIDE_QUEST', ['t1'], 2026, 4)` → `insert` dipanggil sekali dengan array 1 baris yang punya `status: 'TODO'` dan `created_at` dari mock `createdAtForQuarter`.

## Task 4 — Modal `CarryOverModal`

**File baru:** `src/app/(admin)/quests/components/CarryOverModal.tsx`

Props:

```ts
interface CarryOverModalProps {
  type: CarryOverType;
  year: number;
  quarter: number;
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void; // dipanggil setelah salin sukses → halaman refetch
}
```

Perilaku:
- Data: `useSWR(isOpen ? ['carry-over', type, year, quarter] : null, () => getCarryOverCandidates(type, year, quarter))`.
- Pakai `Modal` dari `@/components/ui/modal` (`size="md"`, `title` = `Ambil dari Q{prev.quarter} {prev.year}`; hitung `prev` dengan `getPrevQuarter`).
- Loading → `Spinner` (`@/components/ui/spinner/Spinner`, default export). Kosong → teks "Tidak ada quest yang bisa dibawa dari quarter lalu."
- Daftar: tiap kandidat satu baris `<label>` berisi `<input type="checkbox">` native + judul + `detail` (teks kecil abu). Kalau `alreadyExists`: checkbox `disabled`, teks badge kecil "sudah ada".
- Header daftar: tombol teks "Pilih semua" / "Kosongkan" (hanya kandidat yang tidak `alreadyExists`).
- `footer`: `Button` "Batal" (variant outline) + `Button` "Bawa (N)" disabled kalau N = 0, `loading` saat menyimpan.
- Simpan: `await carryOverQuests(type, [...selected], year, quarter)` → `toast.success(\`${n} quest dibawa ke quarter ini\`)` → reset pilihan → `onDone()` → `onClose()`. Error → `toast.error("Gagal membawa quest")`.
- testid: `carry-over-open-btn` (di halaman), `carry-over-item-<id>`, `carry-over-submit-btn`.

## Task 5 — Pasang di tiga halaman

Di tiap halaman tambahkan state `isCarryOverOpen`, tombol `Button` variant `outline` size `md` bertuliskan **"Ambil dari quarter lalu"** di sebelah kiri tombol Add yang sudah ada (bungkus keduanya `div className="flex gap-2"`), dan render modal:

| Halaman | `type` | `onDone` |
|---|---|---|
| `src/app/(admin)/quests/daily-quests/page.tsx` | `'DAILY_QUEST'` | `refetch` |
| `src/app/(admin)/quests/work-quests/page.tsx` | `'WORK_QUEST'` | `() => mutate()` |
| `src/app/(admin)/quests/side-quests/page.tsx` | `'SIDE_QUEST'` | `refetch` (tombol Add sudah ada dari app-0ank) |

Import type `CarryOverType` tidak perlu di halaman (string literal cukup).

Daily quest juga dipakai di Daily Sync (`dailySyncKeys` di `useDailyQuests.ts`). Setelah salin daily quest, panggil juga invalidasi yang sama dengan yang dipakai `addDailyQuest` di `DailyQuestList.tsx` (cek sekitar baris 86-92) supaya Daily Sync ikut segar.

## Task 6 — Verifikasi

1. `npx vitest run "src/app/(admin)/quests"` → PASS.
2. `npm run type-check` → 0 error.
3. Manual (port 5100), dengan data Abu (Q3 2026 sekarang, sumber Q2 2026):
   - Daily Quests → "Ambil dari quarter lalu" → modal berisi daily quest Q2 yang tidak diarsip; yang judulnya sudah ada di Q3 disabled "sudah ada". Centang 2 → Bawa (2) → daftar Q3 bertambah 2.
   - Buka modal lagi → dua quest tadi kini "sudah ada".
   - Work Quests → bawa 1 project → project muncul di Q3 berisi hanya tugas yang belum selesai.
   - Side Quests → bawa 1 → muncul.
   - Pilih quarter Q2 di selector → quest asli Q2 masih ada dan statusnya tidak berubah.
4. DB check (MCP `better-planner`, filter `user_id = '59076bab-b21c-49ce-a7d1-7b9d69a6001c'`): baris baru punya `created_at` di rentang Q3 dan `status = 'TODO'`.

## Commit

```
feat(quests): bawa quest pilihan dari quarter lalu (app-uq5a)

Salin daily/work/side quest terpilih ke quarter yang sedang dilihat.
Baris lama tidak disentuh supaya riwayat quarter lama utuh.

fixes #17

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Pattern baru: fitur carry-over — tambahkan 3-4 baris di `docs/claude/business-rules.md` bagian Quarter/Quest: "quest diikat ke quarter lewat created_at; pindah quarter = salin lewat `carryOverQuests`, bukan update".
- [ ] Tabel baru? Tidak.
- [ ] Route baru? Tidak (hanya modal).
- [ ] Permission pattern baru? Tidak.
- [ ] Update `docs/products/roadmap.md` saat close.
