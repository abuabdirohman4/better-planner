# Design: Fix Weekly Goal Item Status Cross-Week Contamination

**Issue:** bp-kr9 | **GH:** [#6](https://github.com/abuabdirohman4/better-planner/issues/6)
**Date:** 2026-04-13

---

## Problem Statement

Saat task yang sama (misal Task A) di-set sebagai weekly goal di Minggu 1 (belum selesai), lalu di-set ulang di Minggu 2 dan diselesaikan — weekly goal di **Minggu 1 ikut ter-checklist sebagai DONE**. Ini false positive pada progress weekly goal.

## Root Cause Analysis

### Data Model

```
weekly_goals
  id (PK)
  user_id
  year
  week_number   ← identifies which week
  goal_slot     ← 1, 2, or 3
  quarter

weekly_goal_items
  id (PK)
  weekly_goal_id (FK → weekly_goals.id)
  item_id        ← UUID of the task (same task can appear in multiple weeks)
  status         ← 'TODO' | 'IN_PROGRESS' | 'DONE'
  UNIQUE (weekly_goal_id, item_id)
```

Jika Task A di-assign ke week 1 dan week 2:
- Row 1: `weekly_goal_id = wg-week1, item_id = task-A`
- Row 2: `weekly_goal_id = wg-week2, item_id = task-A`

### Buggy Update

```typescript
// queries.ts:42
await supabase
  .from('weekly_goal_items')
  .update({ status })
  .eq('item_id', taskId);  // ❌ Matches BOTH rows!
```

## Decision

### Option A: Filter by `weekly_goal_id` (CHOSEN)

Tambah parameter `weeklyGoalId` ke `updateWeeklyGoalItemsStatus`. Di `actions.ts`, resolve `weeklyGoalId` dari `weekNumber + year + goalSlot` via `queryExistingWeeklyGoal` yang sudah ada.

**Pros:**
- Minimal change — hanya 2 file
- Reuse fungsi `queryExistingWeeklyGoal` yang sudah ada di `weekly-goals/queries.ts`
- Fix presisi tanpa side effects

**Cons:**
- Menambah 1 extra query per status update (resolve weeklyGoalId)

### Option B: Pass `weeklyGoalId` dari caller component

Dari UI, pass `weeklyGoalId` langsung ke server action.

**Rejected:** Butuh perubahan di banyak layer (UI → action signature). Option A lebih terisolasi.

## Architecture Decision

`weeklyGoalId` di-resolve di layer `actions.ts` (server action), bukan di UI. Ini menjaga UI tetap tidak tahu tentang internal DB IDs, consistent dengan pattern yang sudah ada.

Jika `weeklyGoal` tidak ditemukan (edge case: task di-complete tapi minggu ini belum punya weekly_goal record), update `weekly_goal_items` di-skip — `rpcUpdateTaskStatus` tetap jalan untuk update task status di tabel `tasks`.
