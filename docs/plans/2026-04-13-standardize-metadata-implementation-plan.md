# Implementation Plan: Standardize Metadata Placement Pattern

**Date:** 2026-04-14
**Beads:** bp-8m5
**GitHub:** https://github.com/abuabdirohman4/better-planner/issues/9
**Design:** `docs/plans/2026-04-13-standardize-metadata-design.md`

---

## Task 1: Extract HabitsTabLayout dan fix habits/layout.tsx

### 1a. Buat file baru `src/app/(admin)/habits/HabitsTabLayout.tsx`

Isi dengan konten yang sama persis dengan `habits/layout.tsx` saat ini, tapi rename fungsinya:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Monthly Grid", href: "/habits/monthly" },
  { label: "Today's Habits", href: "/habits/today" },
];

export default function HabitsTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-gray-900">
        <nav className="flex gap-0" aria-label="Habit views">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
```

### 1b. Timpa `src/app/(admin)/habits/layout.tsx` dengan server component

```typescript
import { Metadata } from "next";
import HabitsTabLayout from "./HabitsTabLayout";

export const metadata: Metadata = {
  title: "Habits | Better Planner",
  description: "Track and manage your daily habits",
};

export default function HabitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HabitsTabLayout>{children}</HabitsTabLayout>;
}
```

**Checkpoint:** Jalankan `npm run type-check` — harus tidak ada error baru.

---

## Task 2: Tambah layout.tsx dengan metadata untuk quests pages

### 2a. Buat `src/app/(admin)/quests/daily-quests/layout.tsx`

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Quests | Better Planner",
  description: "Manage your daily recurring tasks",
};

export default function DailyQuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

### 2b. Buat `src/app/(admin)/quests/work-quests/layout.tsx`

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work Quests | Better Planner",
  description: "Manage your professional project tasks",
};

export default function WorkQuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

### 2c. Buat `src/app/(admin)/quests/side-quests/layout.tsx`

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Side Quests | Better Planner",
  description: "Manage your personal development and side projects",
};

export default function SideQuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Checkpoint:** Jalankan `npm run type-check` — harus tidak ada error baru.

---

## Task 3: Fix missing Metadata type annotation

### 3a. `src/app/(admin)/planning/12-week-quests/page.tsx`

Cari baris: `export const metadata = {`

Tambahkan import di bagian atas file (setelah imports yang ada):
```typescript
import { Metadata } from "next";
```

Ubah baris metadata menjadi:
```typescript
export const metadata: Metadata = {
```

### 3b. `src/app/(admin)/planning/12-week-sync/page.tsx`

Cari baris: `export const metadata = {`

Tambahkan import di bagian atas file:
```typescript
import { Metadata } from "next";
```

Ubah baris metadata menjadi:
```typescript
export const metadata: Metadata = {
```

### 3c. `src/app/(admin)/planning/12-week-sync/history/page.tsx`

Tambahkan import di bagian atas file:
```typescript
import { Metadata } from "next";
```

Ubah baris metadata menjadi:
```typescript
export const metadata: Metadata = {
  title: '12 Week Sync History | Better Planner',
  description: 'Riwayat quarterly review Better Planner',
};
```

**Checkpoint:** Jalankan `npm run type-check` — harus tidak ada error baru.

---

## Task 4: Tambah metadata ke best-week page (server component)

### `src/app/(admin)/planning/best-week/page.tsx`

File ini adalah server component. Tambahkan di bawah import yang sudah ada:

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Week | Better Planner",
  description: "Plan and reflect on your best week",
};
```

**Checkpoint:** Jalankan `npm run type-check` — harus tidak ada error baru.

---

## Task 5: Dokumentasikan standar di architecture-patterns.md

Buka `docs/claude/architecture-patterns.md` dan tambahkan section berikut di bagian akhir file:

```markdown
---

## 📄 Metadata Standard

**Rule:** Setiap page HARUS memiliki `metadata` export dengan minimal `title` dan `description`.

### Pattern A — Server Component Page
Jika `page.tsx` TIDAK memiliki `"use client"`, tambahkan metadata langsung:

```typescript
// page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nama Halaman | Better Planner",
  description: "Deskripsi singkat halaman ini",
};
```

### Pattern B — Client Component Page
Jika `page.tsx` memiliki `"use client"`, buat `layout.tsx` (server component) di folder yang sama:

```typescript
// layout.tsx  ← server component, TIDAK ADA "use client"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nama Halaman | Better Planner",
  description: "Deskripsi singkat halaman ini",
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Jika `layout.tsx` sudah menjadi client component (memiliki UI logic seperti tab navigation),
extract UI logic ke file client terpisah (e.g. `TabLayout.tsx`) dan biarkan `layout.tsx`
sebagai server component yang bersih.

### Format Title
Selalu gunakan: `"[Nama Halaman] | Better Planner"`
Root `layout.tsx` sudah set `"Better Planner"` sebagai fallback — page metadata akan override-nya.

### Type Annotation
Selalu gunakan `import { Metadata } from "next"` dan annotasikan: `metadata: Metadata`
Jangan gunakan untyped: `export const metadata = { ... }` ❌
```

---

## Task 6: Tambah pointer line di CLAUDE.md

Buka `CLAUDE.md`, cari section `## 🏗️ Architecture Quick Reference`.

Tambahkan satu baris setelah baris `**Key Patterns**...`:

```
**📖 For metadata placement standard (server vs client pages), READ [`docs/claude/architecture-patterns.md`](docs/claude/architecture-patterns.md)**
```

---

## Task 7: Hapus file plan lama

Hapus file `docs/plans/2026-04-13-standardize-metadata.md` yang sudah digantikan oleh dua file ini.

---

## Final Verification

1. `npm run type-check` — harus lulus tanpa error baru
2. `npm run build` — harus sukses
3. Jalankan dev server `npm run dev` dan cek browser tab titles:
   - `/habits/today` → "Habits | Better Planner"
   - `/habits/monthly` → "Habits | Better Planner"
   - Habits tab navigation (Monthly Grid ↔ Today's Habits) masih berfungsi normal
   - `/quests/daily-quests` → "Daily Quests | Better Planner"
   - `/quests/work-quests` → "Work Quests | Better Planner"
   - `/quests/side-quests` → "Side Quests | Better Planner"
   - `/planning/best-week` → "Best Week | Better Planner"

---

## Suggested Commit Message

```
feat: standardize metadata pattern across all pages (bp-8m5, fixes #9)

- Extract HabitsTabLayout client component, make habits/layout.tsx server component with metadata
- Add layout.tsx with metadata for daily-quests, work-quests, side-quests
- Add metadata to planning/best-week page
- Fix missing Metadata type annotation in 12-week-quests, 12-week-sync, history pages
- Document metadata standard in architecture-patterns.md + pointer in CLAUDE.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
