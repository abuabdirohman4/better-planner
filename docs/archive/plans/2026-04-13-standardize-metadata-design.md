# Design: Standardize Metadata Placement Pattern

**Date:** 2026-04-14
**Beads:** bp-8m5
**GitHub:** https://github.com/abuabdirohman4/better-planner/issues/9

---

## Problem

Inkonsistensi ditemukan dalam cara `metadata` diekspor di seluruh halaman:

| Lokasi | Pattern Saat Ini |
|--------|-----------------|
| `execution/daily-sync/` | metadata di `layout.tsx` (passthrough) |
| `execution/weekly-sync/` | metadata di `layout.tsx` (passthrough) |
| `planning/vision/page.tsx` | metadata di `page.tsx` ✅ |
| `planning/main-quests/page.tsx` | metadata di `page.tsx` ✅ |
| `planning/12-week-quests/page.tsx` | metadata di `page.tsx` tapi tanpa type `Metadata` |
| `planning/12-week-sync/page.tsx` | metadata di `page.tsx` tapi tanpa type `Metadata` |
| `dashboard/page.tsx` | metadata di `page.tsx` ✅ |
| `habits/` | **TIDAK ADA metadata sama sekali** ❌ |
| `quests/daily-quests/page.tsx` | **TIDAK ADA metadata** ❌ (client component) |
| `quests/work-quests/page.tsx` | **TIDAK ADA metadata** ❌ (client component) |
| `quests/side-quests/page.tsx` | **TIDAK ADA metadata** ❌ (client component) |

## Root Cause

Next.js **secara diam-diam mengabaikan** export `metadata` di dalam `"use client"` components. Developer yang tidak tahu hal ini menulis metadata di `page.tsx` yang adalah client component — tidak ada error, tapi metadata tidak pernah dipakai. Beberapa developer sadar dan meletakkan di `layout.tsx` sebagai workaround, tapi tidak ada standar yang terdokumentasi.

---

## Decision: Standar Resmi

### Rule

| Kondisi `page.tsx` | Di mana metadata |
|-------------------|-----------------|
| Server component (tidak ada `"use client"`) | Langsung di `page.tsx` |
| Client component (ada `"use client"`) | Di `layout.tsx` (server component) di folder yang sama |

### Mengapa bukan split server wrapper + client component?

Pendekatan alternatif adalah membuat `page.tsx` sebagai server component yang mengimpor client component (e.g. `PageClient.tsx`). Namun:
- Menambah file ekstra untuk setiap halaman
- Lebih kompleks tanpa manfaat tambahan
- `layout.tsx` sudah tersedia dan lebih idiomatik untuk kasus ini

### Mengapa `layout.tsx` valid untuk metadata?

Next.js mendukung metadata di `layout.tsx` — metadata akan diapply ke semua children di dalam layout tersebut. Untuk folder dengan satu `page.tsx`, efeknya sama persis dengan metadata di `page.tsx`.

---

## Architecture Decision: Habits Layout

`habits/layout.tsx` saat ini adalah `"use client"` karena menggunakan `usePathname` untuk tab navigation. Tidak bisa langsung ditambahkan metadata.

**Solusi:** Extract tab navigation ke file terpisah `HabitsTabLayout.tsx` (client component), lalu jadikan `layout.tsx` sebagai server component yang mengekspor metadata dan merender `HabitsTabLayout`.

```
habits/
├── layout.tsx          ← Server component (metadata + wraps HabitsTabLayout)
├── HabitsTabLayout.tsx ← Client component (tab navigation logic)
├── today/
│   └── page.tsx
└── monthly/
    └── page.tsx
```

---

## Type Annotation Standard

Selalu gunakan type annotation eksplisit:

```typescript
// ✅ Benar
import { Metadata } from "next";
export const metadata: Metadata = { ... };

// ❌ Salah — untyped, tidak ada autocomplete/validation
export const metadata = { ... };
```

---

## Title Format Standard

Selalu gunakan format: `"[Nama Halaman] | Better Planner"`

Root `layout.tsx` sudah set `"Better Planner"` sebagai fallback. Page-level metadata akan override via Next.js metadata merging.

---

## Documentation Plan

1. Tambah section **Metadata Standard** di `docs/claude/architecture-patterns.md`
2. Tambah satu pointer line di `CLAUDE.md` → Architecture Quick Reference section

---

## Review Checklist (setelah implementasi)

- [ ] `npm run type-check` lulus tanpa error baru
- [ ] Browser tab `/habits/today` menampilkan "Habits | Better Planner"
- [ ] Browser tab `/habits/monthly` menampilkan "Habits | Better Planner"
- [ ] Habits tab navigation (Monthly Grid ↔ Today's Habits) masih berfungsi
- [ ] Browser tab `/quests/daily-quests` menampilkan "Daily Quests | Better Planner"
- [ ] Browser tab `/quests/work-quests` menampilkan "Work Quests | Better Planner"
- [ ] Browser tab `/quests/side-quests` menampilkan "Side Quests | Better Planner"
- [ ] Browser tab `/planning/best-week` menampilkan "Best Week | Better Planner"
- [ ] `npm run build` sukses
