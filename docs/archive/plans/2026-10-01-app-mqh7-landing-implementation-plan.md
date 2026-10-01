# app-mqh7 — Landing page baru Bahasa Indonesia (IMPLEMENTATION PLAN)

Desain & copy (baca dulu, sumber tunggal teks): `docs/plans/2026-10-01-app-mqh7-landing-design.md`.

**Estimasi:** 3 berkas baru (~450 baris), 2 berkas diubah (~30 baris), 4 berkas dihapus (~660 baris) + 1 spec E2E (~50 baris). **Berat → Antigravity.**

**Di luar lingkup executor** (dikerjakan Claude di sesi terpisah): akun demo + data contoh, 15 screenshot di `public/images/landing/`. Kode dibangun duluan dengan path gambar yang sudah pasti; selama gambarnya belum ada, gambar tampil rusak di lokal — **itu normal, jangan dibuat placeholder**.

BRANCH: `feat/app-mqh7-landing-id` dari `main`.

Aturan: jangan install paket, jangan `git commit/push`, jangan `bd close` / ubah status beads.

---

## Fase 1 — Kode landing

### Task 1 — E2E dulu (RED)

Buat `tests/e2e/landing.spec.ts`. Pola sesi mengikuti `tests/e2e/auth.spec.ts` (`clearSession` dari `./helpers/auth`).

```ts
import { test, expect } from '@playwright/test';
import { clearSession } from './helpers/auth';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => { await clearSession(page); });

  test('hero Indonesia + CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Target besarmu masih di tempat');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'id_ID');
    await expect(page.getByRole('link', { name: 'Coba gratis' }).first()).toHaveAttribute('href', '/signup');
    await expect(page.getByRole('link', { name: 'Masuk' }).first()).toHaveAttribute('href', '/signin');
  });

  test('tanpa scroll samping di 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(390);
  });
});
```

Jalankan: `npx playwright test tests/e2e/landing.spec.ts` → harus **FAIL** (landing lama berbahasa Inggris).

### Task 2 — `src/components/landing/copy.id.ts`

Satu objek `copy` + tipe diekspor (`export type LandingCopy = typeof copy`) supaya `copy.en.ts` nanti wajib berbentuk sama. Salin **persis** semua teks dari §Copy di berkas desain — jangan menulis ulang kalimat.

Bentuk:

```ts
const IMG = '/images/landing';
// Ukuran baku screenshot (lihat desain §Screenshot) — width/height next/image.
export const SIZE = {
  wide: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  card: { width: 800, height: 600 },
} as const;

export const copy = {
  nav: { howItWorks: 'Cara kerja', pricing: 'Harga', faq: 'Tanya jawab', signin: 'Masuk', cta: 'Coba gratis' },
  hero: { eyebrow, title, subtitle, cta, signinPrompt /* 'Sudah punya akun?' */, signin, note,
          image: { desktop: `${IMG}/hero-desktop.jpg`, mobile: `${IMG}/hero-mobile.jpg`, alt } },
  problem: { eyebrow, title, body, punchline, todo: { title: 'Hari ini', items: string[], faded: string[], more: '+ 32 lagi' } },
  howItWorks: { eyebrow, title, subtitle },
  steps: [ // 3 elemen
    { tag, title, body, image: { src, alt, size: 'wide' },
      cards: [{ title, body, image: { src, alt } }, /* ×3, selalu size card */] },
  ],
  beforeAfter: { title, before: { label, body }, after: { label, body } },
  method: { eyebrow, title, subtitle, points: [{ title, body }] /* ×3 */,
            quote, author: 'Abu Abdirohman', role: 'pembuat Better Planner', initials: 'AA' },
  pricing: { title, free: { name, price, note, features: string[], cta }, pro: { name, badge, price, note, cta } },
  faq: { title, items: [{ q, a }] /* ×7 */ },
  closing: { title, cta },
  footer: { copyright: '© 2026 Better Planner', signin: 'Masuk', signup: 'Daftar' },
  meta: { title, description, keywords },
} as const;
```

`*Highest First*` di poin metode ditulis polos ("Prinsip Highest First: …"), tanpa markdown.

### Task 3 — `src/components/landing/LandingPage.tsx`

Server component (TANPA `"use client"`, tanpa hook/state). Satu berkas berisi semua seksi, urutan sesuai desain §Susunan halaman.

```tsx
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/button/Button';
import { copy, SIZE } from './copy.id';

// Matikan untuk menyembunyikan seksi harga + link nav-nya.
export const SHOW_PRICING = true;

const ctaClass = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600';
```

