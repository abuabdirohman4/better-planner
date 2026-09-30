# app-taj8 — Side Quest (dan quest lain) yang dibuat di hari terakhir kuartal hilang

## Masalah

Quest tidak punya kolom quarter; ia masuk quarter lewat `tasks.created_at` yang jatuh di rentang
`getQuarterDates(year, quarter)` (`src/lib/quarterUtils.ts:135-148`). Fungsi itu mengembalikan
`endDate = startDate + 90 hari` pada **00:00** hari Minggu minggu ke-13. Semua query memakai
`.lte('created_at', endDate)`, jadi apa pun yang dibuat Minggu (00:00 sampai 23:59) jatuh di luar
kuartal ini, sedangkan kuartal berikutnya baru mulai Senin 00:00. Hasilnya: hilang dari kedua kuartal.

Kasus nyata 27 Sep 2026: Side Quest dibuat 19:44 WIB (= 12:44 UTC), tidak tampil di Q3.
Q3 2026: mulai Senin 29 Jun, `endDate` = Minggu 27 Sep 00:00.

## Keputusan desain (baca sebelum coding)

1. **JANGAN ubah semantik `endDate`.** Ia dipakai sebagai *tanggal tampilan* (Minggu, hari terakhir):
   - `useBrainDumpQuarter.ts:29` → `getLocalDateString(endDate)` (zona Asia/Jakarta). Kalau `endDate`
     jadi 23:59:59 di server UTC, tanggalnya melompat ke Senin WIB — salah.
   - `quarterly-review/actions.ts:42-43` → `endDate.toISOString().split('T')[0]` untuk kolom tanggal.
2. **Tambah field baru `endExclusive`** di hasil `getQuarterDates` = `startDate + 91 hari` (Senin 00:00
   kuartal berikutnya, persis `startDate` kuartal berikutnya). Query `created_at` memakai
   `.lt('created_at', endExclusive)`.
3. **Kenapa batas eksklusif, bukan "end of day"?**
   - Tidak ada gap/overlap: batas atas Q(n) = batas bawah Q(n+1), bit-per-bit sama.
   - Tidak perlu `23:59:59.999` (rawan pembulatan ke `.999999` di Postgres timestamptz).
   - Timezone: `startDate` dibangun dari `new Date(year,0,1)` + `setDate` = tengah malam **zona
     runtime**. Di browser WIB itu 00:00 WIB (= 17:00Z hari sebelumnya); di server Vercel (UTC) itu
     00:00Z (= 07:00 WIB). `endExclusive` dibangun dengan cara yang sama dari `startDate`, jadi
     selalu konsisten dengan batas bawah di runtime yang sama, dan **tidak ada** hari Minggu yang
     terpotong di zona mana pun. Kasus 27 Sep 19:44 WIB: `2026-09-27T12:44Z` < 28 Sep 00:00Z (server)
     dan < 27 Sep 17:00Z (browser WIB). Lolos di keduanya.
   - Di luar scope: selisih 7 jam batas client (WIB) vs server (UTC) — quest dibuat Senin 00:00-07:00
     WIB bisa dianggap kuartal lama oleh server tapi kuartal baru oleh browser. Sudah ada sebelum
     issue ini; jangan diperbaiki di sini (lihat Pertanyaan Terbuka).
4. **Overlap dengan `app-yv8t`** (default quarter di `quarterStore`) — kemungkinan menyentuh
   `quarterUtils.ts` juga. Perubahan di sini hanya menambah field di `getQuarterDates` dan mengubah
   satu kondisi di `createdAtForQuarter`; tidak menyentuh `parseQParam`/`getWeekOfYear`. Kalau
   konflik merge, gabungkan manual, keduanya independen.

## Daftar caller (hasil grep `getQuarterDates` di `src`)

| # | File:baris | Pemakaian endDate | Tindakan |
|---|---|---|---|
| 1 | `src/app/(admin)/quests/side-quests/actions/side-quest/actions.ts:26` → `queries.ts:15` | `.lte created_at` | ganti ke `.lt` + `endExclusive` |
| 2 | `src/app/(admin)/quests/work-quests/actions/projects/actions.ts:40` → `queries.ts:30` | `.lte created_at` | sama |
| 3 | `src/app/(admin)/quests/actions/carry-over/actions.ts:34-35` → `queries.ts:40` | `.lte created_at` (via `rangeIso`) | sama |
| 4 | `src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-quest/actions.ts:70-76` → `queries.ts:140` | `.lte created_at` | sama |
| 5 | `src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useDailyPlanManagement.ts:215,224` | `.lte created_at` (query langsung di hook) | sama |
| 6 | `src/lib/quarterUtils.ts` `createdAtForQuarter` (`now <= endDate`) | perbandingan waktu | ganti ke `now < endExclusive` |
| 7 | `src/app/(admin)/execution/brain-dump/hooks/useBrainDumpQuarter.ts:27-29` | string tanggal `YYYY-MM-DD` | **JANGAN diubah** |
| 8 | `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/actions.ts:39-43` | string tanggal `YYYY-MM-DD` | **JANGAN diubah** |
| 9 | `getQuarterInfo` di `quarterUtils.ts` (tidak ada pemakai luar) | tampilan | biarkan |

