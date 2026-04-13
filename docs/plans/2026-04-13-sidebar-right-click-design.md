# Design: Sidebar Right-Click Open in New Tab

**Date:** 2026-04-13
**Beads:** bp-s8z
**GitHub:** abuabdirohman4/better-planner#5

---

## Problem

Menu item di sidebar menggunakan `<button>` dengan `onClick → router.push()`. Browser tidak mengenali elemen ini sebagai navigasi link, sehingga:
- Klik kanan → tidak ada opsi "Open link in new tab"
- Ctrl+Click / Cmd+Click → tidak membuka tab baru
- Middle-click → tidak membuka tab baru

## Root Cause

Di `AppSidebar.tsx`, `MenuItem` component (lines ~320-348) merender nav item sebagai `<button>` bukan `<Link>`. Submenu items (`SubmenuItem`) sudah benar menggunakan `<Link>`.

## Decision

**Ganti `<button>` → `<Link>` di `MenuItem`** untuk nav items dengan `path`.

### Kenapa ini solusi yang tepat?

| Opsi | Pro | Con |
|------|-----|-----|
| Ganti ke `<Link>` | Native browser support, semantik benar, no extra code | Perlu handle onClick agar loading spinner tetap jalan |
| Tambah `onContextMenu` handler | Tidak ubah struktur | Hack, tidak cover middle-click, tidak semantic |
| Bungkus dengan wrapper `<a>` | Workaround | Double element, styling kompleks |

`<Link>` adalah solusi yang paling clean dan semantik benar.

## Behavior yang Dipertahankan

| Skenario | Behavior sebelum | Behavior sesudah |
|---|---|---|
| Klik biasa | `onClick → router.push()` + loading spinner | `e.preventDefault() → onNavigate()` + loading spinner |
| Klik kanan → Open in new tab | ❌ Tidak bisa | ✅ Native browser context menu |
| Ctrl+Click / Cmd+Click | ❌ Tidak buka tab baru | ✅ Buka tab baru |
| Middle-click | ❌ Tidak buka tab baru | ✅ Buka tab baru |
| Loading state | `disabled` prop | `pointer-events-none` + `aria-disabled` |

## Impact

- **1 file** dimodifikasi: `src/components/layouts/AppSidebar.tsx`
- **~15 lines** changed (hanya bagian `if (nav.path)` di `MenuItem`)
- Tidak ada perubahan database/API/store
- `Link` import sudah ada di file — tidak perlu tambah import
- BottomNavigation (mobile) tidak diubah dalam scope ini
