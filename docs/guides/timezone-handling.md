# Timezone Handling Guide

> **TLDR**: Always store UTC in database, display WIB/local time to user, test edge cases.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Why UTC Storage?](#why-utc-storage)
3. [Common Pitfalls](#common-pitfalls)
4. [Code Examples](#code-examples)
5. [Date Range Queries](#date-range-queries)
6. [Testing Checklist](#testing-checklist)
7. [Debugging Tips](#debugging-tips)

---

## Core Principles

Better Planner uses **UTC storage with WIB display** pattern for all timestamps:

### 1. Database Storage: UTC Only ⚠️

- All `TIMESTAMPTZ` columns in Supabase store **Coordinated Universal Time (UTC)**
- Supabase automatically converts incoming timestamps to UTC
- Example: User creates schedule at **17:00 WIB (GMT+7)** → stored as **10:00 UTC**

### 2. Display to User: Local Timezone (WIB)

- Convert UTC timestamps to WIB (Asia/Jakarta) when showing to user
- Use JavaScript's `toLocaleString()` with timezone option
- Format: `new Date(utcTimestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })`

### 3. User Input: Convert to UTC Before Saving

- User inputs local time in WIB
- Convert to UTC before sending to database
- Preserve timezone context during conversion

---

## Why UTC Storage?

### Benefits ✅

1. **Future-proof**: Ready for multi-timezone support
   - Collaboration features with users in different countries
   - International expansion
   - Third-party integrations

2. **Consistent Calculations**: Duration always accurate
   - `endTime - startTime` works correctly
   - No Daylight Saving Time (DST) issues (though Indonesia doesn't have DST)

3. **Database Portability**: No ambiguity
   - Moving servers across timezones
   - Backup/restore operations
   - Database migrations

4. **Industry Standard**: Well-documented, predictable
   - Most libraries and frameworks expect UTC
   - Easy to find solutions to common problems

### Trade-offs ❌

1. **Less Human-Readable**: Database values need conversion
   - `2026-02-13T10:00:00Z` in DB = `17:00 WIB` to user
   - Manual debugging requires mental conversion

2. **Slightly More Complex Code**: Conversion required
   - Both when saving (WIB → UTC)
   - And when displaying (UTC → WIB)

### Better Planner's Choice

**UTC storage is the correct approach** despite current single-user, single-timezone usage because:
- Prevents technical debt
- Avoids costly refactoring later
- Follows industry best practices

---

## Common Pitfalls

### Pitfall #1: Direct `.toISOString()` Without Context ❌

**Problem:**
```typescript
// User selects 17:00 WIB on Feb 13, 2026
const localDate = new Date('2026-02-13T17:00:00');
const isoString = localDate.toISOString();
// Result: "2026-02-13T10:00:00.000Z" ✅ Correct UTC!
// BUT: If browser timezone is NOT WIB, this will be wrong!
```

**Issue**: `new Date()` assumes browser's local timezone. If browser is set to different timezone, conversion will be incorrect.

**Solution**: Always explicitly specify timezone when creating Date objects from user input.

---

### Pitfall #2: Timezone Assumption in Date Construction ❌

**Problem:**
```typescript
// BAD: Assumes browser timezone is WIB
const startDate = new Date(); // What if user's browser is in GMT?
startDate.setHours(17, 0, 0, 0);
```

**Solution:**
```typescript
// GOOD: Explicit timezone handling
const startDateStr = '2026-02-13T17:00:00+07:00'; // Explicit WIB offset
const startDate = new Date(startDateStr);
```

---

### Pitfall #3: Query with Local Date Strings ❌

**Problem:**
```typescript
const date = '2026-02-13';
await supabase
  .from('task_schedules')
  .gte('scheduled_start_time', `${date}T00:00:00.000Z`) // ❌ This is UTC!
  .lte('scheduled_end_time', `${date}T23:59:59.999Z`);  // ❌ Misses WIB events!
```

**Issue**: `2026-02-13T00:00:00.000Z` is Feb 13 00:00 **UTC**, which is Feb 13 07:00 **WIB**. We miss events from 00:00-06:59 WIB!

**Solution**: See [Date Range Queries](#date-range-queries) section.

---

### Pitfall #4: Displaying UTC Directly to User ❌

**Problem:**
```typescript
const { data } = await supabase
  .from('task_schedules')
  .select('scheduled_start_time');

console.log(data.scheduled_start_time);
// "2026-02-13T10:00:00.000Z" ❌ User sees UTC!
```

**Solution:**
```typescript
const localTime = new Date(data.scheduled_start_time).toLocaleString('id-ID', {
  timeZone: 'Asia/Jakarta',
  dateStyle: 'medium',
  timeStyle: 'short'
});
// "13 Feb 2026, 17.00" ✅ User sees WIB!
```

---

## Code Examples

### Example 1: Storing User Input (WIB → UTC)

```typescript
// ScheduleBlockForm.tsx - User selects time via dropdown
const handleStartTimeChange = (hours: number, minutes: number) => {
  // Create Date object with selected time (browser local = WIB)
  const newDate = new Date(startDate); // Copy existing date
  newDate.setHours(hours);              // Set hours (0-23)
  newDate.setMinutes(minutes);          // Set minutes (0-59)
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  setStartDate(newDate);
};

const handleSubmit = () => {
  // Convert to UTC for storage
  const utcTimestamp = startDate.toISOString();
  // 17:00 WIB → "2026-02-13T10:00:00.000Z" ✅

  await createSchedule(taskId, utcTimestamp, ...);
};
```

**Key Points:**
- `new Date()` uses browser's local timezone (assumed WIB in Indonesia)
- `.setHours()` and `.setMinutes()` modify local time
- `.toISOString()` automatically converts to UTC

---

### Example 2: Displaying UTC to User (UTC → WIB)

```typescript
// Display schedule time to user
const schedule = await getTaskSchedules(taskId);

// Method 1: Using toLocaleString (recommended)
const displayTime = new Date(schedule.scheduled_start_time).toLocaleString('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit'
}); // "17.00" ✅

// Method 2: Using date-fns with timezone
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const wibDate = utcToZonedTime(schedule.scheduled_start_time, 'Asia/Jakarta');
const displayTime = format(wibDate, 'HH:mm'); // "17:00" ✅
```

---

### Example 3: Date Range Queries (WIB Date → UTC Range)

```typescript
// scheduleActions.ts - Get all schedules for a WIB date
export async function getScheduledTasksByDate(date: string) {
  // date format: 'YYYY-MM-DD' representing a WIB date
  // Example: '2026-02-13' means Feb 13 in WIB

  // Convert WIB date boundaries to UTC
  // Feb 13 00:00:00 WIB = Feb 12 17:00:00 UTC (WIB is UTC+7)
  const startOfDayWIB = new Date(`${date}T00:00:00+07:00`);
  const startOfDay = startOfDayWIB.toISOString(); // "2026-02-12T17:00:00.000Z"

  // Feb 13 23:59:59.999 WIB = Feb 13 16:59:59.999 UTC
  const endOfDayWIB = new Date(`${date}T23:59:59.999+07:00`);
  const endOfDay = endOfDayWIB.toISOString(); // "2026-02-13T16:59:59.999Z"

  const { data } = await supabase
    .from('task_schedules')
    .gte('scheduled_start_time', startOfDay)   // ✅ Correct UTC range
    .lte('scheduled_end_time', endOfDay);

  return data;
}
```

**Breakdown:**
- Input: `'2026-02-13'` (WIB date)
- WIB range: `Feb 13 00:00:00 WIB` to `Feb 13 23:59:59 WIB`
- UTC range: `Feb 12 17:00:00 UTC` to `Feb 13 16:59:59 UTC`
- Query fetches all events within this UTC range

---

### Example 4: Creating Schedule from User Input

```typescript
// ActivityLog.tsx - Handle task drop to calendar
const handleTaskDrop = async (taskData: any, startMinutes: number) => {
  // startMinutes = minutes from midnight WIB (0-1439)
  const hours = Math.floor(startMinutes / 60);  // 17 (for 5 PM)
  const mins = startMinutes % 60;               // 0

  // Create WIB date
  const startDate = new Date(date + 'T00:00:00');
  startDate.setHours(hours, mins, 0, 0);
  // Result: Feb 13 17:00 WIB (local time)

  const duration = 30; // minutes
  const endDate = new Date(startDate.getTime() + duration * 60000);
  // Result: Feb 13 17:30 WIB (local time)

  // Convert to UTC for storage
  await createSchedule(
    taskId,
    startDate.toISOString(),  // "2026-02-13T10:00:00.000Z" ✅
    endDate.toISOString(),    // "2026-02-13T10:30:00.000Z" ✅
    duration,
    1
  );
};
```

---

## Date Range Queries

### Pattern: WIB Date to UTC Range

When querying for a specific WIB date, always convert date boundaries:

```typescript
// ❌ WRONG: Query with UTC midnight
const wrong = await supabase
  .from('schedules')
  .gte('start_time', `${date}T00:00:00.000Z`)
  .lte('end_time', `${date}T23:59:59.999Z`);
// Misses events from Feb 13 00:00-06:59 WIB!

// ✅ CORRECT: Convert WIB boundaries to UTC
const startUTC = new Date(`${date}T00:00:00+07:00`).toISOString();
const endUTC = new Date(`${date}T23:59:59.999+07:00`).toISOString();

const correct = await supabase
  .from('schedules')
  .gte('start_time', startUTC)
  .lte('end_time', endUTC);
```

### Handling Cross-Day Events

Events that span midnight WIB may span two UTC days:

```typescript
// Event: Feb 13 23:00 WIB to Feb 14 01:00 WIB (2 hours)
// UTC: Feb 13 16:00 UTC to Feb 13 18:00 UTC (same day!)

// Event: Feb 13 20:00 WIB to Feb 14 03:00 WIB (7 hours)
// UTC: Feb 13 13:00 UTC to Feb 13 20:00 UTC (same day!)

// Always use start_time and end_time ranges, not just date comparisons
```

---

## Testing Checklist

Before committing any timezone-related code, verify:

### 1. Storage Test ✅
```
User creates schedule at 17:00 WIB on Feb 13
→ Database stores: 2026-02-13T10:00:00.000Z (10:00 UTC same day)
```

**How to verify:**
- Create schedule via UI at 17:00
- Check database directly: `SELECT scheduled_start_time FROM task_schedules;`
- Should see `10:00 UTC` on same date

---

### 2. Display Test ✅
```
Database has: 2026-02-13T10:00:00.000Z
→ UI displays: 17:00 WIB to user
```

**How to verify:**
- Insert test data with UTC timestamp
- Check UI shows correct WIB time
- Use browser DevTools to inspect displayed values

---

### 3. Query Test ✅
```
Filter for Feb 13 WIB
→ Returns events from Feb 12 17:00 UTC to Feb 13 16:59 UTC
```

**How to verify:**
- Create schedules at various times
- Query for specific WIB date
- Verify correct events returned (and no duplicates)

---

### 4. Edge Cases ✅

Test these specific times:

**Midnight (00:00 WIB):**
- Create schedule at 00:00 WIB Feb 13
- Should store as 17:00 UTC Feb 12 (previous day!)
- Should appear only on Feb 13 WIB when queried

**Noon (12:00 WIB):**
- Create schedule at 12:00 WIB Feb 13
- Should store as 05:00 UTC Feb 13 (same day)

**End of Day (23:59 WIB):**
- Create schedule at 23:59 WIB Feb 13
- Should store as 16:59 UTC Feb 13 (same day)
- Should appear only on Feb 13 WIB when queried

---

### 5. Cross-Day Events ✅
```
Event from 23:00 WIB Feb 13 to 01:00 WIB Feb 14 (2 hours)
→ Stores as: Feb 13 16:00 UTC to Feb 13 18:00 UTC
→ Appears on: Feb 13 WIB (start date) and Feb 14 WIB (end date)
```

**How to verify:**
- Create event spanning midnight WIB
- Verify appears on both dates when queried
- Verify duration calculations are correct

---

## Debugging Tips

### Tip 1: Use Console Logging

```typescript
const startDate = new Date('2026-02-13T17:00:00');
console.log('Local:', startDate.toString());
// "Thu Feb 13 2026 17:00:00 GMT+0700 (WIB)"

console.log('ISO (UTC):', startDate.toISOString());
// "2026-02-13T10:00:00.000Z"

console.log('Time parts:', {
  hours: startDate.getHours(),      // 17 (local)
  UTChours: startDate.getUTCHours() // 10 (UTC)
});
```

---

### Tip 2: Check Browser Timezone

```typescript
// Verify browser timezone
console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
// Should be: "Asia/Jakarta" in Indonesia
```

**Important**: If browser timezone is NOT Asia/Jakarta, Date object behavior will differ!

---

### Tip 3: Database Direct Query

```sql
-- Check raw UTC values in database
SELECT
  id,
  scheduled_start_time,
  scheduled_end_time,
  -- Convert to WIB for verification
  scheduled_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as start_wib,
  scheduled_end_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as end_wib
FROM task_schedules
WHERE DATE(scheduled_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') = '2026-02-13';
```

---

### Tip 4: Use Known Test Cases

Create test schedules with these known conversions:

| WIB Time | UTC Time | Notes |
|----------|----------|-------|
| 2026-02-13 00:00 WIB | 2026-02-12 17:00 UTC | Midnight WIB = previous day UTC |
| 2026-02-13 07:00 WIB | 2026-02-13 00:00 UTC | 7 AM WIB = midnight UTC |
| 2026-02-13 12:00 WIB | 2026-02-13 05:00 UTC | Noon WIB |
| 2026-02-13 17:00 WIB | 2026-02-13 10:00 UTC | 5 PM WIB |
| 2026-02-13 23:59 WIB | 2026-02-13 16:59 UTC | End of day WIB |

---

## Quick Reference

### WIB to UTC Conversion

```
WIB = UTC + 7 hours
UTC = WIB - 7 hours

Example:
17:00 WIB = 10:00 UTC (same day)
00:00 WIB = 17:00 UTC (previous day!)
```

### Code Patterns

```typescript
// ✅ Store UTC
const utc = localDate.toISOString();

// ✅ Display WIB
const wib = new Date(utc).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

// ✅ Query WIB date
const start = new Date(`${date}T00:00:00+07:00`).toISOString();
const end = new Date(`${date}T23:59:59.999+07:00`).toISOString();
```

---

## See Also

- [CLAUDE.md - Timezone & Date Handling Section](../CLAUDE.md#critical-timezone--date-handling)
- [MDN: Date.prototype.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [MDN: Date.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
- [Supabase: Working with Timestamps](https://supabase.com/docs/guides/database/postgres/date-time)
