# app-7z06 — Carry-over dari semua quarter + pilih task Work Quest

Lanjutan `app-uq5a` (commit `9dca87d`). Baca dulu kode yang sudah ada:
- `src/app/(admin)/quests/actions/carry-over/{logic,queries,actions}.ts`
- `src/app/(admin)/quests/components/CarryOverModal.tsx`

## Permintaan Abu (28 Sep 2026)

1. **Work Quest:** bisa membawa sebagian task saja dari sebuah project, bukan project utuh.
2. **Sumber:** bukan hanya quarter sebelumnya, tapi **semua quarter sebelum quarter yang dilihat** yang masih punya quest belum selesai.

## Keputusan desain

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Sumber = semua quest bertipe itu dengan `created_at < startDate` quarter target. Quarter depan tidak ikut. | "Bawa ke depan", bukan tarik dari masa depan. |
| D2 | Syarat kandidat tetap: daily = tidak diarsip; side/work = status bukan DONE; task work = status bukan DONE. | Sama dengan app-uq5a. |
| D3 | **Dedup per judul (trim + lowercase), ambil yang paling baru.** | Salinan tidak mengubah quest asli, jadi quest Q2 yang sudah dibawa ke Q3 tetap TODO di Q2. Tanpa dedup, satu quest muncul di setiap quarter yang pernah dilaluinya. |
| D4 | Work: project dengan judul sama dari beberapa quarter **digabung jadi satu kandidat**. Isinya gabungan task belum selesai dari semua project itu, didedup per judul (ambil yang terbaru). `id` kandidat = id project terbaru. | Konsekuensi D3. Bisa terjadi task tertinggal di project Q2, sementara project Q3 membawa task lain. |
| D5 | Modal dikelompokkan per quarter asal (terbaru di atas). Quarter asal = quarter dari `created_at` quest terbaru hasil D3. Judul modal: **"Ambil dari quarter sebelumnya"**. Tombol di halaman tetap. | Abu perlu tahu asal quest. |
| D6 | Work di modal: checkbox project + checkbox per task. Mencentang project = centang semua task yang tersedia. Mencentang task otomatis ikut memilih project-nya. Project boleh dibawa tanpa task (jadi project kosong). | Permintaan (1). |
| D7 | **Kalau quarter target sudah punya project dengan judul sama, task ditambahkan ke project itu. Project baru tidak dibuat.** Project seperti itu tidak di-disable, badge-nya "sudah ada — tambah task". Task yang judulnya sudah ada di project target → disabled, badge "sudah ada". | Supaya Abu bisa menyusul task tambahan tanpa project kembar. |
| D8 | Daily/Side tetap satu level, cuma dikelompokkan per quarter. | Tidak punya task. |

---

## Task 1 — Helper quarter dari tanggal (TDD)

`src/lib/quarterUtils.ts` — tambah di bawah `createdAtForQuarter`:

```ts
// Quarter perencanaan (13 minggu) tempat sebuah tanggal jatuh.
export function quarterOfDate(date: Date): { year: number; quarter: number } {
  const { weekNumber, year } = getWeekAndYearFromDate(date);
  return { year, quarter: getQuarterFromWeek(weekNumber) };
}
```

Test di `src/lib/__tests__/quarterUtils.createdAt.test.ts` (tambah `describe('quarterOfDate')`):
- `quarterOfDate(getQuarterDates(2026, 3).startDate)` → `{ year: 2026, quarter: 3 }`
- `quarterOfDate(new Date(getQuarterDates(2026, 4).startDate.getTime() + 86400000))` → `{ year: 2026, quarter: 4 }`
- `quarterOfDate(getQuarterDates(2026, 1).startDate)` → `{ year: 2026, quarter: 1 }` (tanggal Desember 2025 → planning year 2026)

RED → implement → GREEN.

## Task 2 — Logic baru (TDD)

Ganti isi `logic.ts` (hapus `buildCandidates` + `CarryOverCandidate` lama, `isCandidate` dan `buildCopyRow` tetap). `SourceTask` ditambah `created_at: string`.

