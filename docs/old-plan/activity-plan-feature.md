# Activity Plan - Time Blocking Feature

**Issue**: bp-oaa
**Priority**: P2
**Type**: Feature
**Created**: 2026-02-12

## Overview

Fitur time blocking yang memungkinkan user merencanakan kapan task akan dikerjakan dengan visual calendar timeline. Terintegrasi dengan ActivityLog card menggunakan segmented control toggle.

## User Requirements Summary

✅ **Input Method**: Drag & drop (desktop) + Modal time picker (mobile)
✅ **Placement**: Gabung di ActivityLog card dengan tab "Plan | Actual"
✅ **Task Source**: Hanya tasks yang user pilih untuk di-schedule (opt-in)
✅ **Schedule UI**: Menu item "Schedule Time" di 3-dot menu TaskItemCard
✅ **Scheduled Indicator**: Icon jam kecil di quest cards (single icon regardless of schedule count)
✅ **Conflict Handling**: Allow overlap dengan visual warning (yellow/orange)
✅ **Duration**: Gunakan focus_duration × session_count (per block)
✅ **Checklist Tasks**: Bisa di-schedule sebagai marker (tanpa duration block)
✅ **Multiple Schedules**: Task bisa di-schedule berkali-kali (split time blocks)
✅ **Block Display**: Simplified - hanya icon + title (waktu & sesi visible dari posisi & tinggi block)

## Core Features

### 1. Segmented Control Toggle (Plan | Actual)

- **Plan Mode**: Timeline untuk scheduled tasks (planning view)
- **Actual Mode**: Timeline untuk completed activities (existing ActivityLog)
- Clean iOS-style segmented control di header card
- State persisted di uiPreferencesStore (Zustand)

### 2. Schedule Task from Quest Cards

**Location**: TaskItemCard 3-dot menu

**Menu Item**: "Schedule Time"
- Opens ScheduleManagementModal
- **Multiple Schedules Support**: User dapat menambahkan multiple time blocks untuk satu task
- Example: Task dengan 3 sessions bisa split: 2 sessions jam 10, 1 session jam 14
- Input per block:
  - Start time (HH:MM)
  - Session count untuk block ini (slider 1-N)
  - Duration auto-calculated: `focus_duration × session_count`
- Validation: Total session_count dari semua blocks ≤ daily_session_target
- Save to `task_schedules` table (bukan daily_plan_items)

**Scheduled Indicator**:
- Small clock icon (🕐) next to task title
- Visible when task memiliki ≥1 schedule
- Click icon → open ScheduleManagementModal untuk lihat/edit semua schedules

### 3. Activity Plan Calendar View

Reuse & extend CalendarView architecture:

**Components**:
- `ActivityPlanView.tsx` - Main planning calendar
- `ScheduledTaskBlock.tsx` - Task block on timeline (draggable on desktop)
- `TaskMarker.tsx` - Checkpoint marker for checklist tasks
- `TimePickerModal.tsx` - Time input modal (mobile & fallback)

**Features**:
- Hourly grid (reuse HourlyGrid component)
- Dynamic/24h view toggle (like ActivityLog)
- Color-coded by quest type (Main/Work/Side/Daily)
- Drag-to-reschedule (desktop only, using @dnd-kit)
- Tap block → TimePickerModal to edit (mobile & desktop)
- Visual overlap warning (yellow border or indicator)

**Drag & Drop Behavior (Desktop)**:
- DndContext with PointerSensor
- Snap to 15-minute intervals
- Update scheduled_start_time on drop
- Optimistic UI update with SWR mutate

**Mobile Behavior**:
- Tap block → TimePickerModal
- No drag functionality (touch handled as tap)

### 4. Conflict Detection

- Check overlapping time ranges before save
- If overlap detected:
  - Show visual warning (yellow/orange border on blocks)
  - Add warning badge/icon on conflicting tasks
  - Do NOT prevent scheduling (user can decide)
- Conflict check algorithm:
  ```
  startA < endB && endA > startB
  ```

### 5. Duration Calculation Logic

**Focus Tasks** (focus_duration > 0):
```typescript
duration = focus_duration × daily_session_target
// Example: 25 min × 3 sessions = 75 minutes
end_time = start_time + duration
```

