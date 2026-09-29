# app-yv8t — Browser baru harus membuka quarter berjalan, bukan Q1

## Masalah

Di browser/perangkat baru (localStorage `quarter-storage` kosong), Better Planner selalu
membuka **Q1** (screenshot 29 Sep 2026: "Q1 2026" padahal sudah Q4).

## Akar masalah

`src/stores/quarterStore.ts:13-14`:

```ts
year: new Date().getFullYear(),
quarter: 1, // Default to Q1, will be initialized properly on client-side
```

Komentar bilang "diinisialisasi di client", tapi **tidak ada kode yang melakukannya**
(sudah dicek: satu-satunya yang memanggil `setQuarter` adalah `QuarterSelector.tsx` dan
beberapa komponen yang menyalin `?q=` dari URL). Jadi tanpa localStorage dan tanpa `?q=`,
nilai `quarter: 1` bertahan. `persist` (zustand) hanya menimpa default kalau localStorage
sudah berisi sesuatu, jadi pilihan manual user otomatis tetap dihormati.

`year` juga bisa salah: `getFullYear()` adalah tahun kalender, sedangkan tahun perencanaan
BePlan mulai di hari Senin pekan yang memuat 1 Januari (mis. 28 Des 2026 sudah Q1 **2027**).
Bug sama ada di `parseQParam(null)` (`src/lib/quarterUtils.ts:~66-71`, dan fallback ~80-83)
yang dipakai `isCurrentQuarter`.

## Keputusan

- **Jangan** pakai rumus bulan kalender (`Math.floor(getMonth()/3)+1`): Q4 2026 mulai
  Senin 28 Sep, jadi 28-30 Sep harus Q4 (rumus bulan bilang Q3).
- Pakai helper yang sudah ada: `quarterOfDate(date)` di `src/lib/quarterUtils.ts`
  (menghitung minggu-perencanaan + tahun-perencanaan). Tidak perlu fungsi baru.
- Default store = `quarterOfDate(new Date())` saat store dibuat. `persist` tetap menimpa
  kalau user pernah memilih.
- Tidak ada komponen/hook hidrasi baru. Catatan SSR: store dibuat di server (zona waktu
  server) dan di client; nilai yang dipakai UI datang dari client, jadi zona waktu browser
  (WIB) yang menang. Tidak ada perubahan perilaku hidrasi dibanding sekarang.
- Bug lama sudah menyimpan Q1 di localStorage setiap browser/perangkat yang pernah dibuka
  (persist menulis state awal). Jadi default baru saja tidak cukup. Diputuskan Abu:
  naikkan `version` persist dari 0 (default, belum diset) ke 1 dan beri `migrate` yang
  SEKALI mereset year/quarter ke `quarterOfDate(new Date())`. Setelah itu localStorage
  berversi 1, migrate tidak jalan lagi, dan pilihan manual dihormati.

---

## Task 1 — `parseQParam` pakai tahun perencanaan (TDD)

**File test baru:** `src/lib/__tests__/quarterUtils.current.test.ts`

```ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { parseQParam, quarterOfDate } from '@/lib/quarterUtils';

afterEach(() => vi.useRealTimers());

describe('quarter berjalan (13 minggu, bukan bulan kalender)', () => {
  it('27 Sep 2026 = Q3 2026', () => {
    expect(quarterOfDate(new Date(2026, 8, 27, 12))).toEqual({ year: 2026, quarter: 3 });
  });

  it('28 Sep 2026 (Senin) = Q4 2026', () => {
    expect(quarterOfDate(new Date(2026, 8, 28, 0, 0))).toEqual({ year: 2026, quarter: 4 });
  });

  it('parseQParam(null) mengikuti quarter berjalan', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    expect(parseQParam(null)).toEqual({ year: 2026, quarter: 4 });
  });

  it('parseQParam(null) memakai tahun perencanaan di pergantian tahun', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 30, 10)); // 28 Des 2026 sudah Q1 2027
    expect(parseQParam(null)).toEqual({ year: 2027, quarter: 1 });
  });

  it('parseQParam dengan ?q= tetap menurut parameter', () => {
    expect(parseQParam('2025-Q2')).toEqual({ year: 2025, quarter: 2 });
  });
});
```

Jalankan: `npx vitest run src/lib/__tests__/quarterUtils.current.test.ts`
Expected: **FAIL** hanya di test "tahun perencanaan di pergantian tahun"
(`year: 2026` vs `2027`). Sisanya sudah PASS (membuktikan `quarterOfDate` benar).

**Implementasi — `src/lib/quarterUtils.ts`:** di `parseQParam`, ganti DUA blok
`const now = new Date(); const week = ...; const quarter = ...; return {...}`
(yang di `if (!q)` dan di "fallback") dengan:

