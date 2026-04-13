# Delete Activity Log — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** User bisa hapus activity log individual dari UI sebagai fallback untuk data corrupt.

**Architecture:** Query function → server action → delete button dengan konfirmasi dua-step di CalendarTaskDetail modal dan CollapsibleLogItem list. Lihat design doc untuk keputusan arsitektur.

**Tech Stack:** Vitest (unit tests, `makeQueryBuilder` pattern), Next.js Server Actions, Supabase RLS, SWR revalidation via `useActivityStore`

**Beads:** `bp-o0r` | **GitHub:** #8 | **Blocked by:** `bp-6ka` / #7

---

## Task 1: Query Function `deleteActivityLogQuery`

**Files:**
- Modify: `src/app/(admin)/execution/daily-sync/ActivityLog/actions/activity-logging/queries.ts`
- Modify: `src/app/(admin)/execution/daily-sync/ActivityLog/actions/activity-logging/__tests__/queries.test.ts`

**Step 1: Tulis test yang gagal**

Tambahkan import `deleteActivityLogQuery` di bagian atas `queries.test.ts` (gabungkan dengan import yang sudah ada):
```typescript
import {
  checkDuplicateActivityLog,
  insertActivityLog,
  queryActivityLogs,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
  deleteActivityLogQuery,  // tambahkan ini
} from '../queries';
```

Tambahkan test di akhir file:
```typescript
describe('deleteActivityLogQuery', () => {
  it('calls delete with correct id and user_id filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    await deleteActivityLogQuery(supabase, 'log-1', 'user-1');
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'log-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws when supabase returns error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(deleteActivityLogQuery(supabase, 'log-1', 'user-1'))
      .rejects.toMatchObject({ message: 'delete fail' });
  });
});
```

**Step 2: Jalankan test — konfirmasi FAIL**

```bash
npm run test:run -- "src/app/\(admin\)/execution/daily-sync/ActivityLog/actions/activity-logging/__tests__/queries.test.ts"
```
Expected: FAIL — `deleteActivityLogQuery is not a function`

**Step 3: Implementasi di `queries.ts`**

Tambahkan di akhir file:
```typescript
export async function deleteActivityLogQuery(
  supabase: SupabaseClient,
  logId: string,
  userId: string,
) {
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);
  if (error) throw error;
}
```

**Step 4: Jalankan test — konfirmasi PASS**

```bash
npm run test:run -- "src/app/\(admin\)/execution/daily-sync/ActivityLog/actions/activity-logging/__tests__/queries.test.ts"
```
Expected: semua test PASS

---

## Task 2: Server Action `deleteActivityLog`

**Files:**
- Modify: `src/app/(admin)/execution/daily-sync/ActivityLog/actions/activity-logging/actions.ts`
- Modify: `src/app/(admin)/execution/daily-sync/ActivityLog/actions/activityLoggingActions.ts`

**Step 1: Tambahkan import `deleteActivityLogQuery` di `actions.ts`**

Temukan baris import queries (line 5-12), tambahkan `deleteActivityLogQuery`:
```typescript
import {
  checkDuplicateActivityLog,
  insertActivityLog,
  queryActivityLogs,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
  deleteActivityLogQuery,  // tambahkan
} from './queries';
```

**Step 2: Tambahkan server action di akhir `actions.ts`**

```typescript
export async function deleteActivityLog(logId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await deleteActivityLogQuery(supabase, logId, user.id);
  revalidatePath('/execution/daily-sync');
}
```

**Step 3: Re-export di `activityLoggingActions.ts`**

```typescript
export { logActivity, getTodayActivityLogs, deleteActivityLog } from './activity-logging/actions';
```

**Step 4: Type-check**

```bash
npm run type-check
```
Expected: tidak ada error

---

## Task 3: Delete Button di `CalendarTaskDetail`

**Files:**
- Modify: `src/app/(admin)/execution/daily-sync/ActivityLog/components/CalendarTaskDetail.tsx`

**Step 1: Cek `useActivityStore` method yang tersedia**

```bash
grep -n "triggerRefresh\|setLastActivity\|refreshLogs" src/stores/activityStore.ts
```
Gunakan method yang tersedia (biasanya `triggerRefresh`).

**Step 2: Update `CalendarTaskDetail.tsx`**

Ganti seluruh isi file dengan versi berikut (perhatikan: tambahkan `'use client'` di atas, tambahkan state & handler delete, tambahkan tombol di header):

```typescript
'use client';
import React, { useState } from 'react';
import type { ActivityLogItem } from '@/types/activity-log';
import { formatTimeRange } from '@/lib/dateUtils';
import { deleteActivityLog } from '../actions/activityLoggingActions';
import { useActivityStore } from '@/stores/activityStore';
import { toast } from 'sonner';

interface CalendarTaskDetailProps {
  item: ActivityLogItem | null;
  onClose: () => void;
}

const CalendarTaskDetail: React.FC<CalendarTaskDetailProps> = ({ item, onClose }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { triggerRefresh } = useActivityStore();

  if (!item) return null;

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteActivityLog(item.id);
      toast.success('Activity log dihapus');
      triggerRefresh();
      onClose();
    } catch {
      toast.error('Gagal menghapus activity log');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100">
              <span>{formatTimeRange(item.start_time, item.end_time).replace(' - ', ' - ')}</span>
              <span className="text-gray-400">•</span>
              <span>{item.duration_minutes} menit</span>
            </div>
            <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 mt-0.5">
              ({item.task_title || 'Untitled Task'})
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {confirmDelete ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-red-600 dark:text-red-400">Hapus?</span>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? '...' : 'Ya'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Hapus activity log"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-blue-50/50 dark:bg-gray-900/50 min-h-[300px]">
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Apa yang diselesaikan:
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-base text-gray-800 dark:text-gray-200 shadow-sm min-h-[48px]">
              {item.what_done || '-'}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Yang masih dipikirkan:
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-base text-gray-800 dark:text-gray-200 shadow-sm min-h-[48px]">
              {item.what_think || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTaskDetail;
```

