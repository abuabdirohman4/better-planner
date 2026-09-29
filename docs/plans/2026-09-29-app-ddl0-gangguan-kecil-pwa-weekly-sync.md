# app-ddl0 — Gangguan kecil: pop-up install PWA, banner versi baru, Weekly Sync kosong

## Masalah

Tiga gangguan kecil, tiga perbaikan terpisah:

1. Pop-up "Install Better Planner" muncul di setiap halaman/kunjungan. Penyebab: dismiss disimpan di
   `sessionStorage` (`src/components/PWA/index.tsx:208`), yang hilang saat tab ditutup. Selain itu ada
   `setState` di badan render (`index.tsx:222-225`) yang tidak perlu.
2. Banner "New version available" (`index.tsx:236-253`) memakai `fixed top-0 left-0 right-0 z-50`, jadi
   menutupi header dan konten. Sonner sudah terpasang (`<Toaster position="top-right">` di
   `src/app/layout.tsx:85`), cukup ganti jadi toast.
3. Weekly Sync minggu yang belum diisi hanya menampilkan 3 baris slot kosong tanpa arahan
   (`WeeklySyncTable.tsx:123-143`; teks kecil "Klik tombol di bawah..." ada di `GoalRow.tsx:200`).

## Keputusan

- Dismiss disimpan di `localStorage` key `pwa-install-dismissed-at` (timestamp ms), masa tenang **30 hari**.
  Logikanya fungsi murni di `src/lib/pwaInstallDismiss.ts` supaya bisa di-test Vitest.
- Banner update jadi **toast Sonner** dengan tombol aksi "Muat ulang", id tetap `sw-update` supaya dua
  pemicu (`updatefound` dan `controllerchange`) tidak menumpuk dua toast.
- Empty state ditaruh **di dalam `WeeklySyncTable.tsx`** (bukan di `MainContent`/halaman), karena
  app-5r0j akan memindahkan Weekly Sync ke tab "Mingguan"; komponen tabel ikut pindah.
- CTA empty state membuka modal slot 1 lewat `handleSlotClick(1)` yang sudah ada. Tidak ada route baru.
- Tombol memakai `Button` dari `@/components/ui/button/Button`. Tidak ada package baru.
- Tombol install pop-up sendiri (markup HTML mentah) TIDAK diubah, di luar scope.

---

## Task 1 — Fungsi murni `shouldShowInstallPrompt` (TDD)

**File test baru:** `src/lib/__tests__/pwaInstallDismiss.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { shouldShowInstallPrompt, INSTALL_DISMISS_DAYS } from '@/lib/pwaInstallDismiss';

const DAY = 86400000;
const now = new Date('2026-09-29T00:00:00Z').getTime();

describe('shouldShowInstallPrompt', () => {
  it('tampil kalau belum pernah di-dismiss', () => {
    expect(shouldShowInstallPrompt(null, now)).toBe(true);
  });

  it('tersembunyi kalau di-dismiss kemarin', () => {
    expect(shouldShowInstallPrompt(now - DAY, now)).toBe(false);
  });

  it('tersembunyi tepat sebelum 30 hari', () => {
    expect(shouldShowInstallPrompt(now - (INSTALL_DISMISS_DAYS * DAY - 1), now)).toBe(false);
  });

  it('tampil lagi setelah 30 hari', () => {
    expect(shouldShowInstallPrompt(now - INSTALL_DISMISS_DAYS * DAY, now)).toBe(true);
  });

  it('nilai rusak (NaN) dianggap belum pernah di-dismiss', () => {
    expect(shouldShowInstallPrompt(NaN, now)).toBe(true);
  });
});
```

Jalankan `npx vitest run src/lib/__tests__/pwaInstallDismiss.test.ts` → **FAIL** (modul belum ada).

**File baru:** `src/lib/pwaInstallDismiss.ts`

```ts
export const INSTALL_DISMISS_DAYS = 30;
const KEY = 'pwa-install-dismissed-at';

// Pop-up install tersembunyi selama INSTALL_DISMISS_DAYS sejak terakhir di-dismiss.
export function shouldShowInstallPrompt(dismissedAt: number | null, now: number = Date.now()): boolean {
  if (dismissedAt === null || Number.isNaN(dismissedAt)) return true;
  return now - dismissedAt >= INSTALL_DISMISS_DAYS * 86400000;
}

export function readInstallDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

export function saveInstallDismissedAt(now: number = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(now));
  } catch {
    // storage diblokir (mode privat): abaikan, pop-up muncul lagi di kunjungan berikut
  }
}
```

Jalankan ulang → **PASS** (5 test).

## Task 2 — Pakai fungsi itu di `src/components/PWA/index.tsx`

Edit tiga titik (nomor baris dari file saat ini):

**2a. Import** (setelah baris 6):

```ts
import {
  shouldShowInstallPrompt,
  readInstallDismissedAt,
  saveInstallDismissedAt,
} from "@/lib/pwaInstallDismiss";
```

**2b. Handler `beforeinstallprompt`** (baris 59-65). Ganti blok `if (!isLandingPage) {...}` dengan:

```ts
      // Tampilkan hanya di halaman terautentikasi dan kalau masa tenang 30 hari sudah lewat
      if (!isLandingPage && shouldShowInstallPrompt(readInstallDismissedAt())) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
```

**2c. `handleInstallDismiss`** (baris 204-210). Ganti isinya:

```ts
  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
    saveInstallDismissedAt();
  };
```

**2d. Hapus blok render-time setState** (baris 222-225, komentar `// Don't show if dismissed this session...` sampai `}`). Tidak diperlukan lagi karena pengecekan sudah di 2b.

Catatan: `useEffect` punya deps `[]` sehingga `isLandingPage` di closure adalah nilai saat mount. Tidak diubah di issue ini.

## Task 3 — Banner update jadi toast Sonner

Di `src/components/PWA/index.tsx`:

**3a.** Hapus state `showUpdatePrompt` (baris 22) dan `handleUpdateDismiss` (baris 218-220). Hapus seluruh blok JSX `{/* Update Available */}` (baris 236-253).

**3b.** Tambah helper di dalam komponen, di atas `useEffect` (setelah baris 25):

```ts
  const notifyUpdate = () => {
    toast('Versi baru tersedia', {
      id: 'sw-update', // id tetap: dua pemicu tidak menumpuk dua toast
      duration: 15000,
      action: { label: 'Muat ulang', onClick: () => window.location.reload() },
    });
  };
```

**3c.** Ganti `setShowUpdatePrompt(true);` di dua tempat dengan `notifyUpdate();`:
- baris 42 (dalam `statechange` handler)
- baris 82 (dalam `handleServiceWorkerUpdate`)

**3d.** Hapus fungsi `handleUpdateClick` (baris 212-216) karena tombol aksi toast sudah memuat ulang.

Cek: `grep -n "showUpdatePrompt\|handleUpdateClick\|handleUpdateDismiss" src/components/PWA/index.tsx` → **tidak ada hasil**.

## Task 4 — Empty state Weekly Sync

**File:** `src/app/(admin)/execution/weekly-sync/WeeklySyncTable/WeeklySyncTable.tsx`

**4a. Import** (setelah baris 8):

```ts
import Button from '@/components/ui/button/Button';
```

**4b. Turunan `isEmpty`** (setelah `completionRate` useMemo, sekitar baris 56):

```ts
  // Minggu belum diisi: tidak ada goal, atau semua goal tanpa item
  const isEmpty = goals.every(goal => !goal.items || goal.items.length === 0);
```

**4c. Render** — di dalam `<ComponentCard>`, tepat antara blok "Custom Header" (berakhir baris 122) dan `<table>` (baris 123), tambahkan:

```tsx
        {isEmpty && (
          <div
            data-testid="weekly-sync-empty-state"
            className="mx-4 mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Minggu {props.weekNumber} belum punya 3 quest
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pilih maksimal 3 quest utama untuk minggu ini supaya Daily Sync punya arah.
            </p>
            <div className="mt-4 flex justify-center">
              <Button data-testid="weekly-sync-empty-cta" size="sm" onClick={() => handleSlotClick(1)}>
                Isi Goal Minggu Ini
              </Button>
            </div>
          </div>
        )}
```

Tabel 3 slot tetap dirender di bawahnya (tidak disembunyikan), supaya pengguna tetap bisa klik slot mana pun.

## Task 5 — Verifikasi

1. `npx vitest run src/lib/__tests__/pwaInstallDismiss.test.ts` → 5 PASS. Lalu `npm run test:run` → semua PASS.
2. `npm run type-check` → 0 error.
3. Manual, pop-up install (Chrome desktop, `npm run dev` port 5100, DevTools → Application → Manifest supaya `beforeinstallprompt` menyala; kalau tidak menyala di dev, cek di build produksi milik user):
   - [ ] Buka halaman terautentikasi → pop-up muncul setelah ~3 dtk.
   - [ ] Klik "Not now" → Application → Local Storage berisi `pwa-install-dismissed-at`.
   - [ ] Tutup tab, buka lagi, pindah antar halaman → pop-up TIDAK muncul.
   - [ ] Ubah nilai key jadi `Date.now() - 31*86400000`, reload → pop-up muncul lagi.
4. Manual, banner update (di DevTools → Application → Service Workers): 
   - [ ] Klik "skipWaiting" / ubah `sw-custom.js` lalu reload → toast "Versi baru tersedia" kecil di kanan atas, konten tidak tertutup.
   - [ ] Tombol "Muat ulang" me-reload halaman; toast hilang sendiri setelah 15 dtk.
   - [ ] Toast tidak muncul dobel.
5. Manual, Weekly Sync (`/execution/weekly-sync`):
   - [ ] Pilih minggu yang belum ada goal → kotak empty state muncul dengan tombol "Isi Goal Minggu Ini".
   - [ ] Klik tombol → modal slot 1 terbuka; simpan → empty state hilang.
   - [ ] Minggu yang sudah terisi → empty state tidak muncul.
   - [ ] Dark mode terbaca jelas.

## Commit

```
fix(pwa,weekly-sync): pop-up install 30 hari, update jadi toast, empty state Weekly Sync (app-ddl0)

fixes #20

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Pattern baru: dismiss PWA disimpan di localStorage 30 hari via `src/lib/pwaInstallDismiss.ts` — catat satu baris di `docs/claude/architecture-patterns.md`.
- [ ] Tabel baru? Tidak.
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak.
- [ ] Komponen UI reuse: `Button` dipakai; tidak ada elemen UI mentah baru.
- [ ] `docs/products/roadmap.md`: update saat `bd close app-ddl0`.