Ketentuan:
- **Nav** `sticky top-0`, latar putih/blur tipis, border bawah. Logo: `next/image` `/images/logo/logo.svg` (lihat pemakaian di layout auth untuk ukuran). Link anchor (`#cara-kerja`, `#harga`, `#tanya-jawab`) `hidden md:flex`; "Masuk" (link teks) + "Coba gratis" (`ctaClass`) selalu tampil. Tanpa hamburger.
- **Hero** teks tengah, `max-w-3xl`. Gambar: `<Image … className="hidden md:block" {...SIZE.wide} priority />` dan `<Image … className="md:hidden mx-auto" {...SIZE.mobile} priority />`, keduanya `rounded-xl border shadow-sm`, `sizes` diisi.
- **Masalah** `grid md:grid-cols-2`. Kartu to-do: `<ul>` biasa, `items` normal, `faded` `opacity-50`, baris `more` `opacity-30`. Checkbox = `<span>` kotak bertepi (dekoratif, `aria-hidden`).
- **Langkah** (`id="cara-kerja"` di pembungkus): `copy.steps.map` → kartu besar `rounded-2xl border p-6 md:p-10 grid md:grid-cols-5` (teks `md:col-span-2`, gambar `md:col-span-3`, `{...SIZE.wide}`), lalu `grid md:grid-cols-3 gap-4` berisi 3 kartu kecil (judul, 1 kalimat, `Image {...SIZE.card}` `loading` bawaan lazy).
- **Sebelum/Sesudah**: `grid md:grid-cols-2`; kiri `bg-gray-50`, kanan `border-2 border-brand-500`.
- **Metode**: 3 poin `grid md:grid-cols-3`; kutipan `<figure><blockquote>…</blockquote><figcaption>` + lingkaran inisial `bg-brand-500 text-white`.
- **Harga** hanya `{SHOW_PRICING && …}` (`id="harga"`): 2 kartu; Gratis → `Link` `ctaClass` ke `/signup`; Pro → `<Button variant="outline" disabled>{copy.pricing.pro.cta}</Button>`.
- **FAQ** (`id="tanya-jawab"`): `grid md:grid-cols-3` (judul kiri, daftar `md:col-span-2`); tiap item `<details className="group border-b py-4"><summary className="cursor-pointer list-none font-medium">…</summary><p>…</p></details>`. Tanpa JS.
- **Penutup + footer** sederhana; footer 3 teks/link saja.
- Lebar konten `mx-auto max-w-6xl px-4 sm:px-6`. Jarak antar seksi `py-16 md:py-24`. Judul seksi `text-3xl md:text-4xl font-bold tracking-tight text-gray-900`.
- Semua CTA daftar pakai `href="/signup"`, masuk `href="/signin"`.
- Hanya kelas Tailwind yang sudah ada di proyek (`brand-*`, `gray-*`). Tanpa gradient berlapis, tanpa ikon baru — boleh `react-icons/ri` yang sudah terpasang untuk centang di daftar harga.

### Task 4 — `src/app/page.tsx` + `src/app/layout.tsx`

`page.tsx` diganti seluruhnya:

```tsx
import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import { copy } from '@/components/landing/copy.id';

export const metadata: Metadata = {
  metadataBase: new URL('https://planner.abuabdirohman.com'),
  title: copy.meta.title,
  description: copy.meta.description,
  keywords: copy.meta.keywords,
  openGraph: {
    title: copy.meta.title,
    description: copy.meta.description,
    type: 'website',
    locale: 'id_ID',
    images: '/images/landing/og.jpg',
  },
  twitter: { card: 'summary_large_image', title: copy.meta.title, description: copy.meta.description },
};

export default function Page() {
  return <LandingPage />;
}
```

`src/app/layout.tsx:62`: `lang="en"` → `lang="id"`. Tidak ada perubahan lain di berkas itu.

### Task 5 — Hapus berkas lama

```bash
grep -rn "languageStore\|LanguageToggle\|LandingPageClient\|LandingPageContent" src tests
```
Harus hanya menunjuk ke 4 berkas berikut (dan saling-impor di antara mereka). Kalau ada pemakai lain → **BERHENTI, lapor**. Kalau aman, hapus:
- `src/components/landing/LandingPageClient.tsx`
- `src/components/landing/LandingPageContent.tsx`
- `src/stores/languageStore.ts`
- `src/components/ui/languages/LanguageToggle.tsx` (folder `languages/` ikut hapus kalau kosong)

Ulangi grep → harus kosong.

### Task 6 — Verifikasi

```bash
npm run type-check
npx playwright test tests/e2e/landing.spec.ts   # harus PASS (GREEN)
npm run build                                    # hentikan `npm run dev` dulu kalau sedang jalan
```

Cek manual di `http://localhost:5100/` (jendela privat / belum login): desktop 1440 dan 390px. Gambar rusak = wajar (belum dipotret).

**CHECKPOINT — BERHENTI.** Laporkan: daftar berkas baru/ubah/hapus, hasil 3 perintah di atas, dan tangkapan layar 1440 + 390 kalau bisa. Jangan commit, jangan `bd close`.

---

## Fase 2 — Screenshot & data demo (Claude, bukan executor)

Setelah `app-5r0j` masuk `main`:
1. Buat user demo lewat `/signup` lokal; isi data contoh via MCP `better-planner` (rincian persona di desain §Akun demo). Kredensial di `.env.local`.
2. Potret 15 gambar dengan `/app-screenshot` ke `public/images/landing/` sesuai tabel ukuran di desain.
3. Cek ulang landing di 1440 + 390, lalu review penuh pakai checklist di desain.
