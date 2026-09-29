# app-01z6 — Tanda energi (+ / = / −) di One Minute Journal

## Masalah

Abu ingin tahu apakah pindah-pindah banyak proyek dalam satu hari menguras energi
(dari laporan energi Superfocus dan minggu "feel-good" Ali Abdaal). Data itu belum
ada: modal One Minute Journal (pop-up setelah sesi fokus) hanya menyimpan `what_done`
dan `what_think` ke `activity_logs`.

## Keputusan

- **Kolom:** `activity_logs.energy smallint NULL CHECK (energy IN (-1,0,1))`.
  Angka, bukan teks enum, karena bisa langsung dijumlah/dirata-rata per minggu.
  `NULL` = tidak dijawab (berbeda dari `0` = "=" netral) — pilihan bersifat opsional.
- **Pilihan di modal:** tiga tombol toggle `+` (nambah energi), `=` (biasa), `−` (terkuras).
  Klik ulang tombol yang aktif = batal pilih. Tombol Simpan tetap hanya butuh `what_done`.
- **Permukaan mingguan terkecil:** satu kartu "Energi minggu ini" di Dashboard, di bawah
  `WeeklyProgressChartWrapper`. Alasan: Dashboard sudah jadi tempat ringkasan mingguan,
  sedangkan Daily Sync/ActivityLog hanya per hari. Kartu ini hanya minggu berjalan
  (Senin–Minggu), tanpa navigasi minggu. Tampilan per log (badge di ActivityLog dan
  `CalendarTaskDetail`) ikut ditambah karena murah.
- **Migrasi dijalankan Abu, bukan executor.** Repo menyimpan migrasi sebagai file di
  `supabase/migrations/` (format `YYYYMMDDNNNNNN_nama.sql`), dan executor tidak boleh
  menyentuh DB produksi. **Abu menjalankan migrasi SEBELUM menjalankan/deploy kode ini**;
  kalau tidak, insert `energy` akan gagal dan jurnal tidak tersimpan.
- Di luar lingkup: navigasi minggu, korelasi otomatis dengan jumlah proyek per hari
  (bisa jadi issue lanjutan setelah data terkumpul 2–3 minggu).

## Peta kode (sudah diverifikasi)

| Peran | File |
|---|---|
| Modal | `src/app/(admin)/execution/daily-sync/Journal/OneMinuteJournalModal.tsx` (props 9-17, state 28-53, `handleSave` 76-128, pertanyaan 2 di 182-197) |
| Pemasangan modal | `src/app/(admin)/execution/daily-sync/page.tsx:184-195` |
| Props type duplikat | `.../Journal/types.ts:3-11` |
| Hook simpan | `.../Journal/hooks/useJournal.ts` (`saveJournal` 65-215; dua `insert` di ~121-133 dan ~186-198) |
| Server action update | `.../Journal/actions/journal/actions.ts:23-43` (`updateActivityJournal`) |
| Query update | `.../Journal/actions/journal/queries.ts:19-34` (`updateActivityLogJournal`) |
| Optimistic log | `.../ActivityLog/hooks/useActivityLogs.ts:19,56-72` (`updateLogJournal`) |
| Tampilan log | `.../ActivityLog/ActivityLog.tsx:34-64` (`JournalEntry`) |
| Detail kalender | `.../ActivityLog/components/CalendarTaskDetail.tsx:97-104` |
| Tipe | `src/types/journal.ts`, `src/types/activity-log.ts` |
| Dashboard | `src/app/(admin)/dashboard/page.tsx:28-30` |

Tidak ada tipe DB yang digenerate; `activity_logs` hanya diketik lewat `ActivityLogItem`
dan `JournalData`. Catatan: skema DB tidak bisa dibaca saat plan ini ditulis (token MCP
tidak valid) — asumsi `activity_logs` belum punya kolom `energy`. Migrasi memakai
`ADD COLUMN IF NOT EXISTS` supaya aman kalau ternyata ada.

---

## Task 0 — Migrasi (Abu yang menjalankan)

**File baru:** `supabase/migrations/20260929000001_activity_logs_energy.sql`

```sql
-- app-01z6: tanda energi setelah sesi fokus. -1 terkuras, 0 biasa, 1 nambah energi. NULL = tidak dijawab.
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS energy smallint
  CHECK (energy IN (-1, 0, 1));

COMMENT ON COLUMN activity_logs.energy IS
  'Tanda energi dari One Minute Journal: 1 nambah, 0 biasa, -1 terkuras. NULL = tidak dijawab (bukan sama dengan 0).';
```

