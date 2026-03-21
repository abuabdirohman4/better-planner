# Database Operations

This document covers database-specific operations, patterns, and critical constraints for Better Planner.

---

## ⚠️ CRITICAL: CASCADE Delete Chain

### The Problem

Better Planner uses a cascading foreign key structure that can cause **unintended data loss** if not handled carefully:

```
daily_plans (DELETE)
    ↓ ON DELETE CASCADE
daily_plan_items (AUTO DELETE)
    ↓ ON DELETE CASCADE
task_schedules (AUTO DELETE) ← Schedules hilang!
```

### Operations that Trigger Cascade

1. **`setDailyPlan()` - Delete & re-insert daily_plan_items by type**
   - ❌ **Risk**: Schedules are lost when daily_plan_items are deleted
   - ✅ **Fixed**: Backup/restore pattern implemented (see below)

2. **`removeDailyPlanItem()` - Delete single task from daily plan**
   - ✅ **Expected behavior**: When user removes task, schedules should be deleted

### Fix Implemented (bp-7wn)

The `setDailyPlan()` function now uses a backup/restore pattern to preserve schedules:

**Pattern: Backup → Delete (CASCADE) → Insert new items → Restore schedules with new IDs**

See `dailyPlanActions.ts:24-120` for complete implementation.

### Best Practice

When updating `daily_plan_items` with delete-and-reinsert pattern:

1. **Backup schedules first** using a temporary variable or database query
2. Delete old daily_plan_items (CASCADE will delete schedules)
3. Insert new daily_plan_items with new UUIDs
4. **Restore schedules** by mapping old daily_plan_item_id → new daily_plan_item_id

**Example Pattern:**

```typescript
// 1. Backup schedules
const existingSchedules = await supabase
  .from('task_schedules')
  .select('*')
  .in('daily_plan_item_id', oldItemIds);

// 2. Delete old items (CASCADE deletes schedules)
await supabase
  .from('daily_plan_items')
  .delete()
  .eq('daily_plan_id', planId)
  .eq('type', questType);

// 3. Insert new items
const { data: newItems } = await supabase
  .from('daily_plan_items')
  .insert(newItemsData)
  .select();

// 4. Restore schedules with new IDs
const scheduleMapping = createMapping(oldItems, newItems);
const restoredSchedules = existingSchedules.map(schedule => ({
  ...schedule,
  daily_plan_item_id: scheduleMapping[schedule.daily_plan_item_id],
  id: undefined // Let DB generate new UUID
}));

await supabase.from('task_schedules').insert(restoredSchedules);
```

### Complete Implementation Guide

For complete step-by-step implementation of the Activity Plan feature including schedule management, see:
- **`docs/activity-plan-feature.md`** - Full feature documentation
- **`src/app/(admin)/execution/daily-sync/DailyQuest/actions/scheduleActions.ts`** - CRUD operations

---

## 📋 Data Validation Rules

### Date Formats

- **Storage**: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)
- **Timestamps**: Always store in UTC (see [`timezone-handling.md`](../../timezone-handling.md))
- **Display**: Convert to local timezone (WIB/Asia/Jakarta) for user

### ID Formats

- All IDs: UUID v4 format
- Never use sequential integers for user-facing IDs
- Use Supabase `gen_random_uuid()` for default values

### Colors

- Hex format only: `#1496F6`
- 6-digit hex codes (no 3-digit shorthand)
- Include `#` prefix in database storage

### User Data Isolation

- All user data is isolated via Row Level Security (RLS)
- **NEVER** bypass RLS in client-side code
- Use `user_id` foreign key constraint on all user-owned tables
- Test RLS policies with multiple user accounts

---

## 🔧 Supabase Client Patterns

### Server Components

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getServerData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data || [];
}
```

### Client Components

```typescript
import { createClient } from '@/lib/supabase/client';

export function useClientData() {
  const supabase = createClient();

  // Use with SWR or React Query
  const fetcher = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  };

  return useSWR('client-data-key', fetcher);
}
```

### Authentication Checks

**ALWAYS** check authentication before database operations:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');
```

---

## 🔄 Revalidation Patterns

### After Mutations

Always revalidate paths after server mutations:

```typescript
import { revalidatePath } from 'next/cache';

export async function updateData(formData: FormData) {
  // ... mutation logic

  // Revalidate the page that displays this data
  revalidatePath('/dashboard');

  // Revalidate multiple paths if needed
  revalidatePath('/execution/daily-sync');
  revalidatePath('/quests/daily');
}
```