**Checklist Tasks** (focus_duration = 0):
- No time block rendering
- Display as marker/checkpoint at scheduled_start_time
- Visual: Small dot or line indicator on timeline

## Database Changes

### Migration: Create new table `task_schedules`

**Approach**: Separate table untuk support multiple schedules per task.

**New Table**:
```sql
CREATE TABLE task_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_item_id UUID NOT NULL,
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  session_count INT NOT NULL,  -- Berapa sesi dari total di block ini
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_daily_plan_item
    FOREIGN KEY (daily_plan_item_id)
    REFERENCES daily_plan_items(id)
    ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_task_schedules_item ON task_schedules(daily_plan_item_id);
CREATE INDEX idx_task_schedules_time ON task_schedules(scheduled_start_time);
```

**Example Data**:
```sql
-- Task A: "Write blog post" dengan 3 sessions total (3 × 25min = 75min)
-- User split jadi 2 time blocks:

INSERT INTO task_schedules VALUES
  ('sched-1', 'task-a', '2026-02-12 10:00:00Z', '2026-02-12 10:50:00Z', 50, 2),
  ('sched-2', 'task-a', '2026-02-12 14:00:00Z', '2026-02-12 14:25:00Z', 25, 1);

-- Total: 2 + 1 = 3 sessions ✅
```

**Why Separate Table?**
- ✅ Scalable untuk multiple schedules per task
- ✅ Proper relational structure dengan FK constraints
- ✅ Easy to query by time range
- ✅ Cascade delete ketika task dihapus
- ✅ Individual indexes untuk performance

## TypeScript Updates

### New Types

```typescript
type ActivityViewMode = 'PLAN' | 'ACTUAL';

// New table type
interface TaskSchedule {
  id: string;
  daily_plan_item_id: string;
  scheduled_start_time: string;   // ISO timestamp
  scheduled_end_time: string;     // ISO timestamp
  duration_minutes: number;
  session_count: number;          // Berapa sesi di block ini
  created_at?: string;
  updated_at?: string;
}

// Extended DailyPlanItem with schedules
interface DailyPlanItemWithSchedules extends DailyPlanItem {
  schedules?: TaskSchedule[];           // Multiple schedules
  total_scheduled_sessions?: number;    // Sum of all session_count
  remaining_sessions?: number;          // daily_session_target - total_scheduled
  has_conflict?: boolean;
}

// Schedule management modal input
interface ScheduleBlockInput {
  startTime: string;
  sessionCount: number;
  duration: number;    // Calculated: focus_duration × sessionCount
  endTime: string;     // Calculated: startTime + duration
}

interface ScheduleManagementData {
  taskId: string;
  taskTitle: string;
  focusDuration: number;
  totalSessions: number;
  isChecklist: boolean;
  existingSchedules: TaskSchedule[];
}
```

## Component Architecture

### Modified Files

1. **ActivityLog/ActivityLog.tsx**
   - Add segmented control: Plan | Actual
   - Conditional render: ActivityPlanView vs existing CalendarView
   - State: activityViewMode ('PLAN' | 'ACTUAL')

2. **DailyQuest/components/TaskItemCard.tsx**
   - Add "Schedule Time" menu item (3-dot menu)
   - Add clock icon indicator when scheduled
   - onClick → open TimePickerModal

3. **DailyQuest/types.ts**
   - Add scheduled_start_time, scheduled_end_time fields

### New Files

4. **ActivityLog/components/ActivityPlanView.tsx**
   - Similar structure to CalendarView
   - Fetch only scheduled tasks (WHERE scheduled_start_time IS NOT NULL)
   - DndContext for drag-to-reschedule (desktop)
   - Conflict detection logic
   - Dynamic/24h toggle

5. **ActivityLog/components/ScheduledTaskBlock.tsx**
   - Extends CalendarBlock pattern
   - Draggable wrapper (desktop)
   - Show task title, time range, quest type
   - Visual conflict indicator
   - onClick → TimePickerModal

6. **ActivityLog/components/TaskMarker.tsx**
   - Simple marker for checklist tasks
   - Positioned at scheduled_start_time
   - No height (point in time, not duration)
   - Different visual from time blocks

