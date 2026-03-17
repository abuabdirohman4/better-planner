# Business Rules

This document covers Better Planner-specific business logic, domain rules, and implementation constraints.

---

## 📆 Quarter System

Better Planner uses a unique **13-week quarter planning system** for goal setting and task breakdown.

### Quarter Definitions

- **Q1**: Weeks 1-13 (roughly January - March)
- **Q2**: Weeks 14-26 (roughly April - June)
- **Q3**: Weeks 27-39 (roughly July - September)
- **Q4**: Weeks 40-52 (roughly October - December)

### Quarter Calculation

Quarter dates are calculated dynamically based on the year:

```typescript
// Example: Get Q1 2026 dates
const q1Start = getQuarterStart('Q1', 2026); // '2026-01-01'
const q1End = getQuarterEnd('Q1', 2026);     // '2026-03-31' (approx)

// Get weeks in quarter
const weeks = getWeeksInQuarter('Q1', 2026); // Array of 13 weeks
```

**Utility Location**: `src/lib/quarterUtils.ts`

### Quarter Planning Flow

1. **Set Quarter Goals** - User defines high-level goals for 13-week period
2. **Break Down to Weeks** - Goals divided into weekly milestones
3. **Daily Tasks** - Weekly milestones become daily tasks
4. **Execution** - Track daily progress toward quarterly goals

**Components**: `src/app/(admin)/planning/`

---

## 🎯 Quest System

"Quests" are major goals/projects that users work toward. Quests are categorized by type and scope.

### Quest Types

#### Daily Quests
- **Purpose**: Day-to-day recurring tasks
- **Examples**: Morning routine, exercise, learning
- **Duration**: Single day or recurring daily
- **Location**: `src/app/(admin)/quests/daily/`

#### Work Quests
- **Purpose**: Professional/project tasks
- **Examples**: Client projects, work deliverables, career goals
- **Duration**: Days to weeks
- **Location**: `src/app/(admin)/quests/work/`

#### Side Quests
- **Purpose**: Personal development and side projects
- **Examples**: Learning new skill, hobby projects, health goals
- **Duration**: Weeks to months
- **Location**: `src/app/(admin)/quests/side/`

### Quest Status Flow

```
planning → active → completed
         ↓
      on-hold
```

- **planning**: Quest is being designed, not started yet
- **active**: Currently working on this quest
- **completed**: Quest finished successfully
- **on-hold**: Temporarily paused (can resume to active)

### Quest Priority Levels

```typescript
type Priority = "low" | "medium" | "high" | "urgent";
```

- **urgent**: Drop everything, do this now (P0)
- **high**: Important, schedule soon (P1)
- **medium**: Normal priority (P2)
- **low**: Nice-to-have, backlog (P3-P4)

---

## ⏱️ Pomodoro Timer & Activity Tracking

Better Planner includes a built-in Pomodoro timer for focused work sessions.

### Timer Rules

- **Focus Session**: 25 minutes (default)
- **Short Break**: 5 minutes
- **Long Break**: 15 minutes (after 4 focus sessions)

### Activity Log Types

```typescript
type ActivityType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'BREAK';
```

- **FOCUS**: User working on a task (linked to task_id)
- **SHORT_BREAK**: 5-minute break between sessions
- **LONG_BREAK**: 15-minute break after 4 sessions
- **BREAK**: Manual break (user-initiated)

### Activity Log Data Structure

Activities are stored in `activity_logs` table:

```typescript
interface ActivityLog {
  id: string;
  user_id: string;
  task_id?: string;        // Linked task (for FOCUS type)
  milestone_id?: string;   // Linked milestone
  quest_id?: string;       // Linked quest
  type: ActivityType;
  start_time: string;      // ISO 8601 timestamp (UTC)
  end_time: string;        // ISO 8601 timestamp (UTC)
  duration_minutes: number;
  what_done?: string;      // Journal: What did you accomplish?
  what_think?: string;     // Journal: What did you learn/think?
  created_at: string;
  updated_at: string;
}
```

**Location**: `src/app/(admin)/execution/daily-sync/ActivityLog/`

---

## 📅 Daily Sync

Daily Sync is the core execution interface where users plan and track daily tasks.

### Daily Plan Structure

```typescript
interface DailyPlan {
  id: string;
  user_id: string;
  date: string;           // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
}

interface DailyPlanItem {
  id: string;
  daily_plan_id: string;
  task_id: string;        // Linked task
  type: 'DAILY' | 'WORK' | 'SIDE';  // Quest type
  order: number;          // Display order
  created_at: string;
}
```

### Daily Sync Flow

1. **Morning**: User selects tasks for the day (from Daily/Work/Side quests)
2. **Execution**: User works on tasks using Pomodoro timer
3. **Tracking**: Activity logs record focus sessions and breaks
4. **Review**: User reviews what was accomplished and journals

