# app-5r0j — Sidebar 5 grup berlabel + halaman jadi tab (IMPLEMENTATION PLAN)

Desain & alasan keputusan: `docs/plans/2026-09-29-app-5r0j-sidebar-5-grup-tab-design.md` — **baca dulu**.

## Ringkasan

- **Tidak ada rute yang dipindah.** Semua URL tetap. Tab = `Link` antar rute yang sudah ada.
- Satu config data murni `src/lib/navigation.ts` (`NAV_GROUPS`, `findActiveTab`, `ALL_NAV_HREFS`)
  dipakai sidebar, bottom nav, tab bar, judul header, prefetch.
- Isi halaman (Daily Sync, kalender Plan/Both/Actual, Weekly Sync, dst.) **tidak disentuh**.

Dua fase. Tiap fase diakhiri checkpoint; berhenti dan lapor ke user di tiap checkpoint.

| File | Aksi | Est. baris |
|---|---|---|
| `src/lib/navigation.ts` | baru | +60 |
| `src/lib/__tests__/navigation.test.ts` | baru | +75 |
| `src/components/layouts/navIcons.tsx` | baru | +15 |
| `src/components/layouts/AppSidebar.tsx` | tulis ulang | 713 → ~110 |
| `src/components/layouts/BottomNavigation.tsx` | edit | −25 / +10 |
| `src/components/layouts/AppHeader.tsx` | edit baris 12-101 | −85 / +8 |
| `src/components/layouts/SectionTabs.tsx` | baru (Fase 2) | +45 |
| `src/app/(admin)/layout.tsx` | edit (Fase 2) | +2 |
| `src/app/(admin)/habits/HabitsTabLayout.tsx` | edit class (Fase 2) | ~10 |
| `tests/e2e/navigation.spec.ts` | baru (Fase 2) | +40 |
| `docs/claude/architecture-patterns.md` | edit (Fase 2) | +25 |

JANGAN ubah: rute/folder di `src/app/(admin)`, `revalidatePath` di actions, `next.config.ts`,
`QuarterSelector.tsx`, `dashboard/page.tsx`, E2E spec yang sudah ada.

---

# FASE 1 — Config nav + sidebar/bottom nav 5 grup berlabel

## Task 1 — `src/lib/navigation.ts` (TDD)

### 1a. RED — tulis tes dulu

**File baru:** `src/lib/__tests__/navigation.test.ts`

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NAV_GROUPS, ALL_NAV_HREFS, findActiveTab } from '../navigation';

const ADMIN_DIR = path.resolve(__dirname, '../../app/(admin)');

// Turn every page.tsx under (admin) into its URL, e.g. habits/today/page.tsx -> /habits/today.
function adminPageRoutes(dir = ADMIN_DIR, prefix = ''): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isFile() && entry.name === 'page.tsx') return [prefix || '/'];
    if (!entry.isDirectory()) return [];
    const isGroup = entry.name.startsWith('(');
    return adminPageRoutes(path.join(dir, entry.name), isGroup ? prefix : `${prefix}/${entry.name}`);
  });
}

// Pages deliberately outside the 5 groups (settings via avatar menu, dev-only pages).
const UNGROUPED = ['/settings/', '/test-'];

describe('NAV_GROUPS', () => {
  it('has exactly the 5 groups in order', () => {
    expect(NAV_GROUPS.map((g) => g.label)).toEqual(['Dashboard', 'Harian', 'Mingguan', 'Quests', 'Kuartalan']);
  });

  it("each group's href is one of its own tabs", () => {
    for (const g of NAV_GROUPS) {
      expect(g.tabs.map((t) => t.href)).toContain(g.href);
    }
  });

  it('no page belongs to two tabs', () => {
    expect(new Set(ALL_NAV_HREFS).size).toBe(ALL_NAV_HREFS.length);
  });

  it('every (admin) page is reachable from a group (no orphans)', () => {
    const orphans = adminPageRoutes()
      .filter((r) => !UNGROUPED.some((p) => r.startsWith(p)))
      .filter((r) => findActiveTab(r) === null);
    expect(orphans).toEqual([]);
  });
});