RLS tidak perlu diubah (policy `activity_logs` berlaku per baris). Executor cukup membuat
file; **jangan menjalankan ke DB**. Abu menjalankan lewat Supabase SQL editor / CLI.

## Task 1 — Helper energi + ringkasan (TDD)

**File test baru:** `src/lib/__tests__/energy.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { summarizeEnergy, energyLabel } from '@/lib/energy';

describe('summarizeEnergy', () => {
  it('menghitung + = − dan mengabaikan null/undefined', () => {
    const rows = [{ energy: 1 }, { energy: 1 }, { energy: 0 }, { energy: -1 }, { energy: null }, {}];
    expect(summarizeEnergy(rows)).toEqual({ plus: 2, neutral: 1, minus: 1, total: 4 });
  });

  it('list kosong -> semua nol', () => {
    expect(summarizeEnergy([])).toEqual({ plus: 0, neutral: 0, minus: 0, total: 0 });
  });
});

describe('energyLabel', () => {
  it('memetakan nilai ke simbol', () => {
    expect(energyLabel(1)).toBe('+');
    expect(energyLabel(0)).toBe('=');
    expect(energyLabel(-1)).toBe('−');
    expect(energyLabel(null)).toBeNull();
  });
});
```

Jalankan `npx vitest run src/lib/__tests__/energy.test.ts` → **FAIL** (modul belum ada).

**File baru:** `src/lib/energy.ts`

```ts
export type Energy = -1 | 0 | 1;

export const ENERGY_OPTIONS: { value: Energy; symbol: string; hint: string }[] = [
  { value: 1, symbol: '+', hint: 'Nambah energi' },
  { value: 0, symbol: '=', hint: 'Biasa saja' },
  { value: -1, symbol: '−', hint: 'Terkuras' },
];

export function energyLabel(energy: Energy | null | undefined): string | null {
  return ENERGY_OPTIONS.find((o) => o.value === energy)?.symbol ?? null;
}

export function summarizeEnergy(rows: { energy?: number | null }[]) {
  const s = { plus: 0, neutral: 0, minus: 0, total: 0 };
  for (const { energy } of rows) {
    if (energy === 1) s.plus++;
    else if (energy === 0) s.neutral++;
    else if (energy === -1) s.minus++;
    else continue;
    s.total++;
  }
  return s;
}
```

Jalankan ulang → **PASS**.

## Task 2 — Tipe

- `src/types/journal.ts`: di `JournalData` tambah `energy?: Energy | null;` (import `type { Energy } from '@/lib/energy'`).
- `src/types/activity-log.ts`: di `ActivityLogItem` tambah `energy?: number | null` setelah `what_think`.
- `.../Journal/types.ts`: ubah `onSave` jadi `(whatDone: string, whatThink: string, energy: Energy | null) => Promise<void>`.

## Task 3 — Query + server action (TDD)

**Test dulu** — tambahkan ke `.../Journal/actions/journal/__tests__/queries.test.ts`, di `describe('updateActivityLogJournal')`:

```ts
  it('menyertakan energy hanya kalau diberikan', async () => {
    const builder = makeQueryBuilder({ data: { id: 'log-1' }, error: null });
    const supabase = makeSupabaseFrom(builder);
    await updateActivityLogJournal(supabase, 'user-1', 'log-1', 'done', null, 1);
    expect(builder.update).toHaveBeenCalledWith({ what_done: 'done', what_think: null, energy: 1 });
  });
```

Test lama (`update` dipanggil dengan `{ what_done, what_think }` saja) **harus tetap lulus** —
itu sebabnya energy bersifat kondisional. Jalankan `npx vitest run "src/app/(admin)/execution/daily-sync/Journal"` → test baru **FAIL**.

**`queries.ts`** — ubah `updateActivityLogJournal` (baris 19-34): tambah parameter `energy?: number | null` di akhir dan
`.update({ what_done: whatDone, what_think: whatThink, ...(energy !== undefined && { energy }) })`.

**`actions.ts`** — ubah `updateActivityJournal` (baris 23-43): tambah parameter `energy?: number | null`, teruskan sebagai argumen terakhir ke `updateActivityLogJournal`.

Jalankan ulang → **PASS**.

## Task 4 — Modal