---

## Task 1 — `getQuarterDates` + `createdAtForQuarter` (TDD)

**File test:** tambahkan di `src/lib/__tests__/quarterUtils.createdAt.test.ts`.

Import di file itu sudah cukup (tidak perlu diubah). Tambahkan di akhir file:

```ts
describe('getQuarterDates.endExclusive', () => {
  it('endExclusive Q3 = startDate Q4 (tanpa gap dan overlap)', () => {
    expect(getQuarterDates(2026, 3).endExclusive.getTime()).toBe(getQuarterDates(2026, 4).startDate.getTime());
  });

  it('endExclusive Q4 = endDate + 1 hari', () => {
    const { endDate, endExclusive } = getQuarterDates(2026, 4);
    expect(endExclusive.getTime() - endDate.getTime()).toBe(86400000);
  });

  it('endDate tetap Minggu 00:00 (tidak berubah, dipakai untuk tampilan)', () => {
    const { startDate, endDate } = getQuarterDates(2026, 3);
    expect(Math.round((endDate.getTime() - startDate.getTime()) / 86400000)).toBe(90);
  });

  it('Side Quest 27 Sep 2026 19:44 WIB masuk Q3, bukan Q4 (regresi app-taj8)', () => {
    const created = new Date('2026-09-27T19:44:00+07:00');
    const q3 = getQuarterDates(2026, 3);
    const q4 = getQuarterDates(2026, 4);
    expect(created >= q3.startDate && created < q3.endExclusive).toBe(true);
    expect(created >= q4.startDate).toBe(false);
  });
});

describe('createdAtForQuarter di hari terakhir kuartal', () => {
  it('memakai waktu sekarang kalau sekarang Minggu sore hari terakhir quarter itu', () => {
    const now = new Date('2026-09-27T19:44:00+07:00');
    expect(createdAtForQuarter(2026, 3, now)).toBe(now.toISOString());
  });
});
```

Jalankan: `npx vitest run src/lib/__tests__/quarterUtils.createdAt.test.ts`
Ekspektasi: **FAIL** (`endExclusive` undefined → `.getTime()` TypeError; test createdAtForQuarter juga
FAIL karena 27 Sep 19:44 > endDate).

**Implementasi** — `src/lib/quarterUtils.ts`, fungsi `getQuarterDates` (sekitar baris 135-150).

Ganti signature return dan body akhir:

```ts
export const getQuarterDates = (year: number, quarter: number): { startDate: Date; endDate: Date; endExclusive: Date } => {
  const planningYearStartDate = getPlanningYearStartDate(year);

  // Hitung tanggal mulai kuartal yang diminta.
  // Setiap kuartal adalah 13 minggu * 7 hari = 91 hari.
  const daysToAdd = (quarter - 1) * 91;
  const quarterStartDate = new Date(planningYearStartDate);
  quarterStartDate.setDate(planningYearStartDate.getDate() + daysToAdd);

  // Hari Minggu terakhir (00:00), untuk tampilan/tanggal. JANGAN dipakai sebagai batas query created_at.
  const quarterEndDate = new Date(quarterStartDate);
  quarterEndDate.setDate(quarterStartDate.getDate() + 90);

  // Batas atas eksklusif untuk query created_at (`.lt`): Senin 00:00 kuartal berikutnya, agar seluruh hari Minggu terakhir ikut.
  const quarterEndExclusive = new Date(quarterStartDate);
  quarterEndExclusive.setDate(quarterStartDate.getDate() + 91);

  return { startDate: quarterStartDate, endDate: quarterEndDate, endExclusive: quarterEndExclusive };
};
```

Ganti `createdAtForQuarter`:

```ts
export function createdAtForQuarter(year: number, quarter: number, now: Date = new Date()): string {
  const { startDate, endExclusive } = getQuarterDates(year, quarter);
  if (now >= startDate && now < endExclusive) return now.toISOString();
  return startDate.toISOString();
}
```

Jalankan ulang → **PASS** (semua test di file itu, termasuk 6 test lama).

## Task 2 — Lima titik query pakai `.lt` + `endExclusive` (TDD ringan)

Semua perubahan mekanis. Test yang sudah ada memakai mock `getQuarterDates`; mock itu harus diberi
field `endExclusive` supaya kode baru tidak membaca `undefined.toISOString()`.

### 2a. Update mock di 4 file test (RED dulu)

Tambahkan `endExclusive` ke mock `getQuarterDates` (nilai bebas asal Date valid):

1. `src/app/(admin)/quests/side-quests/actions/side-quest/__tests__/actions.test.ts:8-11`
   → tambah `endExclusive: new Date('2026-04-01'),` setelah `endDate`.
2. `src/app/(admin)/quests/work-quests/actions/projects/__tests__/actions.test.ts:7-10` → sama.
3. `src/app/(admin)/quests/actions/carry-over/__tests__/actions.test.ts:8-11`
   → tambah `endExclusive: new Date(Date.UTC(year, quarter * 3, 1)),` setelah `endDate`.