describe('findActiveTab', () => {
  const at = (p: string) => {
    const hit = findActiveTab(p);
    return hit ? `${hit.group.id}/${hit.tab.label}` : null;
  };

  it('maps merged pages to their group tab', () => {
    expect(at('/execution/daily-sync')).toBe('harian/Daily Sync');
    expect(at('/planning/best-week')).toBe('mingguan/Best Week');
    expect(at('/quests/work-quests')).toBe('quests/Work Quests');
    expect(at('/planning/vision')).toBe('kuartalan/Vision');
  });

  it('matches both habit sub-routes to Habit Tracker', () => {
    expect(at('/habits/today')).toBe('harian/Habit Tracker');
    expect(at('/habits/monthly')).toBe('harian/Habit Tracker');
  });

  it('matches nested routes by prefix without confusing siblings', () => {
    expect(at('/planning/12-week-sync/history')).toBe('kuartalan/12 Week Sync');
    expect(at('/planning/12-week-quests')).toBe('kuartalan/12 Week Quests');
  });

  it('returns null for pages outside the groups', () => {
    expect(at('/settings/profile')).toBeNull();
    expect(at('/habits-archive')).toBeNull();
  });
});
```

Jalankan:

```bash
npx vitest run src/lib/__tests__/navigation.test.ts
```

Harapan: **FAIL** — `Failed to resolve import "../navigation"`.

### 1b. GREEN — implementasi

**File baru:** `src/lib/navigation.ts`

```ts
// Single source for the 5 nav groups; tabs link existing routes, so no URL moves.
// Kept free of JSX/icons (icons are .svg imports Vitest cannot load) — see components/layouts/navIcons.tsx.

export type NavGroupId = 'dashboard' | 'harian' | 'mingguan' | 'quests' | 'kuartalan';

export type NavTab = {
  label: string;
  href: string;
  /** Path prefix that marks this tab active; defaults to href. */
  match?: string;
};

export type NavGroup = {
  id: NavGroupId;
  label: string;
  /** Where the sidebar/bottom-nav entry lands. Must be one of the tabs. */
  href: string;
  tabs: NavTab[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    tabs: [{ label: 'Dashboard', href: '/dashboard' }],
  },
  {
    id: 'harian',
    label: 'Harian',
    href: '/execution/daily-sync',
    tabs: [
      { label: 'Daily Sync', href: '/execution/daily-sync' },
      { label: 'Habit Tracker', href: '/habits/today', match: '/habits' },
    ],
  },
  {
    id: 'mingguan',
    label: 'Mingguan',
    href: '/execution/weekly-sync',
    tabs: [
      { label: 'Weekly Sync', href: '/execution/weekly-sync' },
      { label: 'Best Week', href: '/planning/best-week' },
      { label: 'Brain Dump', href: '/execution/brain-dump' },
    ],
  },
  {
    id: 'quests',
    label: 'Quests',
    href: '/quests/side-quests',
    tabs: [
      { label: 'Side Quests', href: '/quests/side-quests' },
      { label: 'Work Quests', href: '/quests/work-quests' },
      { label: 'Daily Quests', href: '/quests/daily-quests' },
    ],
  },
  {
    id: 'kuartalan',
    label: 'Kuartalan',
    href: '/planning/main-quests',
    tabs: [
      { label: 'Vision', href: '/planning/vision' },
      { label: '12 Week Quests', href: '/planning/12-week-quests' },
      { label: 'Main Quests', href: '/planning/main-quests' },
      { label: '12 Week Sync', href: '/planning/12-week-sync' },
    ],
  },
];

export const ALL_NAV_HREFS: string[] = NAV_GROUPS.flatMap((g) => g.tabs.map((t) => t.href));

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function findActiveTab(pathname: string): { group: NavGroup; tab: NavTab } | null {
  for (const group of NAV_GROUPS) {
    for (const tab of group.tabs) {
      if (isUnder(pathname, tab.match ?? tab.href)) return { group, tab };
    }
  }
  return null;
}
```

Jalankan ulang:

```bash
npx vitest run src/lib/__tests__/navigation.test.ts
```

Harapan: **PASS**, 8 tes. Kalau tes "no orphans" gagal, isi array `orphans` menyebut halaman yang
belum dipetakan — petakan ke grup yang benar sesuai tabel desain K3, **jangan** tambah ke `UNGROUPED`
tanpa tanya user.

## Task 2 — `src/components/layouts/navIcons.tsx`

**File baru:**

```tsx
import React from "react";
import { GridIcon, TaskIcon, CalenderIcon, ListIcon, PieChartIcon } from "@/lib/icons";
import type { NavGroupId } from "@/lib/navigation";