**Step 3: Type-check**

```bash
npm run type-check
```
Expected: tidak ada error. Jika `triggerRefresh` tidak ada, grep `activityStore` dan sesuaikan nama method.

---

## Task 4: Delete Button di `CollapsibleLogItem` (Timeline & Grouped)

**Files:**
- Modify: `src/app/(admin)/execution/daily-sync/ActivityLog/ActivityLog.tsx`

**Step 1: Tambahkan handler `handleDeleteLog` di komponen `ActivityLog`**

Temukan baris `const { logs, isLoading, error } = useActivityLogs(...)` (sekitar line 125), tambahkan sebelumnya:

```typescript
const { triggerRefresh } = useActivityStore();

const handleDeleteLog = async (logId: string) => {
  try {
    await deleteActivityLog(logId);
    toast.success('Activity log dihapus');
    triggerRefresh();
  } catch {
    toast.error('Gagal menghapus activity log');
  }
};
```

**Step 2: Tambahkan import `deleteActivityLog`**

Di bagian import di atas file, tambahkan:
```typescript
import { deleteActivityLog } from './actions/activityLoggingActions';
```

**Step 3: Update signature `CollapsibleLogItem`**

Temukan (line 61):
```typescript
const CollapsibleLogItem: React.FC<{ log: ActivityLogItem; showTaskTitle?: boolean; viewMode?: 'GROUPED' | 'TIMELINE' | 'CALENDAR' }> = ({ log, showTaskTitle = false, viewMode = 'GROUPED' }) => {
  const [isExpanded, setIsExpanded] = useState(viewMode === 'TIMELINE');
  const hasJournalEntry = log.what_done || log.what_think;
```

Ganti dengan:
```typescript
const CollapsibleLogItem: React.FC<{
  log: ActivityLogItem;
  showTaskTitle?: boolean;
  viewMode?: 'GROUPED' | 'TIMELINE' | 'CALENDAR';
  onDelete?: (logId: string) => Promise<void>;
}> = ({ log, showTaskTitle = false, viewMode = 'GROUPED', onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(viewMode === 'TIMELINE');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasJournalEntry = log.what_done || log.what_think;
```

**Step 4: Tambahkan `group` class dan delete button di row item**

Temukan div row (sekitar line 68):
```typescript
<div
  className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 rounded transition-colors"
  onClick={() => setIsExpanded(!isExpanded)}
>
```

Tambahkan class `group`:
```typescript
<div
  className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 rounded transition-colors group"
  onClick={() => setIsExpanded(!isExpanded)}
>
```

Tambahkan delete button setelah div content (setelah `</div>` yang menutup flex-1 content, sebelum `</div>` penutup row):
```typescript
{onDelete && (
  <div className="shrink-0" onClick={e => e.stopPropagation()}>
    {confirmDelete ? (
      <div className="flex items-center gap-1">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            setIsDeleting(true);
            await onDelete(log.id);
          }}
          disabled={isDeleting}
          className="text-xs px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? '...' : 'Hapus'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
          className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
        >
          Batal
        </button>
      </div>
    ) : (
      <button
        onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
        title="Hapus log"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    )}
  </div>
)}
```

**Step 5: Pass `onDelete` ke semua `<CollapsibleLogItem>` yang ada**

Grep semua pemakaian:
```bash
grep -n "CollapsibleLogItem" src/app/\(admin\)/execution/daily-sync/ActivityLog/ActivityLog.tsx
```

Untuk setiap `<CollapsibleLogItem` yang ditemukan, tambahkan prop:
```typescript
onDelete={handleDeleteLog}
```

**Step 6: Type-check**

```bash
npm run type-check
```
Expected: tidak ada error

---

## Task 5: Verifikasi End-to-End

**Step 1: Run all tests**

```bash
npm run test:run
```
Expected: semua PASS

**Step 2: Calendar view**
1. Buka daily-sync → Calendar view
2. Klik salah satu activity block → modal `CalendarTaskDetail` muncul
3. Klik trash icon → muncul "Hapus? Ya | Batal"
4. Klik "Ya" → toast "Activity log dihapus", modal tutup, calendar refresh
5. Log tidak muncul lagi

**Step 3: Timeline/Grouped view**
1. Ganti ke Timeline view
2. Hover item → trash icon muncul di kanan
3. Klik → "Hapus | Batal" muncul
4. Klik "Hapus" → toast, item hilang dari list

**Step 4: Verifikasi DB**

```sql
SELECT COUNT(*) FROM activity_logs WHERE id = '<deleted-log-id>';
```
Expected: `0`

---

## Commit Messages

```
feat(activity-log): add deleteActivityLogQuery with tests

feat(activity-log): add deleteActivityLog server action (bp-o0r)

feat(activity-log): add delete button with confirmation in CalendarTaskDetail (bp-o0r)

feat(activity-log): add delete button with confirmation in list views (bp-o0r)
```