7. **DailyQuest/components/ScheduleManagementModal.tsx**
   - Shows list of all schedule blocks untuk task
   - Add/Edit/Delete individual blocks
   - Session count picker per block (1 - remaining sessions)
   - Validation: Total session_count ≤ daily_session_target
   - Visual: Progress bar showing scheduled vs remaining sessions

8. **DailyQuest/components/ScheduleBlockForm.tsx**
   - Form untuk add/edit single schedule block
   - Input: Start time (time picker)
   - Input: Session count (slider atau +/- buttons)
   - Display: Calculated end time & duration (read-only)
   - Duration breakdown: "X sessions × Y min = Z min total"

9. **DailyQuest/hooks/useTaskSchedules.ts**
   - SWR hook for fetching schedules by task_id
   - Returns: TaskSchedule[]
   - Key: `task-schedules-${taskId}`

10. **DailyQuest/hooks/useScheduledTasks.ts**
    - SWR hook for fetching all scheduled tasks for a date
    - JOIN task_schedules with daily_plan_items
    - Key: `scheduled-tasks-${date}`

11. **DailyQuest/actions/scheduleActions.ts**
    - `createSchedule(taskId, startTime, sessionCount)` - Create new schedule block
    - `updateSchedule(scheduleId, startTime, sessionCount)` - Update schedule block
    - `deleteSchedule(scheduleId)` - Delete schedule block
    - `getTaskSchedules(taskId)` - Fetch all schedules for task
    - `getScheduledTasksByDate(date)` - Fetch all scheduled tasks with schedules

12. **lib/scheduleUtils.ts**
    - `calculateEndTime(start, focusDuration, sessionCount)` - Compute end time
    - `detectConflicts(schedules)` - Find overlapping schedules
    - `validateTotalSessions(schedules, target)` - Check if total ≤ target
    - `snapToInterval(time, minutes)` - Round to 15-min intervals
    - `formatTimeRange(start, end)` - Display format

## UI/UX Design

### Segmented Control Design

```
┌─────────────────────────────────────┐
│  Activity                      [=]  │ ← Collapse toggle
│  ┌────────┬────────┐  [24h ▼]      │
│  │  Plan  │ Actual │               │ ← Segmented control + view toggle
│  └────────┴────────┘               │
│  ... calendar content ...          │
└─────────────────────────────────────┘
```

### Scheduled Task Block (Simplified)

```
Timeline (kiri):        Block (kanan):
08:00 ──────────────
09:00 ──────────────
10:00 ┌──────────────┐
      │ 🎯 Write blog│ ← Hanya icon + title
11:00 │   post       │    (no time/session info)
      └──────────────┘
12:00 ──────────────    ← Height = duration visible
13:00 ──────────────       Position = time visible
14:00 ┌────────────┐
      │🎯 Write bl.│  ← Same task, second block
      └────────────┘
15:00 ──────────────

Visual:
- Color: quest type (Main=blue, Work=purple, Side=green, Daily=orange)
- Yellow border if conflict
- Tooltip on hover: "10:00-11:00, 2 sessions (50 min)"
```

### Task Marker (Checklist)

```
Timeline:
─────────●──────────── 10:00 AM
         ↑
    "Buy groceries"
```

### ScheduleManagementModal (Multiple Schedules)

**When task has no schedules:**
```
┌───────────────────────────────────┐
│  Schedule: Write blog post        │
│                                   │
│  Total: 3 sessions (75 min)       │
│  Scheduled: 0 sessions            │
│                                   │
│  No schedules yet                 │
│                                   │
│  [+ Add Time Block]               │
│                                   │
│  [Close]                          │
└───────────────────────────────────┘
```

**When task has schedules:**
```
┌───────────────────────────────────┐
│  Schedule: Write blog post        │
│  Total: 3 sessions (75 min)       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ ← Progress bar
│  Scheduled: 2 sessions            │
│  Remaining: 1 session             │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ Block #1                    │ │
│  │ 10:00 - 10:50 AM            │ │
│  │ 2 sessions (50 min)         │ │
│  │ [Edit] [Delete]             │ │
│  └─────────────────────────────┘ │
│                                   │
│  [+ Add Another Block]            │
│                                   │
│  [Close]                          │
└───────────────────────────────────┘
```