```ts
export interface CarryOverChild { id: string; title: string; alreadyExists: boolean; }

export interface CarryOverCandidate {
  id: string;                // id quest/project terbaru untuk judul ini
  title: string;
  source: { year: number; quarter: number };
  alreadyExists: boolean;    // daily/side: disabled. work: project sudah ada di target (task masuk ke sana)
  children: CarryOverChild[]; // work saja; lainnya []
}

export interface CarryOverGroup {
  year: number;
  quarter: number;
  candidates: CarryOverCandidate[];
}

/** Ambil satu per judul (ternormalisasi), yang created_at-nya paling baru. */
export function latestByTitle<T extends { title: string; created_at: string }>(rows: T[]): T[]

export function buildGroups(
  type: CarryOverType,
  sourceTop: SourceTask[],        // semua top-level sebelum quarter target
  sourceChildren: SourceTask[],   // anak dari semua sourceTop (work saja)
  targetTop: SourceTask[],        // top-level di quarter target
  targetChildren: SourceTask[],   // anak dari targetTop (work saja)
  quarterOf: (iso: string) => { year: number; quarter: number }
): CarryOverGroup[]
```

Aturan `buildGroups`:
1. `latest = latestByTitle(sourceTop.filter(t => isCandidate(type, t)))`.
2. Work: untuk tiap `p` di `latest`, `ids` = id semua project di `sourceTop` yang lolos `isCandidate` dan judulnya sama dengan `p` (project DONE dianggap selesai beserta isinya). Children = `latestByTitle(sourceChildren.filter(c => ids.includes(c.parent_task_id) && c.status !== 'DONE'))`.
3. `targetProject` = project di `targetTop` dengan judul sama. Child `alreadyExists` = judulnya ada di `targetChildren` yang `parent_task_id === targetProject.id`.
4. Buang kandidat work yang `alreadyExists` **dan** semua child-nya `alreadyExists` (tidak ada yang bisa dibawa). Daily/side yang `alreadyExists` tetap tampil (disabled), sama seperti sekarang.
5. Kelompokkan per `quarterOf(p.created_at)`, urut quarter terbaru dulu. Di dalam grup urut `created_at` naik.

`quarterOf` diinjeksi supaya test tidak bergantung ke kalender. Di action isinya `iso => quarterOfDate(new Date(iso))`.

Test `__tests__/logic.test.ts` — ganti blok `buildCandidates` dengan `latestByTitle` + `buildGroups`:
- `latestByTitle`: dua baris judul `"Olahraga"` / `" olahraga "` → hanya yang `created_at` lebih baru.
- daily: quest Q2 + salinannya di Q3 (judul sama) → satu kandidat di grup Q3.
- side DONE tidak muncul; side yang judulnya ada di target → `alreadyExists: true`.
- work: project "A" di Q2 (task t1 TODO, t2 DONE) dan project "A" di Q3 (task t3 TODO, t1' judul sama dengan t1 lebih baru) → satu kandidat "A" berid project Q3, children = [t1', t3] (t2 hilang karena DONE).
- work: target sudah punya "A" berisi task judul t3 → kandidat `alreadyExists: true`, child t3 `alreadyExists: true`, t1' false.
- work: target punya "A" dengan semua task → kandidat tidak muncul.
- urutan grup: Q3 2026 sebelum Q2 2026 sebelum Q4 2025.

## Task 3 — Queries

`queries.ts`:
- Tambahkan `created_at` ke `COLS`.
- Tambahkan:

```ts
export async function queryTopTasksBefore(
  supabase: SupabaseClient, userId: string, type: CarryOverType, beforeIso: string
): Promise<SourceTask[]> {
  const { data, error } = await supabase
    .from('tasks').select(COLS)
    .eq('user_id', userId).eq('type', type).is('parent_task_id', null)
    .lt('created_at', beforeIso)
    .order('created_at', { ascending: true })
    .limit(1000); // ponytail: batas PostgREST; quest per user masih ratusan, paginasi kalau lewat
  if (error) throw error;
  return data ?? [];
}
```

- `queryChildren` sudah ada, tetap dipakai. Anak project tidak berfilter tanggal, dan itu benar karena task ikut project-nya.

## Task 4 — Actions (TDD)

`actions.ts`:

```ts
export async function getCarryOverGroups(type: CarryOverType, year: number, quarter: number): Promise<CarryOverGroup[]> {
  const { supabase, userId } = await requireUser();
  const [startIso, endIso] = rangeIso(year, quarter);
  const source = await queryTopTasksBefore(supabase, userId, type, startIso);
  const target = await queryTopTasksInRange(supabase, userId, type, startIso, endIso);
  const isWork = type === 'WORK_QUEST';
  const sourceChildren = isWork ? await queryChildren(supabase, userId, source.map(s => s.id)) : [];
  const targetChildren = isWork ? await queryChildren(supabase, userId, target.map(t => t.id)) : [];
  return buildGroups(type, source, sourceChildren, target, targetChildren, iso => quarterOfDate(new Date(iso)));
}
```

Hapus `getCarryOverCandidates` (tidak dipakai lagi setelah Task 5). `getPrevQuarter` tidak dipakai lagi di file ini.

**Daily/Side:** `carryOverQuests(type, ids, year, quarter)` tetap, tanpa perubahan.

**Work:** fungsi baru, menggantikan cabang work di `carryOverQuests` (hapus cabang itu; `carryOverQuests` untuk `WORK_QUEST` → `throw new Error('Use carryOverWorkQuests')`):

```ts
export interface WorkSelection { projectId: string; taskIds: string[]; }

export async function carryOverWorkQuests(selections: WorkSelection[], year: number, quarter: number): Promise<number> {
  if (selections.length === 0) return 0;
  const { supabase, userId } = await requireUser();
  const createdAt = createdAtForQuarter(year, quarter);
  const [startIso, endIso] = rangeIso(year, quarter);

  const projects = await queryTasksByIds(supabase, userId, 'WORK_QUEST', selections.map(s => s.projectId));
  const tasks = await queryTasksByIds(supabase, userId, 'WORK_QUEST', selections.flatMap(s => s.taskIds));
  const parents = await queryTasksByIds(supabase, userId, 'WORK_QUEST', [...new Set(tasks.map(t => t.parent_task_id!).filter(Boolean))]);
  const target = await queryTopTasksInRange(supabase, userId, 'WORK_QUEST', startIso, endIso);
  const norm = (s: string) => s.trim().toLowerCase();

  let copied = 0;
  for (const sel of selections) {
    const project = projects.find(p => p.id === sel.projectId && !p.parent_task_id);
    if (!project) continue;
    // Keamanan: task hanya sah kalau induknya project dengan judul sama (D4) milik user ini.
    const validTasks = tasks.filter(t =>
      sel.taskIds.includes(t.id) &&
      parents.some(p => p.id === t.parent_task_id && norm(p.title) === norm(project.title))
    );
    const existing = target.find(t => norm(t.title) === norm(project.title));
    const targetId = existing
      ? existing.id
      : (await insertTasks(supabase, [buildCopyRow('WORK_QUEST', project, userId, createdAt)]))[0].id;
    await insertTasks(supabase, validTasks.map(t => buildCopyRow('WORK_QUEST', t, userId, createdAt, targetId)));
    copied += existing ? 0 : 1;
    copied += validTasks.length;
  }
  revalidatePath('/quests/work-quests');
  return copied;
}
```

> `insertTasks` sudah no-op untuk array kosong.
> Server tidak mengecek ulang "task sudah ada di target". UI sudah men-disable-nya, dan kalaupun lolos akibatnya cuma task kembar yang bisa dihapus, bukan data rusak.

Test `__tests__/actions.test.ts`:
- Ganti test `getCarryOverCandidates` → `getCarryOverGroups` (auth null → throw; sukses → array).
- Hapus test "copies work quests with their open children"; tambah untuk `carryOverWorkQuests`:
  - `[]` → 0 tanpa `createClient`.
  - target belum punya project → `insert` dipanggil 2x (project, lalu task dengan `parent_task_id` = id project baru).
  - target sudah punya project judul sama → `insert` hanya 1x (task), `parent_task_id` = id project target.
  - task yang induknya project berjudul lain diabaikan.

