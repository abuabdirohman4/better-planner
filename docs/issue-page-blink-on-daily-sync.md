# Issue: Page Blink/Flash on Daily Sync Operations

**Issue ID**: Related to `bp-oaa` (Time Blocking Feature)
**Status**: ❌ UNRESOLVED
**Priority**: HIGH
**Created**: 2026-02-13
**Last Updated**: 2026-02-13

---

## 📋 Problem Description

When performing certain operations on the `/execution/daily-sync` page, the page experiences a visible "blink" or "flash" effect. This is **NOT** a full browser refresh, but rather a brief visual flash where the page appears to reload/re-render.

### Affected Operations:
- ❌ **Select Main Quest** - Blinks/flashes
- ❌ **Select Work Quest** - Blinks/flashes
- ❌ **Select Side Quest** - Blinks/flashes
- ❌ **Select Daily Quest** - Blinks/flashes (confirmed after re-testing)
- ❌ **Add Side Quest** - Blinks/flashes
- ✅ **Remove Quest** - Does NOT blink (fixed after attempt #3)

### User Experience:
- Page shows a brief flash/blink
- Skeleton loading component appears momentarily
- Data eventually appears correctly
- **No actual browser refresh** (URL doesn't change, scroll position maintained)

---

## 🔍 Investigation Summary

### Hypothesis Tested:

#### ❌ Hypothesis 1: Caused by `revalidatePath()` calls
**Theory**: Next.js `revalidatePath()` triggers router cache invalidation causing page blink.

**Test**: Remove all `revalidatePath('/execution/daily-sync')` calls.

**Result**:
- Remove quest ✅ works without blink
- Select quest operations ❌ still blink
- Add side quest ❌ still blinks

**Conclusion**: `revalidatePath` is NOT the sole cause. Issue persists without it.

---

#### ❌ Hypothesis 2: Route Segment Config Issue
**Theory**: Page needs `dynamic = 'force-dynamic'` to prevent static optimization.

**Test**: Add to `layout.tsx`:
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Result**: ❌ Still blinks

**Conclusion**: Not a static/dynamic rendering issue.

---

#### ❌ Hypothesis 3: Server Actions causing automatic revalidation
**Theory**: Next.js Server Actions automatically trigger router cache refresh.

**Test**: Replace Server Actions with direct Supabase client calls in Client Components.

**Result**:
- Created 500+ lines of duplicated code
- Poor code quality
- User rejected approach as too verbose

**Conclusion**: Not a practical solution.

---

#### ❌ Hypothesis 4: SWR `isLoading` triggering skeleton display
**Theory**: SWR sets `isLoading: true` during mutations, triggering skeleton component.

**Investigation Findings**:
```typescript
// page.tsx:111-113
{loading ? (
  <DailySyncSkeleton />
) : (
  // content
)}

// useDailyPlanManagement.ts:276
const loading = dailyPlanLoading || tasksLoading || completedSessionsLoading;
```

When `mutateDailyPlan()` is called, SWR sets `isLoading: true` → shows skeleton → causes blink.

**Test**:
- Add `keepPreviousData: true` to SWR config
- Separate `initialLoading` from `loading` using `isValidating`

**Result**: ❌ FAILED
- Main Quest modal doesn't open
- Skeleton still appears on other operations
- User reverted changes

**Conclusion**: Approach broke functionality.

---

## 📁 Files Involved

### Server Actions:
```
src/app/(admin)/execution/daily-sync/DailyQuest/actions/
├── dailyQuestActions.ts      ← revalidatePath removed (4×)
├── sideQuestActions.ts        ← revalidatePath removed (1×)
├── scheduleActions.ts         ← revalidatePath removed (3×)
├── dailyPlanActions.ts        ← revalidatePath KEPT (6×)
└── weeklyTaskActions.ts       ← revalidatePath KEPT (3×)
```

### Hooks:
```
src/app/(admin)/execution/daily-sync/DailyQuest/hooks/
├── useDailyPlanManagement.ts  ← Main data management hook
└── useDailySync.ts            ← Weekly tasks hook
```

### Components:
```
src/app/(admin)/execution/daily-sync/
├── page.tsx                   ← Shows skeleton on loading
└── DailyQuest/
    ├── DailySyncClient.tsx
    ├── MainQuestListSection.tsx
    ├── WorkQuestListSection.tsx
    ├── SideQuestListSection.tsx
    └── DailyQuestListSection.tsx
```

---

## 🔧 Attempted Solutions

### ✅ Attempt #1: Remove `revalidatePath` from daily-sync actions
**Files Modified**:
- `dailyQuestActions.ts` - Removed 4× `revalidatePath('/execution/daily-sync')`
- `sideQuestActions.ts` - Removed 1× `revalidatePath('/execution/daily-sync')`
- `scheduleActions.ts` - Removed 3× `revalidatePath('/execution/daily-sync')`

**Kept**:
- `dailyPlanActions.ts` - Kept `revalidatePath('/planning/main-quests')` (6×)
- `weeklyTaskActions.ts` - Kept `revalidatePath('/planning/main-quests')` (1×)

**Result**:
- ✅ Remove quest works without blink
- ❌ Select operations still blink
- ⚠️ **DO NOT REVERT** - This is the best state achieved so far

---

### ❌ Attempt #2: Remove ALL revalidatePath (CAUSED REGRESSION)
**Files Modified**:
- `dailyPlanActions.ts` - Removed all `revalidatePath('/planning/main-quests')`
- `weeklyTaskActions.ts` - Removed all `revalidatePath`

**Result**:
- ❌ Remove quest BROKE (started blinking again)
- ❌ Select operations still blink

**Status**: **REVERTED** - Changes rolled back

---

### ❌ Attempt #3: Route segment config
**Files Modified**:
- `layout.tsx` - Added `dynamic = 'force-dynamic'`

**Result**: ❌ Still blinks

**Status**: **REVERTED**

---

### ❌ Attempt #4: SWR `keepPreviousData` + `isValidating`
**Files Modified**:
- `useDailyPlanManagement.ts` - Added `keepPreviousData: true`, separated loading states
- `useDailySync.ts` - Added `keepPreviousData: true`

**Result**:
- ❌ Main Quest modal doesn't open
- ❌ Skeleton still appears

**Status**: **REVERTED** by user

---

## 🧩 Code Flow Analysis

### Select Quest Flow (Main/Work/Side/Daily):

1. **User clicks "Select Tasks"**
   ```typescript
   // DailySyncClient.tsx
   onSelectTasks={() => handleOpenModal('main')}
   ```

2. **Modal opens, loads data**
   ```typescript
   // useDailyPlanManagement.ts:377-407
   const handleOpenModal = async (modalType) => {
     setModalState({ showModal: true, modalType, modalLoading: true });
     // ... fetch current selections
     if (mutate) await mutate(); // ← Triggers SWR revalidation
     setModalState({ modalLoading: false });
   }
   ```

3. **User selects tasks, clicks Save**
   ```typescript
   // useDailyPlanManagement.ts:430-491
   const handleSaveSelection = async (newItems) => {
     setModalState({ savingLoading: true });

     // ... prepare items
     await setDailyPlan(selectedDate, allItems); // ← Server Action

     // ✅ CRITICAL: Force re-fetch
     await Promise.all([
       mutateDailyPlan(),  // ← Sets isLoading: true
       mutateTasks()       // ← Sets isLoading: true
     ]);

     setModalState({ showModal: false });
   }
   ```

4. **Page blinks** ⚡
   ```typescript
   // page.tsx:111-113
   {loading ? (
     <DailySyncSkeleton />  // ← Shows because loading: true
   ) : (
     // content
   )}
   ```

### Remove Quest Flow (WORKING):

1. **User clicks Remove**
   ```typescript
   // useDailyPlanManagement.ts:608-654
   const handleRemoveItem = async (itemId) => {
     // Optimistic update
     removeItemOptimistically(taskItemId);

     await removeDailyPlanItem(itemId); // ← Server Action (NO revalidatePath)

     // Invalidate caches
     await Promise.all([...globalMutate(...)]);

     await mutateDailyPlan(); // ← Refetch
   }
   ```

2. **No blink** ✅
   - Why? Same pattern as Select Quest!
   - Difference: `removeDailyPlanItem` has NO `revalidatePath('/planning/main-quests')`?
   - Or: Different timing/async behavior?

---

## 🤔 Unanswered Questions

1. **Why does Remove quest NOT blink but Select quest DOES?**
   - Both call Server Actions
   - Both call `mutateDailyPlan()`
   - Both should trigger `isLoading: true`
   - What's different?

2. **Why does Daily Quest selection also blink?**
   - Initial testing suggested it didn't blink
   - After re-testing, it does blink
   - Uses exact same flow as Main/Work/Side Quest

3. **Is the issue SWR or Next.js Router Cache?**
   - SWR `isLoading` triggers skeleton
   - But what triggers `isLoading` to become true?
   - Server Action automatic revalidation?

4. **Why does `keepPreviousData` break modal opening?**
   - Should only affect data fetching behavior
   - Modal opening shouldn't be affected
   - Need to investigate modal state management

---

## 💡 Potential Solutions to Explore

### Option A: Optimistic UI Updates (Recommended)
**Approach**: Update UI immediately, then sync with server.

```typescript
const handleSaveSelection = async (newItems) => {
  // 1. Update local state immediately (NO await)
  setDailyPlanOptimistic(newItems);

  // 2. Make server call in background
  try {
    await setDailyPlan(selectedDate, allItems);
    // Only refetch on error to correct state
  } catch (error) {
    // Revert optimistic update
    await mutateDailyPlan();
  }
}
```

**Pros**:
- Instant UI feedback
- No skeleton flash
- Better UX

**Cons**:
- Need rollback logic on error
- More complex state management

---

### Option B: Custom Loading State
**Approach**: Don't use SWR's `isLoading` for skeleton display.

```typescript
const [isInitialLoading, setIsInitialLoading] = useState(true);

useEffect(() => {
  if (dailyPlan) setIsInitialLoading(false);
}, [dailyPlan]);

// page.tsx
{isInitialLoading ? <Skeleton /> : <Content />}
```

**Pros**:
- Simple to implement
- No SWR behavior changes needed

**Cons**:
- Manual state management
- May miss genuine loading states

---

### Option C: Debounce SWR Mutations
**Approach**: Prevent rapid consecutive revalidations.

```typescript
const debouncedMutate = debounce(async () => {
  await Promise.all([mutateDailyPlan(), mutateTasks()]);
}, 300);
```

**Pros**:
- Reduces flash frequency
- Simple wrapper

**Cons**:
- Doesn't eliminate flash, just reduces it
- May delay UI updates

---

### Option D: API Routes instead of Server Actions
**Approach**: Use traditional API routes with client-side fetch.

```typescript
// app/api/daily-plan/route.ts
export async function POST(request: Request) {
  const { selectedDate, items } = await request.json();
  // ... update logic
  return Response.json({ success: true });
}

// Client
const handleSaveSelection = async (newItems) => {
  await fetch('/api/daily-plan', {
    method: 'POST',
    body: JSON.stringify({ selectedDate, items: allItems })
  });

  await mutate(); // SWR mutation
}
```

**Pros**:
- More control over cache behavior
- No automatic Next.js revalidation

**Cons**:
- More boilerplate code
- Loses Server Actions benefits

---

### Option E: Investigate Modal + Data Mutation Race Condition
**Approach**: Check if modal state interferes with loading state.

**Investigation Steps**:
1. Add logging to track exact timing of:
   - Modal open/close
   - `isLoading` state changes
   - Server Action start/end
   - SWR mutation start/end

2. Compare Remove quest vs Select quest timing

3. Look for differences in:
   - Modal close timing
   - Data mutation sequence
   - State update order

**Questions to Answer**:
- Does modal close before or after mutation?
- Is there a delay difference?
- Does modal state affect loading calculation?

---

## 📊 Current Code State

### ✅ Changes to KEEP (Attempt #1):
```typescript
// dailyQuestActions.ts, sideQuestActions.ts, scheduleActions.ts
// ✅ Removed: revalidatePath('/execution/daily-sync')
// Only revalidate Server Component pages
revalidatePath('/quests/daily-quests'); // Keep this
```

### ⚠️ Do NOT Touch:
```typescript
// dailyPlanActions.ts, weeklyTaskActions.ts
// Keep these revalidatePath calls - removing causes regression
revalidatePath('/planning/main-quests');
```

---

## 🎯 Next Steps for Investigation

1. **Add Detailed Logging**
   ```typescript
   console.log('[TIMING] Modal opened:', Date.now());
   console.log('[TIMING] Server action start:', Date.now());
   console.log('[TIMING] SWR mutation start:', Date.now());
   console.log('[TIMING] isLoading changed:', loading, Date.now());
   console.log('[TIMING] Modal closed:', Date.now());
   ```

2. **Compare Working vs Broken Flows**
   - Remove quest (working) vs Select quest (broken)
   - Record exact timing differences
   - Identify what's different

3. **Test Optimistic UI (Option A)**
   - Implement for one operation first (e.g., Select Main Quest)
   - Measure if it eliminates blink
   - If successful, apply to others

4. **Review SWR Documentation**
   - Check if there's a better config option
   - Look for examples of preventing loading flashes
   - Review `keepPreviousData` issues on GitHub

---

## 📝 Notes for Future AI/Developer

- **Don't remove** Attempt #1 changes (removed revalidatePath from dailyQuestActions, etc.)
- **Don't modify** `revalidatePath` in dailyPlanActions.ts or weeklyTaskActions.ts
- **Test thoroughly** before proposing solutions - previous attempts broke functionality
- **Keep code quality high** - user rejected verbose solutions
- **User confirmed**: Daily Quest selection ALSO blinks (not just Main/Work/Side)
- **Only working operation**: Remove quest (after Attempt #1)

---

## 🔗 Related Files

- Main page: `src/app/(admin)/execution/daily-sync/page.tsx`
- Hook: `src/app/(admin)/execution/daily-sync/DailyQuest/hooks/useDailyPlanManagement.ts`
- Actions: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/dailyPlanActions.ts`
- SWR config: `src/lib/swr.ts`

---

**Last Investigation Session**: 2026-02-13
**Status**: Awaiting next investigation session with fresh perspective