**Add/Edit Block Form:**
```
┌───────────────────────────────────┐
│  Add Time Block                   │
│                                   │
│  Start Time                       │
│  ┌──────────┐                    │
│  │ 09:00 AM │ ← Time picker      │
│  └──────────┘                    │
│                                   │
│  Sessions for this block          │
│  [ - ]  2  [ + ]                  │ ← +/- buttons (max: remaining)
│                                   │
│  Duration                         │
│  2 sessions × 25 min = 50 minutes │
│                                   │
│  End Time: 09:50 AM               │
│                                   │
│  [Cancel]  [Save]                 │
└───────────────────────────────────┘
```

### TaskItemCard - Menu Item

```
┌─────────────────────────┐
│ ⋮ Menu                  │
│ ┌─────────────────────┐ │
│ │ Convert to Checklist│ │
│ │ 📅 Schedule Time    │ │ ← New menu item
│ │ Remove from plan    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### TaskItemCard - Scheduled Indicator

```
┌──────────────────────────────┐
│ 🕐 Write blog post          │ ← Clock icon when scheduled
│ Main Quest                   │
│ [▶] 2/3  [25m ▼]            │
└──────────────────────────────┘
```

## Implementation Steps

### Phase 1: Database & Types
1. Create migration for `task_schedules` table (with FK to daily_plan_items)
2. Create new types (TaskSchedule, DailyPlanItemWithSchedules, ScheduleManagementData)
3. Update types for ActivityViewMode

### Phase 2: Server Actions & Hooks
4. Create scheduleActions.ts:
   - createSchedule()
   - updateSchedule()
   - deleteSchedule()
   - getTaskSchedules()
   - getScheduledTasksByDate()
5. Create useTaskSchedules hook (fetch schedules per task)
6. Create useScheduledTasks hook (fetch all scheduled tasks per date)
7. Create scheduleUtils.ts (validation, conflict detection, calculations)

### Phase 3: Schedule Management UI
8. Create ScheduleManagementModal component
   - List all schedule blocks
   - Add/Edit/Delete blocks
   - Progress bar (scheduled vs remaining sessions)
   - Session validation
9. Create ScheduleBlockForm component
   - Time picker input
   - Session count picker (+/- buttons)
   - Auto-calculated duration & end time
10. Update TaskItemCard - Add clock icon & "Schedule Time" menu item

### Phase 4: Activity Plan Calendar View
11. Create ActivityPlanView component (extend CalendarView pattern)
    - Fetch scheduled tasks with JOIN
    - Render simplified blocks (icon + title only)
    - Dynamic/24h toggle
12. Create ScheduledTaskBlock component
    - Simplified display (no time/session inside block)
    - Tooltip on hover (time + session info)
    - Color by quest type
    - Draggable wrapper (desktop)
13. Create TaskMarker component for checklist tasks

### Phase 5: Activity Log Integration
14. Update ActivityLog.tsx:
    - Add segmented control (Plan | Actual)
    - Conditional render: ActivityPlanView vs existing views
    - State management for view mode

### Phase 6: Drag & Drop
15. Implement DndContext in ActivityPlanView (desktop only)
16. Drag handler: Update schedule on drop
17. Snap to 15-minute intervals
18. Optimistic updates with SWR mutate

### Phase 7: Conflict Handling
19. Implement detectConflicts() in scheduleUtils
20. Visual conflict indicators (yellow border on blocks)
21. Conflict warning in ScheduleManagementModal

### Phase 8: Polish & Testing
22. Loading states & error handling
23. Empty state messages
24. Session validation logic
25. Responsive design testing (mobile/desktop)
26. Dark mode support
27. Accessibility (keyboard navigation, screen readers)
28. Test edge cases (midnight crossing, multiple blocks, conflicts)

## Technical Considerations

### Reusable Patterns
- **Calendar Grid**: Reuse HourlyGrid from ActivityLog
- **Time Calculations**: Extend calendarUtils.ts
- **Drag & Drop**: Pattern from MainQuestListSection
- **Modal Pattern**: Similar to existing modals
- **SWR Hooks**: Pattern from useActivityLogs

### Performance
- Separate SWR keys for scheduled vs actual activities
- Optimistic updates for drag operations
- Debounce conflict detection
- Lazy load TimePickerModal

### Mobile Responsiveness
- No drag on mobile (use modal)
- Touch-friendly block sizes (min 44px height)
- Scrollable timeline
- Bottom sheet style for TimePickerModal on mobile

### Edge Cases
- Tasks scheduled across midnight (11:30 PM - 12:30 AM)
- Empty schedule view (show motivational message)
- Deleted tasks that were scheduled (handle gracefully)
- Timezone handling (use local time)
- Multiple sessions spanning hours (show single block)
- Session target changes after scheduling (recalculate end_time)

### Data Flow

```
User Action (Schedule Task)
    ↓