export const NAV_ICONS: Record<NavGroupId, React.ReactNode> = {
  dashboard: <GridIcon />,
  harian: <TaskIcon />,
  mingguan: <CalenderIcon />,
  quests: <ListIcon />,
  kuartalan: <PieChartIcon />,
};
```

(Semua ikon sudah diekspor `src/lib/icons.ts:62-70`.)

## Task 3 — Tulis ulang `src/components/layouts/AppSidebar.tsx`

Seluruh isi file (713 baris) diganti. Yang dipertahankan dari versi lama:
- kelas `<aside>` (lama baris 451-460) dan handler hover (461-462) — **salin persis**;
- blok logo (lama baris 464-491) — **salin persis**;
- perilaku klik: Ctrl/Cmd+klik buka tab baru, klik biasa → spinner + `router.push` (lama 339-345, 616-627);
- prefetch semua rute menu (lama 630-637).

Yang dibuang: `SubNavItem`/`Submenu*`/`MenuItem(s)`/`SidebarContent`, state `openSubmenu`/`subMenuHeight`,
`trackingNav` (rute `/aw-quests` & `/reports` tidak ada), `settingsNav` (settings tetap di menu avatar
`UserDropdown.tsx:53,78`).

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { useSidebar } from "@/stores/sidebarStore";
import Spinner from "@/components/ui/spinner/Spinner";
import { ALL_NAV_HREFS, NAV_GROUPS, findActiveTab } from "@/lib/navigation";
import { NAV_ICONS } from "@/components/layouts/navIcons";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  const activeGroupId = findActiveTab(pathname)?.group.id;
  const showText = isExpanded || isHovered || isMobileOpen;

  useEffect(() => {
    setLoadingHref(null);
  }, [pathname]);

  useEffect(() => {
    ALL_NAV_HREFS.forEach((href) => router.prefetch(href));
  }, [router]);

  const handleNavigation = useCallback(
    (href: string) => {
      if (href === pathname) return;
      setLoadingHref(href);
      router.push(href);
    },
    [pathname, router]
  );

  return (
    <aside
      className={/* SALIN PERSIS className lama baris 451-460 */}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* SALIN PERSIS blok logo lama baris 464-491 */}

      <nav aria-label="Navigasi utama" className="flex flex-col overflow-y-auto no-scrollbar">
        <ul className="flex flex-col gap-2">
          {NAV_GROUPS.map((group) => {
            const isActive = group.id === activeGroupId;
            const isLoading = loadingHref === group.href;
            return (
              <li key={group.id}>
                <Link
                  href={group.href}
                  data-testid={`sidebar-group-${group.id}`}
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={isLoading}
                  onClick={(e) => {
                    // Ctrl/Cmd+click opens a new tab natively.
                    if (e.ctrlKey || e.metaKey) return;
                    e.preventDefault();
                    handleNavigation(group.href);
                  }}
                  className={`group ${isActive ? "menu-item-active" : "menu-item-inactive"} ${
                    showText
                      ? "menu-item"
                      : "flex flex-col items-center gap-1 rounded-lg py-2 font-medium"
                  } ${isLoading ? "opacity-70 cursor-wait pointer-events-none" : ""}`}
                >
                  <span className={isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                    {isLoading ? <Spinner size={16} /> : NAV_ICONS[group.id]}
                  </span>
                  <span className={showText ? "menu-item-text" : "text-[10px] leading-none"}>
                    {group.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AppSidebar;
```

Catatan: dua komentar `/* SALIN PERSIS ... */` di atas adalah instruksi, bukan kode — ganti dengan
teks aslinya dari `git show HEAD:src/components/layouts/AppSidebar.tsx`.

Cek cepat:

```bash
rtk proxy grep -c "subItems\|trackingNav\|settingsNav" src/components/layouts/AppSidebar.tsx
```

Harapan: `0`.

