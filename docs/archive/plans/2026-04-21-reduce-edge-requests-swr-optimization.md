# Plan: Reduce Vercel Edge Request Usage — Daily Sync SWR Optimization

## Context

Vercel usage menunjukkan 889K dari 1M edge request limit dalam 30 hari, dengan `prj-better-planner` sebagai penyumbang terbesar (84.6% = ~751K requests). Route `/execution/daily-sync` adalah top consumer dengan 2K requests dalam 12 jam terakhir, dengan 0.2% cache rate (hampir tidak ada caching).

**Root cause**: Multiple SWR hooks di halaman daily-sync meng-override global config `revalidateOnFocus: false` dengan `revalidateOnFocus: true`, ditambah `refreshInterval: 30000` yang polling terus-menerus. Setiap tab switch user = 6-8 requests sekaligus.

**Goal**: Kurangi edge request volume minimal 70-80% tanpa mengorbankan freshness data penting (activity logs setelah Pomodoro selesai).

---

## Root Cause Analysis

### Masalah 1: `revalidateOnFocus: true` Override di 6 Hook

Global config di `src/lib/swr.ts` sudah benar (`revalidateOnFocus: false`), tapi individual hooks mengoverride:

| File | Setting | Requests per tab switch |
|------|---------|--------|
| `ActivityLog/hooks/useActivityLogs.ts:37` | `revalidateOnFocus: true` | 1 |
| `TargetFocus/hooks/useTargetFocus.ts:150,188` | `revalidateOnFocus: true` (2 SWR calls) | 2 |
| `DailyQuest/hooks/useCompletedSessions.ts:86` | `revalidateOnFocus: true` | 1 |
| `DailyStats/hooks/useTimeAnalysis.ts:41` | `revalidateOnFocus: true` | 1 |
| `Journal/hooks/useJournalData.ts:38` | `revalidateOnFocus: true` | 1 |
| `DailyQuest/hooks/useScheduledTasks.ts:9` | `revalidateOnFocus: true` | 1 |

**Total per tab switch**: ~8 requests (termasuk TargetFocus yang di-render 2x di page.tsx: mobile line 128 + desktop line 151)

### Masalah 2: Continuous Polling `refreshInterval: 30000`

- `DailyStats/hooks/useTimeAnalysis.ts:41` — polling setiap 30 detik
- `BrainDump/hooks/useBrainDump.ts:41` — polling setiap 30 detik (default `autoRefresh=true`)

Dengan 2 hooks polling 30 detik = 4 requests/menit = 240 requests/jam saat page terbuka.

### Masalah 3: `dedupingInterval` Terlalu Pendek

- `useActivityLogs.ts:40` — 10 detik
- `useCompletedSessions.ts:89` — 10 detik
- `useJournalData.ts:41` — 5 detik (paling agresif)

---

## Solusi: Smart Revalidation

Data di daily-sync **tidak perlu real-time via focus event** — semua data sudah di-refresh secara event-driven via `mutate()` setelah Pomodoro selesai. Jadi `revalidateOnFocus` dan `refreshInterval` tidak diperlukan.

**Estimasi penghematan: 85-90% pengurangan edge requests.**

---

## Implementation Tasks

### Task 1: Fix `useActivityLogs.ts`

**File**: `src/app/(admin)/execution/daily-sync/ActivityLog/hooks/useActivityLogs.ts`

**Lines 37-41** — ubah dari:
```typescript
    revalidateOnFocus: true, // ✅ ENABLED - Allow revalidation on focus for fresh data
    revalidateIfStale: true, // ✅ ENABLED - Allow revalidation of stale data
    revalidateOnReconnect: true,
    dedupingInterval: 10 * 1000, // ✅ 10 seconds for very fresh activity data
```

Menjadi:
```typescript
    revalidateOnFocus: false, // Data di-refresh via mutate() setelah Pomodoro selesai
    revalidateIfStale: false, // Jangan auto-stale — data valid selama 5 menit
    revalidateOnReconnect: true, // OK — hanya saat reconnect
    dedupingInterval: 5 * 60 * 1000, // 5 menit — cukup fresh
```

**Justifikasi**: Activity logs di-refresh via `mutate()` di `useEffect` saat `refreshKey` atau `lastActivityTimestamp` berubah (baris 50-55). `revalidateOnFocus` tidak diperlukan.

---

### Task 2: Fix `useTargetFocus.ts`

**File**: `src/app/(admin)/execution/daily-sync/TargetFocus/hooks/useTargetFocus.ts`

**Lines 150-154** (SWR call pertama, `getDailyPlanTargets`) — ubah dari:
```typescript
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30 * 1000, // ✅ OPTIMIZED: 30 seconds cache for fresh data
```

Menjadi:
```typescript
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
```

**Lines 188-192** (SWR call kedua, `getActualFocusTime`) — ubah dari:
```typescript
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30 * 1000, // ✅ OPTIMIZED: 30 seconds cache for fresh data
```

Menjadi:
```typescript
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
```

**Justifikasi**: `useTargetFocus` sudah punya `useEffect` yang memanggil `mutateTargets()` dan `mutateFocus()` saat `selectedDate` atau `taskIdsKey` berubah. Manual refresh sudah ada.

---

### Task 3: Fix `useCompletedSessions.ts`

**File**: `src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useCompletedSessions.ts`

**Lines 86-90** — ubah dari:
```typescript
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000, // 10 seconds for fresh data
```