**Location**: `src/app/(admin)/execution/daily-sync/`

---

## 🗓️ Activity Plan (Time Blocking)

Activity Plan allows users to schedule tasks at specific times throughout the day.

### Schedule Rules

- **Multiple Schedules**: A task can be scheduled multiple times
  - Example: Task A → 2 sessions at 10:00, 1 session at 14:00
- **Session Count**: Each schedule block has `session_count` (number of Pomodoro sessions)
- **Duration**: Calculated as `session_count * 25 minutes` (default focus session length)

### Conflict Detection

Schedules can overlap, but system warns user with visual indicator:

```typescript
function hasConflict(schedule1: Schedule, schedule2: Schedule): boolean {
  const s1Start = new Date(schedule1.scheduled_start_time);
  const s1End = new Date(schedule1.scheduled_end_time);
  const s2Start = new Date(schedule2.scheduled_start_time);
  const s2End = new Date(schedule2.scheduled_end_time);

  return s1Start < s2End && s2Start < s1End;
}
```

**Visual Indicator**: Yellow border on conflicting schedule blocks

**Utility Location**: `src/app/(admin)/execution/daily-sync/DailyQuest/utils/scheduleUtils.ts`

---

## 📊 Form Handling Patterns

### Standard Form Pattern

```typescript
const [form, setForm] = useState({ field1: "", field2: "" });

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  try {
    await submitAction(form);
    toast.success("Success!");
  } catch (error) {
    toast.error(handleApiError(error));
  }
};
```

### Form Validation

- **Client-side**: HTML5 attributes (`required`, `minLength`, `pattern`)
- **Server-side**: Validate in server actions before database operations
- **Error Display**: Toast notifications for user feedback

---

## 🔄 Data Fetching Strategy

Better Planner uses a hybrid approach for data fetching.

### Server Actions (Primary Pattern)

Use for all database operations:

```typescript
// actions/example.ts
"use server";

import { createClient } from '@/lib/supabase/server';

export async function getData() {
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

### SWR Hooks (Client-Side)

Use for data fetching with caching:

```typescript
import useSWR from 'swr';
import { getData } from '@/actions/example';

export function useData() {
  const { data, error, isLoading, mutate } = useSWR(
    'data-key',
    getData,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
    }
  );

  return { data, error, isLoading, mutate };
}
```

### When to Use Which

| Pattern | Use For | Example |
|---------|---------|---------|
| Server Action + SWR | Reads with caching | List of tasks, activity logs |
| Direct Server Action | Mutations | Create task, update status |
| Custom SWR Config | Stable data | User profile, app config |

**For detailed SWR patterns, see [`testing-guidelines.md#swr-loading-states`](testing-guidelines.md#swr-loading-states)**

---

## 🎨 UI/UX Guidelines

### Loading States

- **Initial Load**: Show skeleton screens
- **Background Revalidation**: Don't show skeleton (silent update)
- **Mutations**: Show spinner or loading button state

### Error Handling

- **User-Friendly Messages**: Don't expose technical errors
- **Toast Notifications**: Use Sonner for success/error feedback
- **Form Errors**: Display inline near affected field

### Mobile-First Design

- **Minimum Width**: 320px (iPhone SE)
- **Touch Targets**: Minimum 44x44px
- **Responsive Breakpoints**: Use Tailwind's default breakpoints

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login/Signup**: Supabase Auth (email/password or Google OAuth)
2. **Session**: Stored in cookies (HTTP-only, secure)
3. **Redirect**: Unauthenticated users → `/login`
4. **Logout**: Clear session and SWR cache

### Authorization (RLS)

All user data is isolated via Row Level Security (RLS):

```sql
-- Example RLS policy
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

**Testing**: Always test with multiple user accounts to verify isolation.

---

## 🚨 Critical Constraints

### Date Handling

- **ALWAYS** store timestamps in UTC (see [`timezone-handling.md`](timezone-handling.md))
- **NEVER** use local time in database
- **ALWAYS** convert to WIB for display to user

### Cascade Deletes

- **ALWAYS** backup child records before parent delete (see [`database-operations.md#cascade-delete-chain`](database-operations.md#cascade-delete-chain))
- **NEVER** assume CASCADE won't affect your data

### State Management

- **NEVER** hardcode dates or months (always use `new Date()`)
- **ALWAYS** use helper functions for default values
- **ALWAYS** clear SWR cache on login/logout

---

## 📚 Related Documentation

- **Architecture Patterns**: [`architecture-patterns.md`](architecture-patterns.md)
- **Database Operations**: [`database-operations.md`](database-operations.md)
- **Testing Guidelines**: [`testing-guidelines.md`](testing-guidelines.md)
- **Timezone Handling**: [`timezone-handling.md`](timezone-handling.md)
- **Beads Workflow**: [`beads-workflow.md`](beads-workflow.md)
