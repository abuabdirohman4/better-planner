# Delete Activity Log — Design

## Problem

User tidak punya cara untuk menghapus activity log yang corrupt (misal dari double-recording) tanpa akses langsung ke database. Setelah fix double-recording, masih ada 82 log lama yang perlu dibersihkan — dan untuk kejadian serupa di masa depan, user perlu kontrol manual.

---

## Scope

Delete **individual** activity log dari UI. Tidak ada bulk delete (YAGNI — user jarang perlu hapus banyak sekaligus, dan bulk delete lebih berisiko).

---

## Solusi

Ikuti pattern 3-layer yang sudah ada di project:
1. **Query function** (pure DB, testable) — `deleteActivityLogQuery` di `queries.ts`
2. **Server action** (`"use server"`) — `deleteActivityLog` di `actions.ts`
3. **UI** — delete button di dua tempat yang sudah ada

---

## Architectural Decisions

**Mengapa delete button di dua tempat?**
- `CalendarTaskDetail` modal: sudah ada sebagai titik entry untuk Calendar view. Paling natural untuk hapus karena user sudah melihat detail log.
- `CollapsibleLogItem` (Timeline/Grouped): tampil sebagai list, butuh cara inline tanpa buka modal.
- Keduanya pakai handler `handleDeleteLog` yang sama dari `ActivityLog.tsx` — tidak ada duplikasi logic.

**Konfirmasi dua-step vs Modal konfirmasi terpisah?**
- Modal terpisah = komponen baru, overhead lebih besar
- Dua-step inline (klik trash → "Hapus | Batal") sudah cukup untuk aksi irreversible ini, lebih ringan
- Pattern ini konsisten dengan pattern yang umum di mobile apps

**Mengapa tidak tambah `onDelete` prop ke `CalendarTaskDetail`?**
- `CalendarTaskDetail` sudah punya `onClose` callback. Delete bisa langsung call server action di dalam komponen, kemudian call `triggerRefresh()` dari `useActivityStore` + `onClose()`.
- Tidak perlu prop tambahan — lebih simple.

**RLS safety:**
- `deleteActivityLogQuery` selalu filter `.eq('user_id', userId)` sebagai double-check meskipun RLS sudah enforce ini di DB level.

**Revalidation setelah delete:**
- `revalidatePath('/execution/daily-sync')` di server action untuk Next.js cache
- `triggerRefresh()` dari `useActivityStore` untuk SWR cache di client

**File yang tidak berubah:**
- `useActivityLogs` hook — tidak perlu diubah, revalidasi terjadi via `triggerRefresh()`
- `CalendarView.tsx`, `CalendarBlock.tsx` — tidak perlu diubah
- Types `ActivityLogItem` — tidak perlu diubah