## Task 4 — `src/components/layouts/BottomNavigation.tsx` jadi 5 grup

- Hapus `interface NavItem` + `const navItems` (baris 10-42) dan import ikon baris 7.
- Tambah import:

```tsx
import { NAV_GROUPS, findActiveTab } from "@/lib/navigation";
import { NAV_ICONS } from "@/components/layouts/navIcons";
```

- Prefetch (baris 65-69) jadi:

```tsx
  useEffect(() => {
    NAV_GROUPS.forEach((group) => router.prefetch(group.href));
  }, [router]);
```

- Di render, ganti `navItems.map((item) => {` s.d. hitungan `isActive` (baris 81-85) dengan:

```tsx
          {NAV_GROUPS.map((group) => {
            const isActive = findActiveTab(pathname)?.group.id === group.id;
            const isRouteLoading = isLoadingRoute(group.href);
```

- Di sisa blok: `item.href` → `group.href` (key, onClick, loading), `isActive ? item.activeIcon : item.icon`
  → `NAV_ICONS[group.id]`, `item.label` → `group.label`. Tambah `data-testid={\`bottom-nav-${group.id}\`}`
  pada `<button>`.

Cek:

```bash
rtk proxy grep -n "navItems\|activeIcon\|/habits/" src/components/layouts/BottomNavigation.tsx
```

Harapan: tidak ada output.

## Task 5 — Judul header dari config (`src/components/layouts/AppHeader.tsx`)

Ganti seluruh fungsi `PageTitle` (baris 12-101, termasuk `getPageTitle` dan `needsBackButton`) dengan:

```tsx
// Page title = active tab label from the nav config.
function PageTitle() {
  const pathname = usePathname();
  const title = findActiveTab(pathname)?.tab.label ?? "Better Planner";
  return (
    <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center md:text-left flex-1">
      {title}
    </h1>
  );
}
```

Tambah import `import { findActiveTab } from "@/lib/navigation";`. `useState`/`useEffect` tetap dipakai
`AppHeader` (baris ~167-185) — jangan hapus importnya. Tombol back mobile ikut hilang (disengaja,
lihat desain K6).

## Task 6 — Verifikasi Fase 1

```bash
npm run test:run
npm run type-check
```

Harapan: semua tes PASS; type-check 0 error.