**`OneMinuteJournalModal.tsx`**
1. Props `onSave` → `(whatDone: string, whatThink: string, energy: Energy | null) => Promise<void>`. Import `ENERGY_OPTIONS`, `type Energy` dari `@/lib/energy`.
2. State + ref (pola sama dengan `whatDoneRef`, karena `handleSave` memakai deps kosong):

```tsx
const [energy, setEnergy] = useState<Energy | null>(null);
const energyRef = useRef<Energy | null>(null);
useEffect(() => { energyRef.current = energy; }, [energy]);
```
   Di reset saat modal buka (baris 47-53) tambah `setEnergy(null);`.
3. `handleSave` (baris 88): `await onSave(currentWhatDone.trim(), currentWhatThink.trim(), energyRef.current);`
4. Setelah blok Question 2 (setelah baris 197, di dalam `space-y-6`):

```tsx
{/* Question 3 (opsional) */}
<div>
  <label className="block text-lg font-semibold text-gray-900 mb-3">
    3. Bagaimana energi saya setelah sesi ini? <span className="text-sm font-normal text-gray-500">(opsional)</span>
  </label>
  <div className="flex gap-3">
    {ENERGY_OPTIONS.map((o) => (
      <button
        key={o.value}
        type="button"
        data-testid={`journal-energy-${o.value}`}
        aria-pressed={energy === o.value}
        title={o.hint}
        disabled={isSaving}
        onClick={() => setEnergy(energy === o.value ? null : o.value)}
        className={`w-14 h-12 rounded-md border text-xl font-semibold transition-colors ${
          energy === o.value
            ? 'bg-brand-500 border-brand-500 text-white'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {o.symbol}
      </button>
    ))}
  </div>
</div>
```

## Task 5 — Alur simpan

**`page.tsx:186-189`**:

```tsx
onSave={async (whatDone, whatThink, energy) => {
  await saveJournal({ whatDone, whatThink, energy });
}}
```

**`Journal/hooks/useJournal.ts`** — destructure `const { whatDone, whatThink, energy } = journalData;` (baris ~65), lalu:
- `updateLogJournal(pendingActivityData.activityId, whatDone, whatThink, energy)` (baris ~80).
- Semua panggilan `updateActivityJournal(id, whatDone, whatThink)` (4 tempat: jalur activityId, `recentActivity`, retry activityId, `existingOnRetry`) → tambah argumen `energy`.
- Kedua `.insert({...})` ke `activity_logs` (baris ~121-133 dan ~186-198): tambah `energy: energy ?? null,` setelah `what_think`.
- `updateJournalData({ whatDone, whatThink })` tidak diubah (`energy` opsional).

**`ActivityLog/hooks/useActivityLogs.ts`** — `updateLogJournal` (tipe baris 19 dan implementasi 56-72): tambah parameter `energy?: Energy | null`; di map: `{ ...log, what_done: whatDone, what_think: whatThink, ...(energy !== undefined && { energy }) }`.

Tidak perlu mengubah `queryActivityLogs` (`select('*')` sudah membawa kolom baru) dan pemetaan di `getTodayActivityLogs`:
**executor wajib cek** pemetaan log→`ActivityLogItem` di `.../ActivityLog/actions/activity-logging/` (grep `what_think`) dan pastikan `energy` ikut kalau ada pemetaan eksplisit field per field (spread `...log` sudah cukup).

## Task 6 — Tampilan per log

- `ActivityLog.tsx` `JournalEntry` (34-64): setelah blok "Yang masih dipikirkan" tambah, di dalam `<div>` yang sama:

```tsx
{energyLabel(log.energy as Energy | null) && (
  <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
    Energi: <span className="font-semibold">{energyLabel(log.energy as Energy | null)}</span>
  </div>
)}
```
  (import `energyLabel`, `type Energy` dari `@/lib/energy`).
- `CalendarTaskDetail.tsx`: sebelum `</div>` penutup di baris 105 tambah blok berpola sama dengan 97-104, judul `Energi:` dan isi `{energyLabel(item.energy as Energy | null) ?? '-'}`.

## Task 7 — Kartu mingguan di Dashboard (TDD untuk query)

Folder mengikuti pola `dashboard/actions/weekly-progress/`.

**Test dulu:** `src/app/(admin)/dashboard/actions/weekly-energy/__tests__/queries.test.ts` (pola `makeQueryBuilder` seperti test Journal). Kasus: `queryEnergyRows(supabase, 'user-1', '2026-09-28', '2026-10-04')` memanggil `from('activity_logs')`, `select('energy')`, `eq('user_id','user-1')`, `gte('local_date','2026-09-28')`, `lte('local_date','2026-10-04')`; mengembalikan `data ?? []`; melempar saat error. **Cek dulu** `src/test-utils/supabase-mock.ts` — kalau `makeQueryBuilder` belum punya `gte`/`lte`, tambahkan di sana (satu baris tiap method, chainable). Jalankan → **FAIL**.

**`.../weekly-energy/queries.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryEnergyRows(supabase: SupabaseClient, userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('energy')
    .eq('user_id', userId)
    .gte('local_date', startDate)
    .lte('local_date', endDate);
  if (error) throw error;
  return data ?? [];
}
```

**`.../weekly-energy/actions.ts`**

```ts
"use server";
import { createClient } from '@/lib/supabase/server';
import { getWeekDates, getLocalDateString } from '@/lib/dateUtils';
import { summarizeEnergy } from '@/lib/energy';
import { queryEnergyRows } from './queries';

