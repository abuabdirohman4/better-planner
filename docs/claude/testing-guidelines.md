# Testing Guidelines

This document covers testing practices, patterns, and common pitfalls for Better Planner.

---

## 🚨 Manual Testing Checklist

Better Planner currently uses manual testing. Before marking any feature as complete, verify:

### User Interactions
- [ ] All buttons respond correctly
- [ ] Forms validate input properly
- [ ] Error messages display when appropriate
- [ ] Success messages appear after actions
- [ ] Loading states show during async operations

### Error States
- [ ] Network errors handled gracefully
- [ ] Invalid input rejected with clear messages
- [ ] Authentication failures redirect to login
- [ ] 404 pages for invalid routes

### Loading States
- [ ] Skeleton screens display during initial load
- [ ] Spinners show for long operations
- [ ] No "flash" of empty content (see SWR patterns below)

### Responsive Design
- [ ] Mobile layout works (320px minimum)
- [ ] Tablet layout adapts properly
- [ ] Desktop layout uses available space
- [ ] Touch targets are appropriately sized

### Drag-and-Drop
- [ ] Items can be grabbed and moved
- [ ] Drop zones highlight correctly
- [ ] Changes persist after drop
- [ ] Keyboard accessibility works

### Quarter Planning
- [ ] Quarter dates calculate correctly (13-week cycles)
- [ ] Goals sync with weekly breakdown
- [ ] Weekly → Daily task propagation works
- [ ] Quarter transitions handle edge cases

### Authentication
- [ ] Login/logout flows work
- [ ] Session persistence across page refreshes
- [ ] Protected routes redirect unauthenticated users
- [ ] User data isolation (can't see other users' data)

### Real-time Updates
- [ ] SWR revalidation on focus works
- [ ] Mutations update UI optimistically
- [ ] Background revalidation doesn't cause flicker

---

## 🔄 SWR & Loading States (Avoiding "Blink" Issues)

### Problem: Page "Blinks" on Revalidation

When SWR revalidates data in the background, `isLoading` becomes `true` again, causing skeleton screens to flash even though data is already displayed.

**Root Causes:**
1. Unstable SWR keys (keys change on every render)
2. Inner skeleton gates that trigger on ANY loading state
3. Composing all loading states for main skeleton

---

### Pattern #1: Stable SWR Keys

❌ **WRONG: Unstable keys**
```typescript
// BAD: Key changes every time a task is added/removed
const taskIds = tasks.map(t => t.id);
const { data, isLoading } = useSWR(['sessions', taskIds.join(',')], fetcher);
// Every task change → new key → isLoading=true → skeleton blink
```

✅ **CORRECT: Stable keys**
```typescript
// GOOD: Key doesn't change unless user/date changes
const { data, isLoading } = useSWR(['sessions', userId, date], fetcher);

// Filter client-side instead
const filteredData = data?.filter(session => taskIds.includes(session.task_id));
```

**When to use dynamic keys:** Only when you truly need a new request (e.g., different user, different date).

---

### Pattern #2: Skeleton Loading Gates

❌ **WRONG: Show skeleton on ANY loading state**
```tsx
function MyComponent() {
  const { data, isLoading } = useSWR('key', fetcher);

  // BAD: Flashes skeleton on background revalidation
  if (isLoading) return <Skeleton />;

  return <Content data={data} />;
}
```

✅ **CORRECT: Only show skeleton on initial load**
```tsx
function MyComponent() {
  const { data, isLoading } = useSWR('key', fetcher);

  // GOOD: Only show skeleton if we have NO data yet
  const hasData = data !== undefined;
  const isInitialLoad = !hasData && isLoading;

  if (isInitialLoad) return <Skeleton />;

  return <Content data={data} />;
}
```

**Pattern explanation:**
- `isInitialLoad` is only `true` when `data === undefined` AND `isLoading === true`
- Once data is fetched, `hasData` becomes `true`, so skeleton never shows again
- Background revalidation updates data silently without flicker

