# Brain Dump Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Buat halaman `/execution/brain-dump` yang menampilkan semua brain dump per minggu dalam 13-week quarter, dengan accordion per minggu dan inline editing.

**Architecture:** RSC page baca `?q=` param → client component fetch seluruh quarter sekali (`getBrainDumpByDateRange`) → 13 `WeekAccordion` (default: minggu aktif terbuka) → 7 `DayBrainDump` per accordion dengan `RichTextEditor`. Quarter navigation via URL param (`?q=2026-Q2`), tidak menyentuh global `quarterStore`.

**Tech Stack:** Next.js 15 App Router, SWR (optimistic update), Supabase Server Actions, Tiptap (`RichTextEditor`), Tailwind CSS v4, sonner (toast)

---

## Task 1: Fix `BrainDumpItem` type — tambah field `date`

**Files:**
- Modify: `src/types/brain-dump.ts`

Field `date` ada di database dan dipakai di semua queries, tapi tidak ada di TypeScript type. Ini akan menyebabkan error saat build.

**Step 1: Edit `BrainDumpItem`**

Buka `src/types/brain-dump.ts`. Ubah:

```typescript
// BEFORE
export interface BrainDumpItem {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// AFTER
export interface BrainDumpItem {
  id: string
  user_id: string
  date: string        // YYYY-MM-DD — dipakai sebagai unique key per hari per user
  content: string
  created_at: string
  updated_at: string
}
```

**Step 2: Verifikasi tidak ada TypeScript error**

```bash
npm run type-check
```

Expected: pass tanpa error terkait `BrainDumpItem`.

**Step 3: Commit**

```bash
git add src/types/brain-dump.ts
git commit -m "fix(types): add missing date field to BrainDumpItem"
```

---

## Task 2: Tambah "Brain Dump" ke sidebar navigation

**Files:**
- Modify: `src/components/layouts/AppSidebar.tsx`

**Step 1: Import `PencilIcon`**

Di `AppSidebar.tsx` baris 8-20, tambah `PencilIcon` ke import dari `@/lib/icons`:

```typescript
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
  TaskIcon,
  EyeIcon,
  CheckCircleIcon,
  PencilIcon,        // ← tambah ini
  // DocsIcon,
  ShootingStarIcon,
} from "@/lib/icons";
```

**Step 2: Tambah item ke `executionNav`**

Di `executionNav` array (baris 32-53), sisipkan item baru **setelah** "Daily Sync" dan **sebelum** "Weekly Sync":

```typescript
const executionNav: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <TaskIcon />,
    name: "Daily Sync",
    path: "/execution/daily-sync",
  },
  {
    icon: <PencilIcon />,       // ← item baru
    name: "Brain Dump",
    path: "/execution/brain-dump",
  },
  {
    icon: <CalenderIcon />,
    name: "Weekly Sync",
    path: "/execution/weekly-sync",
  },
  {
    icon: <CheckCircleIcon />,
    name: "Habit Tracker",
    path: "/habits/monthly",
  },
];
```

**Step 3: Verifikasi visual**

```bash
npm run dev
```

Buka sidebar — pastikan "Brain Dump" muncul antara "Daily Sync" dan "Weekly Sync". Klik item → akan 404 (halaman belum ada), itu normal.

**Step 4: Commit**

```bash
git add src/components/layouts/AppSidebar.tsx
git commit -m "feat(nav): add Brain Dump to execution sidebar navigation"
```

---

## Task 3: Buat `useBrainDumpQuarter` hook

**Files:**
- Create: `src/app/(admin)/execution/brain-dump/hooks/useBrainDumpQuarter.ts`

Hook ini fetch semua brain dumps untuk satu quarter sekaligus, return `Map<string, BrainDumpItem>` untuk O(1) lookup per tanggal, dan expose `saveDump(date, content)` dengan optimistic update.

**Step 1: Buat file hook**

Buat `src/app/(admin)/execution/brain-dump/hooks/useBrainDumpQuarter.ts`:

```typescript
import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import type { BrainDumpItem } from '@/types/brain-dump';
import { getBrainDumpByDateRange, upsertBrainDump } from '@/app/(admin)/execution/daily-sync/BrainDump/actions/actions';
import { brainDumpKeys } from '@/lib/swr';
import { getQuarterDates } from '@/lib/quarterUtils';
import { getLocalDateString } from '@/lib/dateUtils';

interface UseBrainDumpQuarterOptions {
  year: number;
  quarter: number;
}

interface UseBrainDumpQuarterReturn {
  dumpsByDate: Map<string, BrainDumpItem>;
  isLoading: boolean;
  error: string | null;
  saveDump: (date: string, content: string) => Promise<void>;
  isSaving: boolean;
}

export function useBrainDumpQuarter({ year, quarter }: UseBrainDumpQuarterOptions): UseBrainDumpQuarterReturn {
  const [isSaving, setIsSaving] = useState(false);

  // Hitung date range untuk quarter ini
  const { startDate, endDate } = getQuarterDates(year, quarter);
  const startDateStr = getLocalDateString(startDate);
  const endDateStr = getLocalDateString(endDate);

  const { data, error, isLoading, mutate } = useSWR(
    brainDumpKeys.byDateRange(startDateStr, endDateStr),
    () => getBrainDumpByDateRange(startDateStr, endDateStr),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 15 * 60 * 1000, // 15 menit
      errorRetryCount: 3,
    }
  );

  // Convert array ke Map untuk O(1) lookup
  const dumpsByDate = useMemo(
    () => new Map((data ?? []).map((d) => [d.date, d])),
    [data]
  );

  const saveDump = useCallback(
    async (date: string, content: string) => {
      setIsSaving(true);
      try {
        const result = await upsertBrainDump({ date, content });
        if (result) {
          // Optimistic update: replace atau insert entry di cache
          mutate((prev) => {
            const updated = [...(prev ?? [])];
            const idx = updated.findIndex((d) => d.date === date);
            if (idx >= 0) {
              updated[idx] = result;
            } else {
              updated.push(result);
            }
            return updated;
          }, false);
        }
      } catch {
        toast.error('Gagal menyimpan brain dump');
        throw new Error('Save failed');
      } finally {
        setIsSaving(false);
      }
    },
    [mutate]
  );

  return {
    dumpsByDate,
    isLoading,
    error: error?.message ?? null,
    saveDump,
    isSaving,
  };
}
```

> **Catatan penting:** `getLocalDateString` digunakan untuk memastikan date string dalam timezone WIB (Asia/Jakarta) sesuai konvensi app. Cek di `src/lib/dateUtils.ts` bahwa function ini tersedia.

**Step 2: Verifikasi type-check**

```bash
npm run type-check
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/(admin)/execution/brain-dump/hooks/useBrainDumpQuarter.ts
git commit -m "feat(brain-dump): add useBrainDumpQuarter SWR hook with optimistic updates"
```

---

## Task 4: Buat `DayBrainDump` component

**Files:**
- Create: `src/app/(admin)/execution/brain-dump/DayBrainDump.tsx`

Component ini render satu hari: label hari, editor (selalu visible, muted jika kosong), save button (muncul jika ada perubahan).

**Step 1: Buat file component**

Buat `src/app/(admin)/execution/brain-dump/DayBrainDump.tsx`:

```typescript
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/ui/rich-text-editor/RichTextEditor';
import Button from '@/components/ui/button/Button';
import type { BrainDumpItem } from '@/types/brain-dump';

interface DayBrainDumpProps {
  date: string;                          // "YYYY-MM-DD"
  existingDump: BrainDumpItem | undefined;
  saveDump: (date: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const DayBrainDump: React.FC<DayBrainDumpProps> = ({
  date,
  existingDump,
  saveDump,
  isSaving,
}) => {
  const [content, setContent] = useState(existingDump?.content ?? '');
  const hasChanges = content !== (existingDump?.content ?? '');

  // Sync content ketika data dari parent berubah (misal setelah save)
  useEffect(() => {
    setContent(existingDump?.content ?? '');
  }, [existingDump]);

  // Format label hari dalam bahasa Indonesia: "Senin, 27 Apr"
  const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const handleSave = async () => {
    try {
      await saveDump(date, content);
      toast.success('Brain dump berhasil disimpan');
    } catch {
      // Error toast sudah ditangani di hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSaving && hasChanges) {
        handleSave();
      }
    }
  };

  const isEmpty = !existingDump;

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      isEmpty
        ? 'border-dashed border-gray-200 dark:border-gray-700'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header hari */}
      <p className={`text-sm font-medium mb-3 ${
        isEmpty
          ? 'text-gray-400 dark:text-gray-500'
          : 'text-gray-700 dark:text-gray-300'
      }`}>
        {dayLabel}
      </p>

      {/* Editor */}
      <RichTextEditor
        value={content}
        onChange={setContent}
        onKeyDown={handleKeyDown}
        placeholder="Tuliskan apa yang ada di pikiran Anda..."
        className="w-full"
        rows={isEmpty ? 4 : 6}
        disabled={isSaving}
      />

      {/* Save button — tampil hanya jika ada perubahan */}
      {hasChanges && (
        <div className="mt-3">
          <Button
            onClick={handleSave}
            loading={isSaving}
            loadingText="Menyimpan..."
            size="sm"
            variant="primary"
          >
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
};

export default DayBrainDump;
```

**Step 2: Verifikasi type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add src/app/(admin)/execution/brain-dump/DayBrainDump.tsx
git commit -m "feat(brain-dump): add DayBrainDump component with inline editing"
```

---

## Task 5: Buat `WeekAccordion` component

**Files:**
- Create: `src/app/(admin)/execution/brain-dump/WeekAccordion.tsx`

Component ini render satu minggu sebagai accordion: header "Week N" + rentang tanggal, body 7x `DayBrainDump`.

**Step 1: Buat file component**

Buat `src/app/(admin)/execution/brain-dump/WeekAccordion.tsx`:

```typescript
"use client";

import React from 'react';
import { ChevronDownIcon } from '@/lib/icons';
import { getDateFromWeek } from '@/lib/quarterUtils';
import { getLocalDateString } from '@/lib/dateUtils';
import type { BrainDumpItem } from '@/types/brain-dump';
import DayBrainDump from './DayBrainDump';

interface WeekAccordionProps {
  weekInQuarter: number;          // 1–13, untuk display "Week 1"
  weekNumber: number;             // absolute week number (1–52), untuk getDateFromWeek
  year: number;
  isOpen: boolean;
  onToggle: () => void;
  dumpsByDate: Map<string, BrainDumpItem>;
  saveDump: (date: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const WeekAccordion: React.FC<WeekAccordionProps> = ({
  weekInQuarter,
  weekNumber,
  year,
  isOpen,
  onToggle,
  dumpsByDate,
  saveDump,
  isSaving,
}) => {
  // Hitung 7 tanggal untuk minggu ini (Senin=1 s.d. Minggu=7)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = getDateFromWeek(year, weekNumber, i + 1);
    return getLocalDateString(date);
  });