4. `src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-quest/__tests__/actions.test.ts:161-172`
   → tambah `const endExclusive = new Date('2026-04-01T00:00:00Z');`, ubah mock jadi
   `mockReturnValue({ startDate, endDate, endExclusive } as any)`, dan pada `toHaveBeenCalledWith`
   ganti argumen terakhir `endDate.toISOString()` → `endExclusive.toISOString()`.

Jalankan `npm run test:run` → ekspektasi: **hanya test daily-quest FAIL** (argumen ke-4 berbeda).
Test lain masih PASS karena kodenya belum berubah.

### 2b. Ubah kode

**`src/app/(admin)/quests/side-quests/actions/side-quest/actions.ts:26-27`**
```ts
    const { startDate, endExclusive } = getQuarterDates(year, quarter);
    return querySideQuests(supabase, user.id, startDate, endExclusive);
```
**`.../side-quest/queries.ts`** — parameter `endDate: Date` → `endExclusive: Date` (baris 6) dan baris 15:
```ts
    .lt('created_at', endExclusive.toISOString())
```

**`src/app/(admin)/quests/work-quests/actions/projects/actions.ts:40,43`**
```ts
    const { startDate, endExclusive } = getQuarterDates(year, quarter);
    const projectRows = await queryProjectsByQuarter(supabase, user.id, startDate, endExclusive);
```
**`.../projects/queries.ts:17-31`** — parameter `endDate: Date` → `endExclusive: Date`, baris 30 → `.lt('created_at', endExclusive.toISOString())`.

**`src/app/(admin)/quests/actions/carry-over/actions.ts:33-36`** (`rangeIso`)
```ts
function rangeIso(year: number, quarter: number) {
  const { startDate, endExclusive } = getQuarterDates(year, quarter);
  return [startDate.toISOString(), endExclusive.toISOString()] as const;
}
```
**`.../carry-over/queries.ts:26-42`** (`queryTopTasksInRange`) — parameter `endIso` → `endExclusiveIso`, baris 40 → `.lt('created_at', endExclusiveIso)`.

**`src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-quest/actions.ts:70-77`**
```ts
  const { startDate, endExclusive } = getQuarterDates(year, quarter);
  const data = await queryDailyQuests(supabase, user.id, startDate.toISOString(), endExclusive.toISOString());
```
**`.../daily-quest/queries.ts:128-141`** — parameter `endDate: string` → `endExclusive: string`, baris 140 → `.lt('created_at', endExclusive)`.

**`src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useDailyPlanManagement.ts:215,224`**
```ts
      const { startDate, endExclusive } = getQuarterDates(year, quarter);
      ...
        .lt('created_at', endExclusive.toISOString())
```

**JANGAN sentuh** `useBrainDumpQuarter.ts` dan `quarterly-review/actions.ts` (masih pakai `endDate`).

Verifikasi tidak ada sisa:
```bash
grep -rn "lte('created_at'" src
```
Ekspektasi: **tidak ada output** (RTK grep boleh menambah baris ringkasan; tidak boleh ada baris file).

Jalankan `npm run test:run` → semua **PASS**.

## Task 3 — Verifikasi

1. `npm run test:run` → PASS.
2. `npm run type-check` → 0 error (kalau ada test/mock lain yang membuat objek bertipe hasil
   `getQuarterDates` tanpa `endExclusive`, tambahkan field itu; jangan cast ke `any` sembarangan).
3. Manual (`npm run dev`, port 5100), memakai akun Abu: buka `/quests/side-quests`, pilih Q3 2026 →
   Side Quest 27 Sep 19:44 WIB tampil. Pilih Q4 2026 → tidak tampil di sana (jangan dobel).
4. Pastikan tidak ada duplikasi: quest yang dibuat Senin 28 Sep 00:00+ WIB hanya muncul di Q4.
5. Brain Dump dan Quarterly Review tetap normal (tidak diubah; cek sekilas tanggal akhir kuartal = Minggu).

## Commit

```
fix(quarter): quest di hari Minggu terakhir kuartal ikut kuartalnya (app-taj8)

getQuarterDates kini mengembalikan endExclusive (Senin 00:00 kuartal berikutnya);
query created_at memakai .lt(endExclusive) alih-alih .lte(endDate). endDate tidak berubah.

fixes #21

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Pattern baru: ya — catat di `docs/claude/business-rules.md` bagian quarter: "filter quest per quarter WAJIB `.gte(startDate).lt(endExclusive)`; `endDate` hanya untuk tampilan/tanggal (Minggu 00:00), jangan dipakai sebagai batas `created_at`".
- [ ] Tabel DB baru? Tidak.
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak.

## Pertanyaan terbuka (default yang dipilih)
- Selisih batas client (WIB) vs server (UTC) 7 jam pada Senin 00:00-07:00 WIB: **dibiarkan** (di luar
  scope; kalau mau diperbaiki, buat issue terpisah untuk membuat `getPlanningYearStartDate` eksplisit WIB).
- Nama field `endExclusive` (alternatif `nextStartDate`): dipilih `endExclusive` supaya jelas dipakai dengan `.lt`.
