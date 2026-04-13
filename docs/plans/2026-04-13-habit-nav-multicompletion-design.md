# Design: Habit Today Day Navigation + Multi-Completion Daily Target

**Date:** 2026-04-13
**Issues:** bp-uv4 (GH-#10), bp-0df (GH-#11)

---

## Context & Problem

1. **Day Navigation**: Today view di `/habits/today` saat ini ter-lock ke tanggal hari ini. Mobile user tidak bisa lihat/edit riwayat hari lampau tanpa buka Monthly Grid yang lebih berat.

2. **Multi-Completion**: Sistem saat ini binary (done/not done per hari). Ada `UNIQUE(habit_id, date)` constraint yang enforce satu completion per hari. User tidak bisa track habit yang dilakukan berkali-kali sehari (minum air 8x, push-up 3 set, dll).

---

## Architecture Decisions

### Fitur 1: Day Navigation

**Decision: Client-side date state, no URL routing**

- `selectedDate` disimpan di `useState` di `today/page.tsx`
- Tidak pakai URL param (`?date=...`) — lebih sederhana, tidak perlu router handling
- Default ke hari ini (WIB timezone)
- Future date: tidak bisa navigasi (tombol `>` disabled kalau `selectedDate === todayDate`)
- Past date: bisa toggle/edit (sesuai pilihan user)

**SWR key update**: `useHabitCompletions(year, month)` sudah di-key by year+month. Kalau user navigasi lintas bulan, SWR otomatis fetch bulan baru. No extra work needed.

**Streak/stats**: `useMonthlyStats` tetap dihitung per bulan dari `selectedDate`, bukan hanya bulan ini.

---

### Fitur 2: Multi-Completion Daily Target

**Decision: Multiple rows per day (bukan count column)**

Dua opsi dipertimbangkan:

| Opsi | Kelebihan | Kekurangan |
|------|-----------|-----------|
| Tambah `count` column di `habit_completions` | Satu row per hari, simple query | Perlu update logic (bukan insert/delete), query lebih kompleks |
| Multiple rows per day (drop UNIQUE constraint) | Konsisten dengan existing insert/delete pattern, optimistic update tetap sama | Query count per day butuh GROUP BY atau filter |

**Pilihan: Multiple rows per day** — lebih konsisten dengan arsitektur existing. `insertCompletion` dan `deleteCompletion` tidak perlu diubah signifikan. `buildCompletionSet` tetap bekerja untuk streak.

**`daily_target` column di `habits` table** — menentukan berapa kali per hari habit perlu dikerjakan. Default 1 (binary behavior, UI tidak berubah).

**Streak logic**: Streak dihitung hanya kalau `count >= daily_target` untuk hari tersebut. Update `buildCompletionSet` untuk handle ini — perlu tahu daily_target per habit.

**Dots UI cap**: Maksimum 10 dots ditampilkan. Kalau `daily_target > 10`, hanya tampil teks `count/target`.

---

## What Goes Where

```
DB Layer:
  supabase/migrations/          ← migration SQL baru

Types:
  src/types/habit.ts            ← tambah daily_target di Habit + HabitFormInput

Data Layer (Actions):
  habits/queries.ts             ← daily_target di insert/update (auto via select *)
  habits/logic.ts               ← parse daily_target di toHabit + parseHabitFormInput
  completions/queries.ts        ← tambah countCompletionsForDate, deleteLastCompletion
  completions/actions.ts        ← tambah incrementCompletion, decrementCompletion
  completions/logic.ts          ← update buildCompletionSet untuk handle daily_target

Hook Layer:
  hooks/useHabitCompletions.ts  ← tambah getCount, increment, decrement

UI Layer:
  today/page.tsx                ← selectedDate state + day navigation header
  components/TodayHabitList.tsx ← props baru: selectedDate, getCount, onIncrement, onDecrement
  components/TodayHabitItem.tsx ← counter UI (dots + +/- buttons) untuk daily_target > 1
  components/HabitForm.tsx      ← field daily_target (number input)
  components/HabitFormModal.tsx ← pass daily_target through
```

---

## Clash Resolution

**`isCompleted` signature**: Perlu tambah `dailyTarget` parameter agar tahu kapan habit dianggap "selesai".
```typescript
// Before
isCompleted(habitId: string, date: string): boolean

// After
isCompleted(habitId: string, date: string, dailyTarget?: number): boolean
// dailyTarget defaults to 1 for backward compat
```

**`toggleCompletion` di monthly view**: Monthly view masih pakai toggle binary. Karena habits dengan `daily_target > 1` masih bisa punya completions, toggle di monthly view akan add/remove satu row saja. Ini acceptable — monthly view tidak menampilkan count, hanya "ada completion atau tidak".

**`buildCompletionSet`**: Signature berubah dari `(completions)` menjadi `(completions, habits)` agar bisa filter tanggal yang sudah fully completed. Dipanggil di `useHabitCompletions` yang sudah punya akses ke `habits` via `useHabits`.

Alternatif: tetap buat set dari semua completions (≥1), dan handle `isCompleted(dailyTarget)` di sisi caller. Ini lebih sederhana dan tidak perlu pass habits ke logic layer. **Pilihan ini yang diimplementasikan** — `buildCompletionSet` tetap sederhana, `isCompleted` di hook yang handle dailyTarget check.

---

## Out of Scope

- Weekly/flexible frequency habits — tidak diubah, tetap binary
- Undo/redo history
- Completion notes untuk multi-completion
- Monthly view counter display (hanya Today view)