---

### Pattern #3: Composition of Loading States

❌ **WRONG: Combine all loading states for main skeleton**
```typescript
function MyPage() {
  const { data: mainData, isLoading: mainLoading } = useSWR('main', fetcher);
  const { data: secondary, isLoading: secondaryLoading } = useSWR('secondary', fetcher);

  // BAD: Secondary data loading triggers main page skeleton
  const pageLoading = mainLoading || secondaryLoading;

  if (pageLoading) return <PageSkeleton />;

  return <Page main={mainData} secondary={secondary} />;
}
```

✅ **CORRECT: Separate critical vs non-critical loading**
```typescript
function MyPage() {
  const { data: mainData, isLoading: mainLoading } = useSWR('main', fetcher);
  const { data: secondary, isLoading: secondaryLoading } = useSWR('secondary', fetcher);

  // GOOD: Main skeleton only depends on critical data
  const hasMainData = mainData !== undefined;
  const isInitialLoad = !hasMainData && mainLoading;

  if (isInitialLoad) return <PageSkeleton />;

  return (
    <Page main={mainData}>
      {/* Handle secondary loading locally */}
      {secondaryLoading && !secondary ? (
        <SecondarySkeleton />
      ) : (
        <SecondaryContent data={secondary} />
      )}
    </Page>
  );
}
```