Menjadi:
```typescript
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
```

---

### Task 4: Fix `useTimeAnalysis.ts` — HAPUS polling

**File**: `src/app/(admin)/execution/daily-sync/DailyStats/hooks/useTimeAnalysis.ts`

**Lines 41-43** — ubah dari:
```typescript
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
```

Menjadi:
```typescript
    {
      refreshInterval: 0, // Hapus polling — data di-refresh saat Pomodoro selesai
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
    }
```

**Justifikasi**: `DailyStats` menampilkan focus time summary yang tidak perlu real-time — user lihat update setelah Pomodoro session selesai (yang sudah trigger mutate).

---

### Task 5: Fix `useBrainDump.ts` — HAPUS default autoRefresh

**File**: `src/app/(admin)/execution/daily-sync/BrainDump/hooks/useBrainDump.ts`

**Line 31** — ubah default parameter dari:
```typescript
export function useBrainDump({ date, autoRefresh = true }: UseBrainDumpOptions): UseBrainDumpReturn {
```

Menjadi:
```typescript
export function useBrainDump({ date, autoRefresh = false }: UseBrainDumpOptions): UseBrainDumpReturn {
```

**Lines 40-45** — ubah SWR config dari:
```typescript
    {
      revalidateOnFocus: autoRefresh,
      revalidateOnReconnect: autoRefresh,
      dedupingInterval: 2 * 60 * 1000,
      errorRetryCount: 3,
      refreshInterval: autoRefresh ? 30000 : 0,
    }
```

Menjadi:
```typescript
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 60 * 1000, // 10 menit — brain dump jarang berubah
      errorRetryCount: 3,
      refreshInterval: 0, // Hapus polling sepenuhnya
    }
```

**Justifikasi**: Brain dump adalah free-writing — user yang edit, bukan sistem. Tidak perlu polling.

---

### Task 6: Fix `useJournalData.ts`

**File**: `src/app/(admin)/execution/daily-sync/Journal/hooks/useJournalData.ts`

**Lines 38-43** — ubah dari:
```typescript
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 1000, // 5 seconds for very fresh journal data
```

Menjadi:
```typescript
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
```

**Justifikasi**: Journal di-update via optimistic update di `updateJournal()`. Tidak perlu fetch ulang dari server saat tab focus.

---

### Task 7: Fix `useScheduledTasks.ts`

**File**: `src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useScheduledTasks.ts`

**Lines 6-9** — ubah dari:
```typescript
    {
      revalidateOnFocus: true, // Auto update when switching tabs/windows
    }
```

Menjadi:
```typescript
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
    }
```

---

### Task 8: Tingkatkan `focusThrottleInterval` di Global Config (Safety Net)

**File**: `src/lib/swr.ts`

**Line 10** — ubah dari:
```typescript
  focusThrottleInterval: 2000, // ✅ Reduced to 2 seconds for faster updates
```

Menjadi:
```typescript
  focusThrottleInterval: 5 * 60 * 1000, // 5 menit — safety net jika ada hook yang masih pakai revalidateOnFocus
```

---

## Files to Modify (8 files, ~35 baris)

1. `src/app/(admin)/execution/daily-sync/ActivityLog/hooks/useActivityLogs.ts`
2. `src/app/(admin)/execution/daily-sync/TargetFocus/hooks/useTargetFocus.ts`
3. `src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useCompletedSessions.ts`
4. `src/app/(admin)/execution/daily-sync/DailyStats/hooks/useTimeAnalysis.ts`
5. `src/app/(admin)/execution/daily-sync/BrainDump/hooks/useBrainDump.ts`
6. `src/app/(admin)/execution/daily-sync/Journal/hooks/useJournalData.ts`
7. `src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useScheduledTasks.ts`
8. `src/lib/swr.ts`

---

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Requests per tab switch | ~8 | 0 (hanya manual mutate) |
| Time Analysis polling | 2 req/menit | 0 |
| BrainDump polling | 2 req/menit | 0 |
| Total per jam (active user) | ~250+ req | ~10-20 req |
| Monthly edge requests | ~889K | ~90-180K |

---

## Verification

1. Buka `/execution/daily-sync` di browser
2. Buka DevTools → Network tab → filter by "supabase" atau request ke server actions
3. Switch tab keluar lalu kembali 5x — **verifikasi: tidak ada request baru**
4. Mulai Pomodoro timer → selesaikan satu session
5. **Verifikasi**: Activity log UPDATE setelah session selesai (via existing mutate mechanism)
6. Cek DailyStats masih update setelah Pomodoro selesai
7. Monitor Vercel dashboard setelah 24 jam — edge requests harus turun drastis

---

## Commit Message Template

```
perf(daily-sync): disable revalidateOnFocus and polling to reduce edge requests (fixes #XX)

- Disable revalidateOnFocus in 6 SWR hooks (useActivityLogs, useTargetFocus,
  useCompletedSessions, useTimeAnalysis, useJournalData, useScheduledTasks)
- Remove refreshInterval polling from useTimeAnalysis (was 30s) and useBrainDump (was 30s default)
- Increase dedupingInterval from 5-10s to 5 minutes across all hooks
- Change useBrainDump default autoRefresh from true to false
- Increase global focusThrottleInterval to 5min as safety net
- Data freshness maintained via existing event-driven mutate() after Pomodoro sessions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
