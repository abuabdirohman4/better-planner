# Fix Timer Double Activity Log — Design

## Problem

Activity log tercatat 2x untuk satu sesi timer. Database dikonfirmasi: **43 grup duplikat, 82 log berlebih** sejak Oktober 2025. Bug terjadi sebelum fix syntheticStartTime, dan fix tersebut memperparah frekuensinya.

---

## Root Cause

### Race Condition Dua Path Completion

Saat app dibuka setelah close/minimize, dua path independen trigger `completeTimerSession()` dalam ~1 detik:

**Path A — `useRecovery`:**
1. `getActiveTimerSession()` → session `FOCUSING` ditemukan
2. `updateSessionWithActualTime()` → server hitung `elapsed >= target` → `shouldComplete = true`
3. `completeTimerSession(sessionId)` dipanggil di server → INSERT activity_log
4. `completeTimerFromDatabase()` dipanggil di frontend

**Path B — `useGlobalTimer` interval (~1 detik kemudian):**
1. `resumeFromDatabase()` set `syntheticStartTime = now - currentDuration`
2. Interval tick: `elapsed = now - syntheticStartTime = currentDuration ≈ targetDuration`
3. `state.timerState` masih `'FOCUSING'` (Path A belum selesai update state)
4. `completeTimerFromDatabase()` dipanggil lagi → `completeTimerSession()` → INSERT activity_log kedua

### Mengapa Lock yang Ada Tidak Cukup

| Mekanisme | Masalah |
|-----------|---------|
| Zustand `completionInProgress` flag | Hanya blok frontend state update, tidak blok server action |
| DB check `SELECT ... WHERE start_time = ?` | Race condition: kedua concurrent call SELECT sebelum INSERT selesai, keduanya dapat `null`, keduanya INSERT |
| 5-detik window `lastCompletedTaskId` | Path B bisa lolos jika `timerState` sudah reset ke `IDLE` sebelum 5 detik |

---

## Solusi

### Layer 1: DB UNIQUE Constraint (paling kuat, safety net utama)

Tambah constraint di level database. Ini membuat INSERT kedua **gagal atomik** tanpa perlu application-level lock:

```sql
ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_unique_per_session
UNIQUE (user_id, task_id, start_time);
```

Pilih kolom `(user_id, task_id, start_time)` karena `start_time` adalah timestamp sesi yang unik per task per user. `end_time` tidak dipakai karena setiap call menghasilkan `endTime = new Date()` yang berbeda.

Perlu cleanup data duplikat dulu sebelum apply constraint.

### Layer 2: Immediate State Reset (tutup jendela race condition)

`completeTimerFromDatabase` saat ini set `timerState = 'IDLE'` di **akhir** setelah async operations (~500ms-1s). Selama jeda itu, `useGlobalTimer` masih melihat `FOCUSING` dan trigger Path B.

Fix: pindahkan `set({ timerState: 'IDLE', ... })` ke **awal** sebelum async, synchronous. Ini menutup jendela race condition dari ~1000ms menjadi 0ms.

### Layer 3: Graceful Error Handling (defense in depth)

Setelah constraint ditambahkan, INSERT kedua akan throw error PostgreSQL `23505 (unique_violation)`. Handle sebagai "already done" bukan error fatal.

---

## Architectural Decisions

**Kenapa UNIQUE constraint, bukan application-level lock?**
- Application-level lock (mutex, Redis, dll) memerlukan koordinasi antar instance dan bisa stale jika process crash
- DB UNIQUE constraint adalah atomic dan tidak bisa di-bypass oleh race condition apapun
- Simpler: tidak perlu infra tambahan

**Kenapa tidak gunakan upsert/`ON CONFLICT DO NOTHING`?**
- Bisa dipakai, tapi error handling lebih eksplisit dan mudah di-debug
- `ON CONFLICT DO NOTHING` menyembunyikan duplicate secara silent tanpa log
- Error code `23505` lebih mudah di-trace di Supabase logs

**Kenapa cleanup dulu sebelum constraint?**
- PostgreSQL tidak bisa tambah UNIQUE constraint jika sudah ada duplikat — akan gagal dengan error
- Cleanup wajib dilakukan lebih dulu (Task 1 sebelum Task 2)

**File mana yang tidak berubah:**
- `useRecovery.ts` — logika sudah benar, Path A adalah intended behavior
- `useBrowserEvents.ts` — sama, sudah benar
- `serverTimerCalculation.ts` — server-side calculation sudah akurat
- Supabase DB `start_time` — tidak diubah, hanya in-memory Zustand
