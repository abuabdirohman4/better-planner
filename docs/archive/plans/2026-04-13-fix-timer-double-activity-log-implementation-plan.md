# Fix Timer Double Activity Log — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminasi double-recording activity log dari race condition di Pomodoro timer, dan bersihkan 82 data duplikat yang sudah ada.

**Architecture:** 3-layer defense: DB UNIQUE constraint (safety net) + immediate IDLE state reset (close race window) + graceful error handling (defense in depth). Lihat design doc untuk keputusan arsitektur.

**Tech Stack:** Supabase MCP (migration), Zustand (`timerStore.ts`), Next.js Server Actions (`sessionCompletion.ts`)

**Beads:** `bp-6ka` | **GitHub:** #7

---

## Task 1: Cleanup Data Duplikat

**Files:** Supabase via MCP (tidak ada file lokal)

**Step 1: Verifikasi jumlah duplikat sebelum cleanup**

Run via `mcp__better-planner__execute_sql`:
```sql
SELECT COUNT(*) as total_groups, SUM(count - 1) as extra_logs
FROM (
  SELECT task_id, start_time, COUNT(*) as count
  FROM activity_logs
  GROUP BY task_id, start_time
  HAVING COUNT(*) > 1
) sub;
```
Expected: `total_groups = 43, extra_logs = 82` (atau mendekati)

**Step 2: Delete duplikat — simpan yang paling lama, hapus yang lebih baru**

Run via `mcp__better-planner__execute_sql`:
```sql
DELETE FROM activity_logs
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, task_id, start_time
             ORDER BY created_at ASC
           ) as rn
    FROM activity_logs
  ) ranked
  WHERE rn > 1
);
```
Expected output: `DELETE 82` (sesuai extra_logs dari Step 1)

**Step 3: Verifikasi 0 duplikat tersisa**

```sql
SELECT COUNT(*) as remaining_duplicates
FROM (
  SELECT task_id, start_time, COUNT(*) as count
  FROM activity_logs
  GROUP BY task_id, start_time
  HAVING COUNT(*) > 1
) sub;
```
Expected: `remaining_duplicates = 0`

---

## Task 2: Tambah UNIQUE Constraint via Migration

**Files:** Supabase migration via MCP

**Step 1: Apply migration**

Run via `mcp__better-planner__apply_migration` dengan nama `add_activity_logs_unique_constraint`:
```sql
ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_unique_per_session
UNIQUE (user_id, task_id, start_time);
```

**Step 2: Verifikasi constraint terdaftar**

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'activity_logs'
  AND constraint_name = 'activity_logs_unique_per_session';
```
Expected: 1 row, `constraint_type = 'UNIQUE'`

---

## Task 3: Immediate IDLE State Reset di `completeTimerFromDatabase`

**Files:**
- Modify: `src/stores/timerStore.ts` — method `completeTimerFromDatabase` (sekitar line 331)

**Step 1: Temukan lokasi yang tepat**

Grep: `grep -n "completionInProgress = true" src/stores/timerStore.ts`

Cari blok:
```typescript
// Set completion lock
completionInProgress = true;
lastCompletedTaskId = sessionData.taskId;
lastCompletionTime = now;

try {
  // Stop focus sound when completing timer from database
  get().stopFocusSound();
```

**Step 2: Tambahkan immediate state reset setelah lock, sebelum `try`**

```typescript
// Set completion lock
completionInProgress = true;
lastCompletedTaskId = sessionData.taskId;
lastCompletionTime = now;

// ✅ FIX: Immediately set IDLE state synchronously before any async operation.
// This closes the ~1 second race window where useGlobalTimer could see
// timerState === 'FOCUSING' and trigger a second completion.
set({
  timerState: 'IDLE' as TimerState,
  secondsElapsed: 0,
  activeTask: null,
  startTime: null,
  breakType: null,
});

try {
  // Stop focus sound when completing timer from database
  get().stopFocusSound();
```

> ⚠️ **Jangan hapus** blok `set({...})` yang sudah ada di bawah (~line 382) — itu berisi `lastSessionComplete`, `waitingForBreak`, dll yang masih dibutuhkan.

**Step 3: Type-check**

Run: `npm run type-check`
Expected: tidak ada error

---

## Task 4: Handle UNIQUE Constraint Violation di `sessionCompletion.ts`

**Files:**
- Modify: `src/app/(admin)/execution/daily-sync/PomodoroTimer/actions/timerSession/sessionCompletion.ts`

**Step 1: Temukan lokasi INSERT activity_log**

Grep: `grep -n "logError" src/app/\(admin\)/execution/daily-sync/PomodoroTimer/actions/timerSession/sessionCompletion.ts`

Cari blok ini (sekitar line 79-82):
```typescript
if (logError) {
  console.error('[completeTimerSession] Activity log error:', logError);
  throw logError;
}
```

**Step 2: Tambahkan handling untuk error code `23505`**

```typescript
if (logError) {
  // ✅ FIX: Gracefully handle unique constraint violation (duplicate log).
  // PostgreSQL error code 23505 = unique_violation.
  // Happens when two completion paths race — second one can safely skip.
  if (logError.code === '23505') {
    console.log('[completeTimerSession] Activity log already exists (unique constraint), skipping duplicate');
  } else {
    console.error('[completeTimerSession] Activity log error:', logError);
    throw logError;
  }
}
```

**Step 3: Type-check**

Run: `npm run type-check`
Expected: tidak ada error

---

## Task 5: Verifikasi End-to-End

**Step 1: Manual test — close app saat timer berjalan**
1. Start timer 25 menit, biarkan berjalan ~2 menit
2. Close tab browser
3. Tunggu hingga 25 menit dari start berlalu
4. Buka kembali app
5. Expected: timer complete, hanya **1** activity log tercatat

**Step 2: Verifikasi tidak ada duplikat baru**

```sql
SELECT task_id, start_time, COUNT(*) as count
FROM activity_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY task_id, start_time
HAVING COUNT(*) > 1;
```
Expected: 0 rows

**Step 3: Manual test — navigate away dan kembali**
1. Start timer, navigate ke halaman lain, kembali ke daily-sync
2. Timer berjalan normal
3. Tunggu hingga timer selesai
4. Expected: 1 activity log saja

---

## Commit Messages

```
fix(pomodoro): cleanup 82 duplicate activity logs from race condition

fix(pomodoro): add UNIQUE constraint on activity_logs (user_id, task_id, start_time) (bp-6ka)

fix(pomodoro): immediately set IDLE state to close completion race window (bp-6ka)

fix(pomodoro): handle unique constraint violation 23505 gracefully (bp-6ka)
```
