# Plan: Fix Pomodoro Timer Bugs (bp-byp)

## Root Cause Analysis

### Bug 1: Double Activity Log saat Journal Disimpan

**Flow normal (seharusnya):**
1. Timer selesai → `completeTimerSession` insert activity log ke DB
2. `useTimerManagement` query activity log ID yang baru dibuat
3. `openJournalModal({ activityId: <id>, ... })` dipanggil
4. User save journal → `updateActivityJournal(activityId, ...)` update row existing

**Flow bug (aktual):**
1. Timer selesai → `completeTimerSession` insert activity log ke DB ✅
2. Query `activityLogId` kadang return null (race condition — insert belum committed)
3. `openJournalModal({ activityId: undefined, ... })` dipanggil
4. User save journal → masuk `else` branch di `useJournal.saveJournal`
5. Else branch cek dulu, tapi kalau ada timing issue → **INSERT baru** → double log

**Fix:** Di `useJournal.saveJournal` else branch — ubah dari "cari dulu baru insert" menjadi lebih agresif: retry query lebih lama sebelum fallback insert, dan tambah duplicate check lebih ketat di `completeTimerSession`.

### Bug 2: Durasi Tersimpan 25 Menit (Bukan Real)

**Root cause:** Di `sessionCompletion.ts`:
```typescript
const actualDurationSeconds = Math.min(rawDurationSeconds, session.target_duration_seconds);
const actualDurationMinutes = Math.max(1, Math.round(actualDurationSeconds / 60));
```
Ini cap durasi ke target (25 menit). Kalau real-nya 38 menit (timer di-stop manual), tetap tersimpan 25 menit.

**Fix:** Hapus cap — simpan real duration. Timer sudah ada guard di frontend untuk display; DB harus simpan fakta.

### Bug 3: Stop Timer Perlu 2x Klik

**Root cause:** `isProcessingCompletion` bisa masih `true` dari sesi sebelumnya jika session completion gagal atau tidak di-reset. Button Stop tidak disable karena prop berbeda, tapi `stopTimer()` dipanggil, sets `lastSessionComplete`, lalu `useTimerManagement` handle via `handleSessionComplete` yang sets `isProcessingCompletion = true` — kalau ini masih true, klik berikutnya terasa blocked.

**Actual root cause (lebih spesifik):** Stop button memanggil `stopTimer()` → ini set `lastSessionComplete` di store → `useEffect` di `useTimerManagement` picks it up → `handleSessionComplete` runs asynchronously. Klik pertama sudah jalan, tapi UI bisa terasa "stuck" saat `isProcessingCompletion` true.

Cek lebih dalam: apakah ada `disabled` prop pada button yang terhubung ke `isLoading`.

**Fix:** Pastikan `isLoading` tidak mempengaruhi stop button visibility/clickability.

### Bug 4: Session Count Tidak Update

**Root cause:** `progressText` di `PomodoroTimer.tsx` membaca dari `displayTask.completed_sessions` yang berasal dari `activeTask || lastActiveTask` di store. Nilai ini tidak di-update setelah session selesai karena `lastActiveTask` disimpan dari nilai saat `startFocusSession` dipanggil, bukan dari server.

**Fix:** Setelah session complete, increment `lastActiveTask.completed_sessions` di store, atau re-fetch task dari server.

## Files to Change

1. `src/app/(admin)/execution/daily-sync/PomodoroTimer/actions/timerSession/sessionCompletion.ts` — Bug 2: hapus cap durasi
2. `src/app/(admin)/execution/daily-sync/Journal/hooks/useJournal.ts` — Bug 1: perbaiki else branch agar tidak double insert
3. `src/stores/timerStore.ts` — Bug 4: update `lastActiveTask.completed_sessions` setelah session complete
4. `src/app/(admin)/execution/daily-sync/PomodoroTimer/hooks/useTimerManagement.ts` — Bug 3: check stop button behavior

## CLAUDE.md Check
- [ ] Apakah ada pattern/arsitektur BARU yang diperkenalkan di task ini?
- [ ] Apakah ada tabel database baru yang perlu ditambahkan ke Key Tables?
- [ ] Apakah ada route/page baru yang perlu ditambahkan ke App Router Structure?
- [ ] Apakah ada permission pattern baru yang perlu didokumentasikan?
