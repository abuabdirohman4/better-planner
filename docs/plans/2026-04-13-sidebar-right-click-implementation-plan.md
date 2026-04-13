# Implementation Plan: Sidebar Right-Click Open in New Tab

**Date:** 2026-04-13
**Beads:** bp-s8z
**GitHub:** abuabdirohman4/better-planner#5
**Design:** `docs/plans/2026-04-13-sidebar-right-click-design.md`

---

## Pre-flight Check

```bash
# Verifikasi lokasi kode target
grep -n "nav.path" src/components/layouts/AppSidebar.tsx | head -20
# Expected: line ~320-348 ada block `if (nav.path) { ... <button ... }`

grep -n "import.*Link" src/components/layouts/AppSidebar.tsx
# Expected: ada baris `import Link from 'next/link'`
```

---

## Task 1 — Ganti `<button>` menjadi `<Link>` di `MenuItem`

**File:** `src/components/layouts/AppSidebar.tsx`

**Cari block ini (lines ~320-348):**
```tsx
  if (nav.path) {
    const isRouteLoading = isLoading(nav.path);
    const isRouteActive = isActive(nav.path);

    return (
      <li key={nav.name || index}>
        <button
          onClick={() => onNavigate(nav.path!)}
          disabled={isRouteLoading}
          className={`menu-item group ${
            isRouteActive ? "menu-item-active" : "menu-item-inactive"
          } ${isRouteLoading ? "opacity-70 cursor-wait" : ""}`}
        >
          <span
            className={
              isRouteActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
            }
          >
            {isRouteLoading ? (
              <Spinner size={16} />
            ) : (
              nav.icon ? nav.icon : null
            )}
          </span>
          {showText && nav.name ? <span className="menu-item-text">{nav.name}</span> : null}
        </button>
      </li>
    );
  }
```

**Ganti dengan:**
```tsx
  if (nav.path) {
    const isRouteLoading = isLoading(nav.path);
    const isRouteActive = isActive(nav.path);

    return (
      <li key={nav.name || index}>
        <Link
          href={nav.path}
          onClick={(e) => {
            // Biarkan browser handle Ctrl+click / Cmd+click / middle-click secara native
            if (e.ctrlKey || e.metaKey || e.button === 1) return;
            e.preventDefault();
            onNavigate(nav.path!);
          }}
          className={`menu-item group ${
            isRouteActive ? "menu-item-active" : "menu-item-inactive"
          } ${isRouteLoading ? "opacity-70 cursor-wait pointer-events-none" : ""}`}
          aria-disabled={isRouteLoading}
        >
          <span
            className={
              isRouteActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
            }
          >
            {isRouteLoading ? (
              <Spinner size={16} />
            ) : (
              nav.icon ? nav.icon : null
            )}
          </span>
          {showText && nav.name ? <span className="menu-item-text">{nav.name}</span> : null}
        </Link>
      </li>
    );
  }
```

**Checkpoint Task 1:** File tersimpan, tidak ada syntax error.

---

## Task 2 — Type-check

```bash
npm run type-check
```

**Expected output:** No errors. Jika ada error, periksa apakah `Link` dari `next/link` sudah terimport di file.

---

## Task 3 — Manual Testing Checklist

```bash
npm run dev
```

Buka http://localhost:3000, login, lalu verifikasi:

- [ ] Klik kanan pada menu item (Dashboard, Daily Sync, dll.) → muncul context menu browser dengan opsi "Open Link in New Tab"
- [ ] Klik biasa → navigasi normal + loading spinner tetap muncul
- [ ] Ctrl+Click (Windows) atau Cmd+Click (Mac) → tab baru terbuka
- [ ] Middle-click → tab baru terbuka
- [ ] Active state (highlight menu item) masih berfungsi
- [ ] Submenu items tidak terpengaruh (masih berfungsi normal)

---

## Commit Message

```
feat(sidebar): enable right-click open in new tab support (bp-s8z, fixes #5)

Replace <button> with <Link> in MenuItem component so browser natively
recognizes navigation items. Ctrl/Cmd/middle-click now open new tabs.
Regular click still triggers onNavigate() with loading spinner.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Close Issue

```bash
bd close bp-s8z
```