### SWR Mutation

For client-side mutations, use SWR's `mutate`:

```typescript
import useSWR, { mutate } from 'swr';

function MyComponent() {
  const { data } = useSWR('data-key', fetcher);

  const handleUpdate = async () => {
    await updateData(formData);

    // Revalidate SWR cache
    await mutate('data-key');
  };
}
```

---

## 🗄️ Common Query Patterns

### Filtering by User

```typescript
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### Date Range Queries

**IMPORTANT**: Use UTC-aware filtering (see [`timezone-handling.md#date-range-queries`](../../timezone-handling.md#date-range-queries))

```typescript
// Convert local date boundaries to UTC
const startOfDayWIB = new Date(`${date}T00:00:00+07:00`);
const startUTC = startOfDayWIB.toISOString();

const endOfDayWIB = new Date(`${date}T23:59:59.999+07:00`);
const endUTC = endOfDayWIB.toISOString();

const { data } = await supabase
  .from('task_schedules')
  .gte('scheduled_start_time', startUTC)
  .lte('scheduled_end_time', endUTC);
```

### Joins and Relations

```typescript
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    project:projects(id, title, color),
    quest:quests(id, title, type)
  `)
  .eq('user_id', user.id);
```

---

## 🚨 Common Pitfalls

### 1. Direct `.toISOString()` on Local Dates

❌ **WRONG:**
```typescript
const localDate = new Date('2026-02-13T17:00:00');
const isoString = localDate.toISOString(); // Wrong timezone!
```

✅ **CORRECT:**
```typescript
import { zonedTimeToUtc } from 'date-fns-tz';

const localDate = new Date('2026-02-13T17:00:00');
const utcDate = zonedTimeToUtc(localDate, 'Asia/Jakarta');
const isoString = utcDate.toISOString();
```

### 2. Forgetting Authentication Checks

❌ **WRONG:**
```typescript
const { data } = await supabase.from('tasks').select('*');
```

✅ **CORRECT:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');

const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id);
```

### 3. Not Handling Cascade Deletes

❌ **WRONG:**
```typescript
// Delete and re-insert without backup
await supabase.from('daily_plan_items').delete().eq('daily_plan_id', planId);
await supabase.from('daily_plan_items').insert(newItems);
// Schedules are now lost!
```

✅ **CORRECT:**
```typescript
// Backup → Delete → Insert → Restore
const schedules = await backupSchedules(oldItemIds);
await supabase.from('daily_plan_items').delete().eq('daily_plan_id', planId);
const newItems = await supabase.from('daily_plan_items').insert(data).select();
await restoreSchedules(schedules, newItems);
```

---

## 📊 Performance Tips

### Batch Operations

For large datasets, use batch operations:

```typescript
// Instead of N individual queries
for (const item of items) {
  await supabase.from('table').insert(item); // ❌ Slow
}

// Use single batch insert
await supabase.from('table').insert(items); // ✅ Fast
```

### Pagination

```typescript
const PAGE_SIZE = 50;

const { data, count } = await supabase
  .from('table_name')
  .select('*', { count: 'exact' })
  .eq('user_id', user.id)
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

### Select Only Needed Columns

```typescript
// ❌ Fetch everything
const { data } = await supabase.from('tasks').select('*');

// ✅ Only fetch what you need
const { data } = await supabase
  .from('tasks')
  .select('id, title, status, due_date');
```

---

## 🔐 Row Level Security (RLS)

### Policy Pattern

All user-owned tables should have RLS policies like:

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own data
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own data
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own data
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### Testing RLS

Always test RLS policies with multiple user accounts:

1. Create test user A
2. Create test user B
3. Create data as user A
4. Try to access user A's data as user B (should fail)
5. Verify user B can only see their own data

---

## 🌐 Environment Variables

Required for database operations:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**NEVER** commit `.env.local` to git. Use `.env.example` for documentation.

---

## 📚 Related Documentation

- **Timezone Handling**: [`docs/timezone-handling.md`](../../timezone-handling.md)
- **Activity Plan Feature**: [`docs/activity-plan-feature.md`](../../activity-plan-feature.md)
- **Architecture Patterns**: [`architecture-patterns.md`](architecture-patterns.md)
- **Testing Guidelines**: [`testing-guidelines.md`](testing-guidelines.md)