TimePickerModal (input start time)
    ↓
scheduleActions.scheduleTask()
    ↓
Calculate end_time (start + duration × sessions)
    ↓
Update daily_plan_items (scheduled_start_time, scheduled_end_time)
    ↓
SWR mutate (optimistic update)
    ↓
Revalidate scheduled tasks
    ↓
UI Updates:
  - ActivityPlanView shows block
  - TaskItemCard shows clock icon
```

### Conflict Detection Flow

```
User schedules task
    ↓
detectConflicts(scheduledTasks)
    ↓
Check time overlaps: startA < endB && endA > startB
    ↓
If conflict found:
  - Set has_conflict = true
  - Count overlapping tasks (conflict_count)
  - Add yellow border to blocks
  - Show warning (optional)
    ↓
Allow user to proceed (non-blocking)
```

## Success Metrics

- ✅ Users can schedule tasks in < 3 taps (mobile)
- ✅ Visual conflict detection prevents double-booking awareness
- ✅ Drag-to-schedule works smoothly on desktop (60fps)
- ✅ Schedule persists across sessions
- ✅ Mobile time picker is touch-friendly
- ✅ Scheduled tasks visible in quest cards (clock icon)

## Future Enhancements (Out of Scope)

### Phase 2 Features
- Auto-schedule feature (AI suggests optimal times based on energy levels)
- Recurring schedules (daily, weekly patterns)
- Break time auto-insertion (Pomodoro breaks between tasks)
- Schedule templates (Morning Routine, Deep Work Block, etc.)
- Bulk scheduling (schedule all unscheduled tasks)

### Integrations
- Calendar sync (Google Calendar, Outlook)
- Notifications for upcoming tasks (15 min before)
- Auto-start Pomodoro timer at scheduled time
- Daily schedule email/summary

### Analytics
- Schedule adherence tracking (planned vs actual)
- Optimal scheduling time analysis
- Task completion rate by time of day
- Over/under scheduling patterns

## Reference Files

**Similar Features to Study**:
- `src/app/(admin)/execution/daily-sync/ActivityLog/` - Calendar view pattern
- `src/app/(admin)/execution/daily-sync/DailyQuest/MainQuestListSection.tsx` - Drag & drop pattern
- `src/lib/calendarUtils.ts` - Time calculation utilities
- `src/components/common/CollapsibleCard.tsx` - Collapsible UI pattern

**Database Schema**:
- `docs/ERD.sql` - Current schema reference
- Table: `daily_plan_items` - Will be extended with schedule fields

**UI Components**:
- `src/app/(admin)/execution/daily-sync/DailyQuest/components/TaskItemCard.tsx` - Task card to modify
- `src/app/(admin)/execution/daily-sync/ActivityLog/components/CalendarView.tsx` - Calendar to extend

## Notes

- This feature extends the existing ActivityLog card, not replacing it
- Maintains consistency with existing Pomodoro timer workflow
- Non-destructive: scheduling is optional, doesn't affect existing task management
- Mobile-first approach with progressive enhancement for desktop drag & drop
- Conflict detection is informative, not blocking (user has final say)

---

**Created by**: Claude (AI Assistant)
**Date**: 2026-02-12
**Status**: Planning Phase
**Next Steps**: Review plan → Create beads issue → Begin Phase 1 implementation