export async function getWeeklyEnergySummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plus: 0, neutral: 0, minus: 0, total: 0 };
  const week = getWeekDates(new Date());
  const rows = await queryEnergyRows(supabase, user.id, getLocalDateString(week[0]), getLocalDateString(week[6]));
  return summarizeEnergy(rows);
}
```

**`dashboard/hooks/useWeeklyEnergy.ts`** — `useSWR(['dashboard','weekly-energy'], getWeeklyEnergySummary, { revalidateOnFocus: false })` (salin gaya `useWeeklyProgress.ts`).

**`dashboard/components/WeeklyEnergyCard.tsx`** — client component: kartu `bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800 p-5`, judul `Energi minggu ini`, tiga angka besar `+ n`, `= n`, `− n`, catatan kecil `dari {total} sesi yang diberi tanda`. `data-testid="weekly-energy-card"`. Total 0 → teks `Belum ada tanda energi minggu ini`. Cek `src/components/ui/skeleton/` untuk state loading; tanpa skeleton pun boleh render `-`.

**`dashboard/page.tsx`** setelah blok `WeeklyProgressChartWrapper` (baris 28-30) tambah `<div className="col-span-12"><WeeklyEnergyCard /></div>`.

## Task 8 — Verifikasi

1. `npm run test:run` → semua PASS (termasuk test lama Journal `updateActivityLogJournal`).
2. `npm run type-check` → 0 error.
3. Manual (setelah Abu menjalankan migrasi; `npm run dev`, port 5100): Daily Sync → selesaikan sesi fokus → modal menampilkan pertanyaan 3 → pilih `+` → Simpan → buka log di ActivityLog/Calendar: tampil `Energi: +`. Simpan lagi tanpa memilih → `Energi` tidak tampil, tidak error. Dashboard → kartu `Energi minggu ini` menghitung sesuai.
4. Cek DB (SELECT saja): `select energy, count(*) from activity_logs group by 1;` → nilai hanya -1/0/1/NULL.

## Commit

```
feat(journal): tanda energi + / = − di One Minute Journal (app-01z6)

fixes #22

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

(Migrasi ikut di commit yang sama; Abu menjalankannya di DB sebelum deploy.)

## CLAUDE.md Check
- [ ] Pattern baru: kolom `activity_logs.energy` (smallint -1/0/1, NULL = tidak dijawab) — catat di `docs/claude/database-operations.md`.
- [ ] Tabel baru? Tidak (kolom baru + file migrasi baru).
- [ ] Route baru? Tidak (kartu di `/dashboard`).
- [ ] Permission pattern baru? Tidak.
- [ ] Komponen UI baru dipakai 1 tempat (`WeeklyEnergyCard`) — tetap lokal di `dashboard/components/`, bukan shared.
- [ ] Timezone: filter minggu memakai `local_date` (WIB), bukan timestamp UTC.
- [ ] Executor tidak menjalankan migrasi ke DB, tidak git commit/push.

## Verifikasi skema DB (29 Sep 2026, via MCP)
- `activity_logs.local_date` = `date`, terisi di semua 281 log 30 hari terakhir.
- Enum `activity_log_type` = `FOCUS,BREAK`; `quest_status` = `TODO,IN_PROGRESS,DONE`.
- `activity_logs.energy` dan `quests.weekly_target_hours` belum ada; migrasi baru aman.
- `daily_plan_items`: `item_id,item_type,daily_plan_id`; 4 quest committed memuat "Urut antrean".