  // Subtitle rentang tanggal: "28 Apr – 4 Mei"
  const firstDay = new Date(days[0] + 'T12:00:00');
  const lastDay = new Date(days[6] + 'T12:00:00');
  const rangeLabel = `${firstDay.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${lastDay.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;

  // Hitung berapa hari yang ada konten (untuk badge)
  const filledCount = days.filter((d) => dumpsByDate.has(d)).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header accordion */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Week {weekInQuarter}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rangeLabel}
          </span>
          {filledCount > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {filledCount}/7
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Body dengan animasi max-h */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          {days.map((date) => (
            <DayBrainDump
              key={date}
              date={date}
              existingDump={dumpsByDate.get(date)}
              saveDump={saveDump}
              isSaving={isSaving}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekAccordion;
```

**Step 2: Verifikasi type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add src/app/(admin)/execution/brain-dump/WeekAccordion.tsx
git commit -m "feat(brain-dump): add WeekAccordion component with 7-day display"
```

---

## Task 6: Buat `BrainDumpPageClient` component

**Files:**
- Create: `src/app/(admin)/execution/brain-dump/BrainDumpPageClient.tsx`

Client component utama: quarter header dengan navigasi prev/next, render 13 `WeekAccordion`, default accordion minggu aktif terbuka.

**Step 1: Buat file component**

Buat `src/app/(admin)/execution/brain-dump/BrainDumpPageClient.tsx`:

```typescript
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import {
  getQuarterWeekRange,
  getWeekOfYear,
  formatQParam,
  getPrevQuarter,
  getNextQuarter,
} from '@/lib/quarterUtils';
import { useBrainDumpQuarter } from './hooks/useBrainDumpQuarter';
import WeekAccordion from './WeekAccordion';

interface BrainDumpPageClientProps {
  year: number;
  quarter: number;
}

const BrainDumpPageClient: React.FC<BrainDumpPageClientProps> = ({ year, quarter }) => {
  const router = useRouter();
  const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
  const totalWeeks = endWeek - startWeek + 1; // selalu 13

  // Tentukan index minggu aktif (0-based dalam quarter)
  const currentWeekIndex = useMemo(() => {
    const currentWeek = getWeekOfYear(new Date());
    const idx = currentWeek - startWeek;
    // Clamp ke dalam range quarter
    return Math.min(Math.max(idx, 0), totalWeeks - 1);
  }, [startWeek, totalWeeks]);

  // Accordion state: array boolean[13], default hanya minggu aktif terbuka
  const [openStates, setOpenStates] = useState<boolean[]>(() =>
    Array.from({ length: totalWeeks }, (_, i) => i === currentWeekIndex)
  );

  const toggleWeek = (index: number) => {
    setOpenStates((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const { dumpsByDate, isLoading, saveDump, isSaving } = useBrainDumpQuarter({ year, quarter });

  const navigateQuarter = (direction: 'prev' | 'next') => {
    const { year: nextYear, quarter: nextQuarter } =
      direction === 'prev' ? getPrevQuarter(year, quarter) : getNextQuarter(year, quarter);
    router.push(`/execution/brain-dump?q=${formatQParam(nextYear, nextQuarter)}`);
  };

  // Generate list minggu dalam quarter ini
  const weeks = Array.from({ length: totalWeeks }, (_, i) => ({
    weekInQuarter: i + 1,            // 1–13
    weekNumber: startWeek + i,       // absolute week number
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Quarter header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Brain Dump
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateQuarter('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Quarter sebelumnya"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
            Q{quarter} {year}
          </span>
          <button
            onClick={() => navigateQuarter('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Quarter berikutnya"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* 13 Week Accordions */}
      {!isLoading && (
        <div className="space-y-3">
          {weeks.map(({ weekInQuarter, weekNumber }, index) => (
            <WeekAccordion
              key={weekNumber}
              weekInQuarter={weekInQuarter}
              weekNumber={weekNumber}
              year={year}
              isOpen={openStates[index]}
              onToggle={() => toggleWeek(index)}
              dumpsByDate={dumpsByDate}
              saveDump={saveDump}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrainDumpPageClient;
```

> **Catatan:** `ChevronLeftIcon` dan `ChevronRightIcon` — verifikasi apakah keduanya diekspor dari `@/lib/icons`. Jika tidak ada `ChevronRightIcon`, gunakan `ChevronDownIcon` dengan `rotate-90` / `-rotate-90` sebagai fallback.

**Step 2: Verifikasi icon yang tersedia**

```bash
grep -n "ChevronLeft\|ChevronRight" src/lib/icons.ts
```

Jika tidak ada, sesuaikan import di component.

**Step 3: Verifikasi type-check**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add src/app/(admin)/execution/brain-dump/BrainDumpPageClient.tsx
git commit -m "feat(brain-dump): add BrainDumpPageClient with quarter navigation and accordion state"
```

---

## Task 7: Buat `page.tsx` (RSC entry point)

**Files:**
- Create: `src/app/(admin)/execution/brain-dump/page.tsx`

**Step 1: Buat file page**

Buat `src/app/(admin)/execution/brain-dump/page.tsx`:

```typescript
import { Suspense } from 'react';
import { parseQParam } from '@/lib/quarterUtils';
import BrainDumpPageClient from './BrainDumpPageClient';

export const metadata = {
  title: 'Brain Dump | Better Planner',
  description: 'Review semua brain dump Anda per minggu',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function BrainDumpPage({ searchParams }: Props) {
  const params = await searchParams;
  const { year, quarter } = parseQParam(params.q ?? null);

  return (
    <Suspense fallback={null}>
      <BrainDumpPageClient year={year} quarter={quarter} />
    </Suspense>
  );
}
```

**Step 2: Verifikasi halaman bisa diakses**

```bash
npm run dev
```

Buka `http://localhost:3000/execution/brain-dump` — pastikan halaman muncul dengan quarter selector dan 13 accordion.

**Step 3: Test accordion dan editing**
- [ ] Minggu aktif terbuka secara default, sisanya collapsed
- [ ] Klik accordion week lain → buka/tutup dengan animasi
- [ ] Edit brain dump di hari yang sudah ada → save button muncul
- [ ] Tekan Cmd/Ctrl+Enter → tersimpan, toast muncul
- [ ] Edit hari yang kosong → bisa ketik dan simpan
- [ ] Klik `<` / `>` → URL berubah ke quarter yang benar, data di-refresh

**Step 4: Verifikasi konsistensi dengan Daily Sync**
- Buat brain dump di Daily Sync untuk hari tertentu
- Buka halaman Brain Dump → pastikan konten muncul di minggu/hari yang benar
- Edit dari halaman Brain Dump → buka Daily Sync → data harus konsisten

**Step 5: Commit**

```bash
git add src/app/(admin)/execution/brain-dump/page.tsx
git commit -m "feat(brain-dump): add dedicated Brain Dump page with week accordion"
```

---

## Task 8: Final type-check dan push

**Step 1: Full type-check dan build**

```bash
npm run type-check
npm run build
```

Expected: no TypeScript errors, build sukses.

**Step 2: Push ke remote**

```bash
git push
```

**Step 3: Cek halaman di production (jika staging tersedia)**

- Sidebar: "Brain Dump" muncul antara Daily Sync dan Weekly Sync
- Halaman `/execution/brain-dump` load tanpa error
- Quarter navigation bekerja dengan URL param
- Inline editing dan save berfungsi

---

## Checklist File yang Dibuat/Diubah

| File | Status |
|---|---|
| `src/types/brain-dump.ts` | Modified — tambah `date: string` |
| `src/components/layouts/AppSidebar.tsx` | Modified — tambah nav item |
| `src/app/(admin)/execution/brain-dump/hooks/useBrainDumpQuarter.ts` | Created |
| `src/app/(admin)/execution/brain-dump/DayBrainDump.tsx` | Created |
| `src/app/(admin)/execution/brain-dump/WeekAccordion.tsx` | Created |
| `src/app/(admin)/execution/brain-dump/BrainDumpPageClient.tsx` | Created |
| `src/app/(admin)/execution/brain-dump/page.tsx` | Created |

## Existing Code yang Dipakai (TIDAK diubah)

- `src/app/(admin)/execution/daily-sync/BrainDump/actions/actions.ts` — `getBrainDumpByDateRange`, `upsertBrainDump`
- `src/lib/quarterUtils.ts` — semua fungsi quarter
- `src/lib/swr.ts` — `brainDumpKeys.byDateRange`
- `src/components/ui/rich-text-editor/RichTextEditor.tsx`
- `src/components/ui/button/Button.tsx`