Manual (`npm run dev`, http://localhost:5100):

| Cek | Harapan |
|---|---|
| Desktop, sidebar tertutup | 5 item, tiap ikon ada label kecil di bawahnya: Dashboard, Harian, Mingguan, Quests, Kuartalan. Tidak ada lagi "EXEC/PLAN/QUES" |
| Hover sidebar / toggle terbuka | ikon + label sebaris, sama gaya `menu-item` lama |
| Buka `/habits/monthly` | item **Harian** aktif; judul header "Habit Tracker" |
| Buka `/planning/12-week-sync/history` | **Kuartalan** aktif; judul "12 Week Sync" |
| Buka `/planning/best-week` | **Mingguan** aktif; judul "Best Week" (dulu "Better Planner") |
| Klik **Kuartalan** | mendarat di `/planning/main-quests` dengan spinner singkat |
| Cmd+klik **Quests** | tab browser baru |
| Mobile 375px | bottom nav 5 item berlabel, tidak ada label terpotong parah; header tanpa tombol back |
| `/settings/profile` | tidak ada grup aktif; tetap bisa dibuka dari avatar |

**CHECKPOINT 1** — berhenti, tampilkan `git status` + `git diff --stat`, tunggu user. Fase 1 boleh
di-commit sendiri:

```
feat(nav): sidebar & bottom nav 5 grup berlabel (app-5r0j fase 1)

fixes #23

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

(Kalau Fase 1 & 2 di-commit bersama, pakai commit di akhir plan saja.)

---

# FASE 2 — Tab di dalam grup

## Task 7 — `src/components/layouts/SectionTabs.tsx`

**File baru:**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActiveTab } from "@/lib/navigation";

// Tab bar for the active nav group; hidden for single-page groups (Dashboard) and ungrouped pages.
export default function SectionTabs() {
  const pathname = usePathname();
  const active = findActiveTab(pathname);
  if (!active || active.group.tabs.length < 2) return null;

  return (
    <nav
      aria-label={active.group.label}
      className="mb-4 md:mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar"
    >
      <div className="flex">
        {active.group.tabs.map((tab) => {
          const isActive = tab === active.tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-testid={`section-tab-${tab.href.split("/").pop()}`}
              aria-current={isActive ? "page" : undefined}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? "border-brand-500 text-brand-500 dark:text-brand-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

testid yang dihasilkan: `section-tab-daily-sync`, `section-tab-today`, `section-tab-weekly-sync`,
`section-tab-best-week`, `section-tab-brain-dump`, `section-tab-side-quests`, `section-tab-work-quests`,
`section-tab-daily-quests`, `section-tab-vision`, `section-tab-12-week-quests`, `section-tab-main-quests`,
`section-tab-12-week-sync`.

## Task 8 — Pasang di `src/app/(admin)/layout.tsx`

- Import: `import SectionTabs from "@/components/layouts/SectionTabs";`
- Baris 38-40 jadi:

```tsx
          <div className={`p-4 mx-auto ${!isTwelveWeeksGoals ? "max-w-[var(--breakpoint-2xl)]" : ""} md:p-6 pb-28 md:pb-6`}>
            <SectionTabs />
            {children}
          </div>
```

## Task 9 — Sub-tab Habits jadi pil (`src/app/(admin)/habits/HabitsTabLayout.tsx`)

Hanya kelas, logika tetap. Baris 21-22:

```tsx
      <div className="px-4 pb-3">
        <nav className="inline-flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1" aria-label="Habit views">
```

Kelas `Link` (baris 29-33):

```tsx
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
```

## Task 10 — E2E navigasi `tests/e2e/navigation.spec.ts`

Spec yang sudah ada **tidak perlu diubah** (URL tidak berubah; `dashboard.spec.ts` masih 11 ubin).
Tambah satu spec, pola login ikut `dashboard.spec.ts:1-15`:

```ts
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Navigation groups & tabs', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('sidebar shows 5 labelled groups', async ({ page }) => {
    for (const label of ['Dashboard', 'Harian', 'Mingguan', 'Quests', 'Kuartalan']) {
      await expect(page.locator('aside').getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.locator('[data-testid="section-tab-daily-sync"]')).toHaveCount(0); // Dashboard has no tab bar
  });

  test('group -> default tab -> sibling tab', async ({ page }) => {
    await page.locator('[data-testid="sidebar-group-mingguan"]').click();
    await page.waitForURL(/\/execution\/weekly-sync/, { timeout: 45000 });
    await page.locator('[data-testid="section-tab-best-week"]').click();
    await page.waitForURL(/\/planning\/best-week/, { timeout: 45000 });
    await expect(page.locator('[data-testid="sidebar-group-mingguan"]')).toHaveAttribute('aria-current', 'page');
  });

  test('old URL lands on the right tab', async ({ page }) => {
    await page.goto('/habits/monthly', { timeout: 60000 });
    await expect(page.locator('[data-testid="section-tab-today"]')).toHaveAttribute('aria-current', 'page');
  });
});
```

Jangan jalankan suite E2E penuh. Sebelum menjalankan spec ini, pre-warm route (cold compile Next.js):

```bash
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:5100/execution/weekly-sync
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:5100/planning/best-week
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:5100/habits/monthly
npx playwright test tests/e2e/navigation.spec.ts --reporter=list
```

Harapan: 3 passed. Kalau dev server tidak jalan, lewati dan catat "E2E belum dijalankan" di laporan.

## Task 11 — Dokumentasi `docs/claude/architecture-patterns.md`

1. Di pohon "Application Structure" (baris 7-36), tambah di bawah `components/`:

```
│   ├── layouts/                  # AppSidebar, BottomNavigation, SectionTabs, navIcons
```

   dan di bawah `lib/`:

```
│   ├── navigation.ts             # NAV_GROUPS: 5 grup nav + tab (sumber tunggal)
```

2. Tambah section baru tepat sebelum `## 📄 Metadata Standard` (baris 241):