**When to use this pattern:**
- Main content is critical (page can't render without it)
- Secondary content is optional (charts, stats, recommendations)
- You want to show main content ASAP even if secondary is still loading

---

### Pattern #4: Custom SWR Config for Stable Data

For data that rarely changes, use custom SWR config:

```typescript
export function useStableData() {
  const { data, error, isLoading, mutate } = useSWR(
    'stable-data-key',
    fetcher,
    {
      revalidateOnFocus: false,           // Don't revalidate on window focus
      revalidateOnReconnect: false,       // Don't revalidate on network reconnect
      dedupingInterval: 10 * 60 * 1000,   // 10 minutes
      revalidateIfStale: false,           // Don't revalidate if data exists
    }
  );

  return { data, error, isLoading, mutate };
}
```

**Use this for:**
- User profile data
- App configuration
- Static reference data (categories, tags, etc.)

**Don't use this for:**
- Real-time data (activity logs, timer sessions)
- User-modified data (tasks, goals, schedules)

---

## 🕒 Timezone Testing Checklist

Before committing any date/time related code, verify:

### 1. Storage Test ✅
Create event at **17:00 WIB** → Check database shows **10:00 UTC same day**

```typescript
// Test code
const wibTime = '2026-02-13T17:00:00+07:00';
const utcExpected = '2026-02-13T10:00:00.000Z';

await createSchedule(wibTime);
const dbRecord = await getScheduleFromDB();

assert(dbRecord.scheduled_start_time === utcExpected);
```

### 2. Display Test ✅
Database has **10:00 UTC** → UI shows **17:00 WIB** to user

```typescript
// Test code
const utcTime = '2026-02-13T10:00:00.000Z';
const wibExpected = '17:00';

const displayTime = formatTimeForDisplay(utcTime);

assert(displayTime === wibExpected);
```

### 3. Query Test ✅
Filter for **Feb 13 WIB** → Returns events from **Feb 12 17:00 UTC** to **Feb 13 16:59 UTC**

```typescript
// Test code
const dateWIB = '2026-02-13';
const expectedStartUTC = '2026-02-12T17:00:00.000Z';
const expectedEndUTC = '2026-02-13T16:59:59.999Z';

const events = await getEventsForDate(dateWIB);

assert(events[0].start_time >= expectedStartUTC);
assert(events[0].end_time <= expectedEndUTC);
```

### 4. Edge Cases ✅
Test these critical times:
- **Midnight (00:00 WIB)**: Maps to 17:00 UTC previous day
- **Noon (12:00 WIB)**: Maps to 05:00 UTC same day
- **End of day (23:59 WIB)**: Maps to 16:59 UTC same day

```typescript
// Test midnight
assert('2026-02-13T00:00:00+07:00' → '2026-02-12T17:00:00.000Z');

// Test noon
assert('2026-02-13T12:00:00+07:00' → '2026-02-13T05:00:00.000Z');

// Test end of day
assert('2026-02-13T23:59:59+07:00' → '2026-02-13T16:59:59.000Z');
```

### 5. Cross-Day Events ✅
Event from **23:00 WIB to 01:00 WIB next day** → Spans two UTC days

```typescript
// Event: Feb 13 23:00 WIB - Feb 14 01:00 WIB
// UTC:   Feb 13 16:00 UTC - Feb 13 18:00 UTC (same day in UTC!)

const start = '2026-02-13T23:00:00+07:00';
const end = '2026-02-14T01:00:00+07:00';

const startUTC = toUTC(start); // '2026-02-13T16:00:00.000Z'
const endUTC = toUTC(end);     // '2026-02-13T18:00:00.000Z'

assert(startUTC < endUTC); // Same day in UTC
```

**For complete timezone guide with code examples, see [`timezone-handling.md`](timezone-handling.md)**

---

## 📊 Performance Testing

### Page Load Performance

Check these metrics in Chrome DevTools:

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

### SWR Cache Performance

Verify cache behavior:

```typescript
// Check cache hit rate
console.log(cache.keys()); // Should see keys for cached data

// Verify deduplication
const promise1 = fetcher();
const promise2 = fetcher(); // Should reuse promise1
assert(promise1 === promise2);
```

### Database Query Performance

Use Supabase Dashboard to check query performance:
- Queries should complete in < 100ms
- Avoid N+1 queries (use joins)
- Add indexes for frequently filtered columns

---

## 🔧 Development Commands

```bash
# Type checking
npm run type-check       # TypeScript check (no emit)

# Code formatting
npm run format           # Format with Prettier
npm run format:check     # Check code formatting

# Combined
npm run fix:all          # Format + type-check
```

---

## 🚀 Future: Automated Testing (TDD)

Better Planner does not currently use automated testing, but when implementing TDD in the future:

### Recommended Setup

- **Unit Tests**: Vitest (fast, ESM-native)
- **E2E Tests**: Playwright (cross-browser)
- **Component Tests**: React Testing Library

### TDD Workflow (RED → GREEN → REFACTOR)

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass test
3. **REFACTOR**: Clean up code while tests still pass

### What to Test

**REQUIRED for:**
- Business logic (quarter calculations, quest continuity)
- Data transformations (timezone conversions)
- Complex algorithms (overlap detection, schedule conflicts)
- Permission systems (user data isolation)
- Critical features (Pomodoro timer, activity tracking)

**SKIP for:**
- Pure presentational UI
- Trivial getters/setters
- Config files
- Type definitions

### Example Test Structure

```typescript
// Example: Quarter calculation test
describe('Quarter Utils', () => {
  it('should calculate Q1 as weeks 1-13', () => {
    const q1Start = getQuarterStart('Q1', 2026);
    const q1End = getQuarterEnd('Q1', 2026);

    expect(q1Start).toBe('2026-01-01');
    expect(q1End).toBe('2026-03-31');
  });

  it('should handle 13-week cycle correctly', () => {
    const weeks = getWeeksInQuarter('Q1', 2026);
    expect(weeks).toHaveLength(13);
  });
});
```

---

## 📚 Related Documentation

- **Timezone Handling**: [`timezone-handling.md`](timezone-handling.md)
- **Database Operations**: [`database-operations.md`](database-operations.md)
- **Architecture Patterns**: [`architecture-patterns.md`](architecture-patterns.md)
- **Business Rules**: [`business-rules.md`](business-rules.md)