Pola mock ikuti file itu (`makeQueryBuilder`/`makeSupabase`). Untuk respons berurutan, cek dulu apakah `src/test-utils/supabase-mock.ts` mendukung `mockResolvedValueOnce` di builder; kalau tidak, mock `./queries` langsung dengan `vi.mock('../queries')`. Cara ini lebih sederhana untuk alur multi-query.

## Task 5 — Modal

`CarryOverModal.tsx`:
- Fetch: `getCarryOverGroups(type, year, quarter)`. Key SWR `['carry-over', type, year, quarter]`.
- Judul: `"Ambil dari quarter sebelumnya"`. Hapus pemakaian `getPrevQuarter`.
- Render per grup: sub-judul kecil `Q{quarter} {year}` (uppercase, abu, `text-xs font-semibold`), lalu kandidatnya.
- **Daily/Side:** baris sama seperti sekarang (checkbox di `onChange`, badge "sudah ada", disabled).
- **Work:** baris project (checkbox + judul + badge "sudah ada — tambah task" kalau `alreadyExists`). Di bawahnya daftar task menjorok (`pl-8`), masing-masing checkbox + judul, disabled + badge "sudah ada" kalau `alreadyExists`. Kalau project punya lebih dari 5 task, tampilkan tombol teks "Tampilkan N task" / "Sembunyikan" (default terbuka kalau ≤5).
- State work: `selectedProjects: Set<string>`, `selectedTasks: Set<string>`.
  - Centang project → tambahkan project + semua child yang `!alreadyExists`. Uncheck project → buang project + semua child-nya.
  - Centang task → tambahkan task + project induknya. Uncheck task → buang task saja.
  - Project dengan `alreadyExists` yang dicentang tanpa task = no-op. Tombol Bawa dihitung dari jumlah task + project baru (`!alreadyExists`).
- Tombol "Pilih semua / Kosongkan" tetap, berlaku untuk semua grup.
- Simpan:
  - Daily/Side → `carryOverQuests(type, [...selected], year, quarter)` (sama).
  - Work → `carryOverWorkQuests([...selectedProjects].map(id => ({ projectId: id, taskIds: children(id).filter(c => selectedTasks.has(c.id)).map(c => c.id) })), year, quarter)`.
  - Toast: `"${n} item dibawa ke quarter ini"`.
- Checkbox: toggle lewat `onChange` di `<input>`, **jangan** `onClick` di `<label>`. Bug ini diperbaiki saat review app-uq5a (klik judul jadi toggle dua kali).
- Setelah sukses: `mutate()` SWR modal, lalu `onDone()`, lalu `onClose()` (sama seperti sekarang).

Batas ukuran file: kalau `CarryOverModal.tsx` lewat ~250 baris, pisahkan baris work ke `components/CarryOverWorkItem.tsx` (props: candidate, selectedProjects, selectedTasks, onToggleProject, onToggleTask).

## Task 6 — Verifikasi

1. `npx vitest run "src/app/(admin)/quests" src/lib` → PASS.
2. `npm run type-check` → 0 error.
3. Manual di port 5100 (Dashboard → selector Q4 2026 dulu):
   - Side Quests → modal: grup "Q3 2026", di bawahnya grup lama kalau ada side quest belum selesai dari Q2/Q1. Tidak ada judul yang muncul dua kali.
   - Work Quests → modal: project Q3 dengan daftar task. Centang 1 task saja → Bawa → project muncul di Q4 berisi 1 task itu.
   - Buka lagi → project bertanda "sudah ada — tambah task", task tadi "sudah ada". Centang 1 task lain → Bawa → task masuk project Q4 yang sama, **tidak** ada project kembar.
4. DB (MCP `better-planner`, `user_id = '59076bab-b21c-49ce-a7d1-7b9d69a6001c'`): hanya satu project baru di Q4, task anaknya menunjuk ke project itu. Hapus data uji setelahnya.

## Commit

```
feat(quests): carry-over dari semua quarter + pilih task work quest (app-7z06)

fixes #18

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Update paragraf Carry-Over di `docs/claude/business-rules.md`: sumber = semua quarter sebelum target, dedup per judul (terbaru), work bisa per task dan menambah ke project target yang judulnya sama.
- [ ] Tabel/route/permission baru? Tidak.
- [ ] Update `docs/products/roadmap.md` saat close.