```ts
return quarterOfDate(new Date());
```

`quarterOfDate` dideklarasikan lebih bawah di file yang sama sebagai `function` biasa, jadi
hoisting aman. Hapus variabel `now/week/quarter` yang jadi tidak terpakai. Jangan ubah
cabang `match`.

Jalankan ulang → **PASS**.

## Task 2 — Default store = quarter berjalan (TDD)

**File test baru:** `src/stores/__tests__/quarterStore.test.ts`

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  return (await import('@/stores/quarterStore')).useQuarterStore;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe('quarterStore default', () => {
  it('browser baru pada 29 Sep 2026 membuka Q4 2026', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    const useStore = await freshStore();
    expect(useStore.getState().quarter).toBe(4);
    expect(useStore.getState().year).toBe(2026);
  });

  it('browser baru pada 27 Sep 2026 membuka Q3 2026', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27, 10));
    const useStore = await freshStore();
    expect(useStore.getState().quarter).toBe(3);
  });

  it('state lama (version 0) dengan Q1 dimigrasi ke quarter berjalan', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    localStorage.setItem('quarter-storage', JSON.stringify({ state: { year: 2026, quarter: 1 }, version: 0 }));
    const useStore = await freshStore();
    expect(useStore.getState()).toMatchObject({ year: 2026, quarter: 4 });
  });

  it('state versi baru dengan pilihan manual Q2 tetap Q2', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    localStorage.setItem('quarter-storage', JSON.stringify({ state: { year: 2025, quarter: 2 }, version: 1 }));
    const useStore = await freshStore();
    expect(useStore.getState()).toMatchObject({ year: 2025, quarter: 2 });
  });
});
```

Jalankan: `npx vitest run src/stores/__tests__/quarterStore.test.ts`
Expected: test 1, 2, dan 3 (migrasi) **FAIL** (quarter = 1), test 4 (versi baru) PASS.
Catatan: state lama selalu ditulis persist dengan `version: 0`, jadi kasus "tanpa version" tidak perlu (zustand tidak memanggil `migrate` kalau `version` bukan angka).

**Implementasi — `src/stores/quarterStore.ts`:**
- Tambah import: `import { quarterOfDate } from '@/lib/quarterUtils';`
- Di dalam `create(...)`, sebelum `persist(`, tidak perlu apa-apa. Ganti dua baris default
  (baris 13-14) menjadi:

```ts
      ...quarterOfDate(new Date()), // default = quarter berjalan (13 minggu); persist menimpa kalau user pernah memilih
```

(menghasilkan `year` dan `quarter` sekaligus; hapus dua baris lama).
- Ganti opsi persist `{ name: 'quarter-storage', }` (baris ~24-26) menjadi:

```ts
    {
      name: 'quarter-storage', // localStorage key
      version: 1, // naik dari 0: bug lama menyimpan Q1 di semua browser, reset sekali
      migrate: (persisted, version) =>
        version < 1 ? { ...(persisted as object), ...quarterOfDate(new Date()) } : persisted,
    }
```

`migrate` hanya dipanggil zustand kalau `version` tersimpan berbeda dari `version` opsi;
setelah migrasi state ditulis ulang dengan `version: 1`, jadi tidak reset lagi.
Jangan naikkan `version` lagi kecuali memang ada migrasi baru.

Jalankan ulang → **PASS** (4 test).

## Task 3 — Verifikasi

1. `npm run test:run` → semua PASS (termasuk `quarterUtils.createdAt.test.ts` yang sudah ada).
2. `npm run type-check` → 0 error.
3. Manual (`npm run dev`, port 5100): DevTools > Application > Local Storage > hapus
   `quarter-storage` > reload `/quests/daily-quests`. Header harus menampilkan **Q4 2026**.
   Pilih Q2 lewat QuarterSelector > reload > tetap Q2 (pilihan dihormati).
   Uji migrasi: set `quarter-storage` ke `{"state":{"year":2026,"quarter":1},"version":0}` > reload > Q4 2026.

## Commit

```
fix(quarter): default quarter = quarter berjalan, bukan Q1 (app-yv8t)

Store memakai quarter=1 tetap sehingga browser baru selalu buka Q1, dan Q1 itu
sudah tersimpan di localStorage. Sekarang default memakai quarterOfDate (13 minggu)
dan persist version 1 + migrate mereset sekali, dan parseQParam(null) ikut memakai tahun
perencanaan supaya benar di pergantian tahun.

fixes #19

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Pattern baru? Ya kecil: "default quarter = `quarterOfDate(new Date())`, jangan rumus bulan kalender" — catat 1 baris di `docs/claude/business-rules.md` bagian Quarter System.
- [ ] Tabel DB baru? Tidak.
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak.