```md
## 🧭 Navigation (5 grup + tab)

Sumber tunggal: `src/lib/navigation.ts` → `NAV_GROUPS` (Dashboard · Harian · Mingguan · Quests · Kuartalan).
Sidebar, bottom nav, tab bar (`SectionTabs` di `(admin)/layout.tsx`), judul header, dan prefetch semuanya membaca config ini.

- Tab = link antar rute yang sudah ada. **URL tidak dipindah** — jangan buat folder rute baru untuk grup.
- Halaman `(admin)` baru **wajib** ditambahkan sebagai tab di grup yang tepat; `src/lib/__tests__/navigation.test.ts` gagal kalau ada halaman yatim (pengecualian: `settings/*`, `test-*`).
- Sub-route (mis. `/habits/monthly`) ikut aktif lewat `match` atau prefix `href/`.
- Config bebas JSX/ikon (ikon = impor .svg, tidak bisa di-load Vitest); ikon di `components/layouts/navIcons.tsx`.
```

3. Di tabel "Metadata Standard", baris ketiga: tetap, tapi tambahkan kalimat di bawah tabel:
   `Tab bar grup (SectionTabs) dirender di (admin)/layout.tsx, bukan per section — layout section cukup urus metadata.`

## Task 12 — Verifikasi akhir

```bash
npm run test:run
npm run type-check
```

Harapan: semua PASS, 0 error type.

Manual per halaman (`npm run dev`, 5100) — tab bar tampil, tab aktif benar, isi halaman tidak berubah:

| Halaman | Tab bar | Tab aktif | Cek isi tetap jalan |
|---|---|---|---|
| `/dashboard` | tidak ada | — | grafik + 11 ubin |
| `/execution/daily-sync` | Daily Sync · Habit Tracker | Daily Sync | timer, kalender **Plan/Both/Actual**, baris habit + pengingat "N kebiasaan lain" |
| klik pengingat habit di Daily Sync | ″ | Habit Tracker | mendarat `/habits/today` |
| `/habits/today` → pil Monthly | ″ | Habit Tracker | pil Today/Monthly berfungsi, grid bulanan |
| `/execution/weekly-sync` | Weekly Sync · Best Week · Brain Dump | Weekly Sync | drag-drop jadwal |
| `/planning/best-week` | ″ | Best Week | grid Best Week |
| `/execution/brain-dump` | ″ | Brain Dump | `?q=` otomatis ditambah QuarterSelector |
| `/quests/side-quests` · work · daily | Side · Work · Daily | sesuai | tambah/edit quest |
| `/planning/vision` | Vision · 12 Week Quests · Main Quests · 12 Week Sync | Vision | quarter selector tersembunyi (tetap) |
| `/planning/12-week-quests` | ″ | 12 Week Quests | lebar penuh tetap, redirect `?q=` tetap |
| `/planning/main-quests` | ″ | Main Quests | |
| `/planning/12-week-sync/history` | ″ | 12 Week Sync | link balik ke 12 Week Sync |
| `/settings/profile` | tidak ada | — | |
| Mobile 375px, `/planning/vision` | tab bar geser horizontal, tanpa scroll halaman ke samping | | bottom nav Kuartalan aktif |
| Dark mode | tab & pil terbaca | | |

**CHECKPOINT 2** — tampilkan `git status` + `git diff --stat`, tunggu user.

## Commit

```
feat(nav): sidebar 5 grup berlabel + halaman sejenis jadi tab (app-5r0j)

Dashboard · Harian · Mingguan · Quests · Kuartalan dari satu config
src/lib/navigation.ts. URL lama tidak berubah; tab = link antar rute.

fixes #23

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CLAUDE.md Check

- [ ] **Pattern baru: nav config tunggal** → Task 11 memperbarui `docs/claude/architecture-patterns.md`
      (App Structure + section Navigation + catatan Metadata Standard). CLAUDE.md sendiri cukup satu
      baris pointer di "Architecture Quick Reference" bila user setuju:
      `**Navigation**: 5 grup + tab dari src/lib/navigation.ts. READ architecture-patterns.md → "Navigation".`
- [ ] Route baru? Tidak (disengaja — lihat desain K1).
- [ ] Tabel DB baru? Tidak.
- [ ] Permission pattern baru? Tidak.
- [ ] `docs/products/roadmap.md` — centang item navigasi kalau ada, saat `bd close`.
