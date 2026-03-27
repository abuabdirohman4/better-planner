# PROMPT FOR CLAUDE CODE: Implement Monthly Challenge Habit Tracker

## Context

I'm building a productivity app called "Better Planner" that already has:
- ✅ Daily Sync page (session tracking, quest system)
- ✅ Daily Quest feature (foundation tasks with checkboxes)
- ✅ Best Week framework (time-blocking & activity categorization)

Now I need to add a **Monthly Challenge Habit Tracker** - a visual monthly grid system for tracking habit consistency, streaks, and building long-term behaviors.

**Current Situation:** I track habits in a Google Spreadsheet (screenshot provided). I want to migrate this into the Better Planner app.

## Reference Documents

**READ THESE FIRST:**
1. `HABIT_TRACKER_CONCEPT.md` - Philosophy, psychology, integration with existing features
2. `HABIT_TRACKER_IMPLEMENTATION.md` - Technical spec, data models, UI components
3. `HABIT_TRACKER_EXAMPLES.md` - My actual habits & pre-built templates

## My Current Habits (From Spreadsheet)

**17 active habits across categories:**

**Spiritual (9 habits):**
- Shalat 5 Waktu On Time (5 separate habits)
- Shalat Tahajud (04:00) - flexible, goal 20/month
- Shalat Duha (06:30) - flexible, goal 20/month
- Baca Al Qur'an (06:00) - flexible, goal 20/month
- Shalat Tasbih (11:30) - weekly, goal 3/month

**Kesehatan (3 habits):**
- Tidur Jam 10 (Last Night) - flexible, goal 20/month
- Tidak Buka HP Bangun Tidur - flexible, goal 20/month
- Olahraga/Exercise - flexible, goal 20/month

**Karir/Productivity (2 habits):**
- Baca Buku/Kindle (5 Menit) - flexible, goal 20/month
- Habit Tracker - daily, goal 30/month (meta-habit!)
- Weekly Review (19:00) - weekly, goal 3/month

**Negative Habits (3 habits):**
- Tidak Buka Twitter - goal 20/month
- Tidak Buka Youtube - goal 20/month
- Tidak Buka Instagram - goal 20/month

**Current tracking method:**
- Monthly grid (rows = habits, columns = days)
- Manual checkbox in spreadsheet
- Weekly totals at bottom
- Analysis section showing Goal/Actual/Progress

## Tech Stack

```
Frontend: [SPECIFY - e.g., React + Next.js + TypeScript]
Styling: [SPECIFY - e.g., Tailwind CSS + shadcn/ui]
State: [SPECIFY - e.g., React Query + Context]
Database: [SPECIFY - e.g., Supabase, Firebase, PostgreSQL]
Backend: [SPECIFY - e.g., Next.js API routes, tRPC]
```

## What I Need You to Build

### PHASE 1 (MVP - Priority: HIGHEST) 🎯

Build the **core habit tracking system**:

1. **Data Layer**
   - Habits table (name, category, frequency, monthly goal, etc.)
   - Habit completions table (habit_id, date, completed)
   - Monthly stats table (aggregated data)
   - API endpoints for CRUD operations
   - Streak calculation logic
   - Monthly stats calculation

2. **Monthly Grid View** (`/habits/monthly`)
   - Visual monthly calendar grid (rows = habits, columns = days)
   - Checkbox interface to mark habits complete/incomplete
   - Weekly totals row at bottom
   - Progress bars with percentage (Goal vs Actual per habit)
   - Color coding: Green (80%+), Yellow (60-79%), Red (<60%)
   - Best Streak counter (top of page)
   - Total habits completed counter

3. **Today's Habits View** (`/habits/today`) 
   - Mobile-optimized daily checklist
   - Group habits by time of day (Morning, Afternoon, Evening, etc.)
   - Quick mark interface (large touch targets)
   - Current streak display
   - Completion count (X/Y completed today)

4. **Habit Management**
   - Add new habit form
   - Edit existing habit
   - Archive/restore habit
   - Set custom monthly goal per habit
   - Link to Daily Quest (optional)
   - Link to Best Week block (optional)

5. **Basic Stats**
   - Monthly completion percentage (overall)
   - Per-habit stats (actual vs goal)
   - Current & best streaks
   - Simple monthly review page

### PHASE 2 (Nice-to-have - Priority: MEDIUM)

If time permits after Phase 1:

6. **Advanced Analytics**
   - Monthly review dashboard with insights
   - Category breakdown (Spiritual, Kesehatan, Karir)
   - Week-by-week trend analysis
   - Weekday vs Weekend patterns
   - Auto-generated insights ("Performance declining", "Weekend weak", etc.)

7. **Integration Features**
   - Auto-mark habit when Daily Quest completed
   - Suggest habits from Best Week blocks
   - Export monthly data (CSV/PDF)

8. **Templates & Import**
   - Pre-built habit templates (Muslim Daily, Morning Routine, etc.)
   - Import from CSV (migrate from spreadsheet)
   - One-click template setup

### PHASE 3 (Future - Priority: LOW)

Not needed now, document for later:

9. Reminders & Notifications
10. Habit templates marketplace
11. Social/accountability features

---

## Key Design Requirements

### 1. Monthly Grid Layout (Critical!)

**Desktop View:**
```
┌────────────────────────────────────────────────────────────┐
│ 📅 Monthly Challenge - March 2026       Best Streak: 7 🔥  │
│                                         Total Habits: 18    │
├────────────────────────────────────────────────────────────┤
│ Habit Name          │ Week 1  │ Week 2  │ Week 3  │ Week 4 │
│                     │ Mo Tu We│ Th Fr.. │         │        │
├─────────────────────┼─────────┼─────────┼─────────┼────────┤
│ 🙏 Shalat Tahajud   │ ☑ ☑ ☐  │ ☑ ☐ ... │         │        │
│ (04:00)             │ Goal: 20  Actual: 8  ████ 40%        │
├─────────────────────┼─────────┼─────────┼─────────┼────────┤
│ 😴 Tidur Jam 10     │ ☑ ☑ ☐  │ ☐ ☐ ... │         │        │
│ (Last Night)        │ Goal: 20  Actual: 12 █████ 60%       │
├─────────────────────┼─────────┼─────────┼─────────┼────────┤
│ ...                 │         │         │         │        │
└────────────────────────────────────────────────────────────┘
```

**Mobile View:**
- Vertical list (one habit at a time)
- Swipe to navigate between habits
- Horizontal scroll for days if needed
- Or use "Today's View" primarily on mobile

### 2. Checkbox Behavior

**Important:**
- ✅ Single tap/click to toggle
- ✅ Visual feedback (green when checked)
- ✅ Auto-save on change
- ✅ Can't mark future dates (disabled)
- ✅ Can mark past dates (catch-up)
- ✅ Optimistic updates (instant UI response)

### 3. Streak Calculation

**Current Streak:**
```typescript
// Count consecutive days from today backwards
// Break if any day is unchecked
// Example:
// Mar 27: ✓ Mar 26: ✓ Mar 25: ✗ Mar 24: ✓
// Current Streak = 2 days (27, 26)
```

**Best Streak:**
```typescript
// Longest consecutive streak in all time
// Never resets (all-time record)
// Example: Best ever was 14 days in January
```

### 4. Monthly Goals

**Flexible goals per habit:**
- Daily habits: 30/month (every day)
- Flexible habits: 20/month (2/3 of month)
- Weekly habits: 4/month (once per week)
- Negative habits: 25/month (25 days WITHOUT)

**Progress Calculation:**
```typescript
percentage = (actual / goal) * 100

// Color coding:
if (percentage >= 80) → Green (excellent)
else if (percentage >= 60) → Yellow (good)
else → Red (needs work)
```

### 5. Negative Habits (Important!)

**Reverse tracking:**
```
Habit: "Tidak Buka Instagram"
✓ = Did NOT open Instagram (success!)
✗ = Opened Instagram (failed)

Goal: 25/30 days WITHOUT Instagram
```

**UI Indication:** 
- Show "(Negative)" or "Don't" in habit name
- Different icon (❌ or 🚫)
- Same checkbox behavior, reversed meaning

---

## Data Model (Key Tables)

### habits table

```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),          -- spiritual, kesehatan, karir, etc.
  frequency VARCHAR(50),          -- daily, flexible, weekly
  monthly_goal INTEGER NOT NULL,
  
  -- Optional
  target_time TIME,               -- "04:00" for Shalat Tahajud
  tracking_type VARCHAR(20),      -- positive or negative
  icon VARCHAR(50),               -- emoji
  linked_daily_quest_id UUID,     -- integration
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER,
  created_at TIMESTAMP,
  archived_at TIMESTAMP
);
```

### habit_completions table

```sql
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY,
  habit_id UUID REFERENCES habits(id),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  
  -- Optional
  completed_at TIMESTAMP,         -- when marked
  auto_marked BOOLEAN DEFAULT false, -- from Daily Quest?
  
  UNIQUE(habit_id, date)          -- one entry per habit per day
);
```

### monthly_stats table (optional for MVP)

```sql
CREATE TABLE monthly_stats (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  month VARCHAR(7) NOT NULL,      -- "2026-03"
  
  total_habits INTEGER,
  total_completions INTEGER,
  overall_percentage DECIMAL(5,2),
  
  habit_stats JSONB,              -- detailed per-habit data
  category_stats JSONB,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, month)
);
```

---

## Example Code Structure

### Toggle Habit API

```typescript
// POST /api/habits/completions
async function toggleHabit(
  habitId: string, 
  date: Date, 
  completed: boolean
) {
  // Upsert completion record
  const completion = await db.habitCompletions.upsert({
    where: {
      habitId_date: { habitId, date }
    },
    update: {
      completed,
      completedAt: new Date()
    },
    create: {
      habitId,
      userId,
      date,
      completed,
      completedAt: new Date()
    }
  });
  
  // Recalculate streaks for this habit
  const streaks = await calculateStreak(habitId);
  
  return { completion, streaks };
}
```

### Streak Calculation

```typescript
function calculateStreak(
  habitId: string,
  completions: HabitCompletion[]
): { current: number, best: number } {
  
  // Sort by date descending
  const sorted = completions
    .filter(c => c.completed)
    .sort((a, b) => b.date - a.date);
  
  // Current streak (consecutive from today)
  let currentStreak = 0;
  let today = new Date();
  today.setHours(0,0,0,0);
  
  for (const c of sorted) {
    const cDate = new Date(c.date);
    cDate.setHours(0,0,0,0);
    
    const daysDiff = Math.floor(
      (today - cDate) / (1000*60*60*24)
    );
    
    if (daysDiff === currentStreak) {
      currentStreak++;
    } else {
      break; // streak broken
    }
  }
  
  // Best streak (longest ever)
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;
  
  for (const c of sorted.reverse()) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (c.date - prevDate) / (1000*60*60*24)
      );
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = c.date;
  }
  
  bestStreak = Math.max(bestStreak, tempStreak);
  
  return { current: currentStreak, best: bestStreak };
}
```

---

## Integration Requirements

### 1. Daily Quest Integration

**When Daily Quest item is completed:**
```typescript
// Check if habit is linked
const linkedHabit = await getHabitByDailyQuestId(questItem.id);

if (linkedHabit) {
  // Auto-mark habit for today
  await toggleHabit(linkedHabit.id, new Date(), true);
}
```

**Bi-directional sync:**
- Completing Daily Quest → Auto-mark Habit ✓
- Completing Habit → Auto-check Daily Quest ✓ (optional)

### 2. Best Week Integration

**Suggest habits from Best Week:**
```typescript
// When user creates Best Week
const highLifetimeBlocks = bestWeek.blocks.filter(
  b => b.category === 'high_lifetime_value'
);

// Suggest as habits
const suggestedHabits = highLifetimeBlocks.map(block => ({
  name: block.title,
  targetTime: block.startTime,
  linkedBestWeekBlock: block.id
}));
```

---

## UI/UX Guidelines

### Color Scheme

```typescript
const COLORS = {
  // Progress colors
  excellent: '#10B981',   // Green (80-100%)
  good: '#F59E0B',        // Amber (60-79%)
  needsWork: '#EF4444',   // Red (<60%)
  
  // Checkbox states
  checked: '#10B981',     // Green
  unchecked: '#E5E7EB',   // Gray-200
  disabled: '#9CA3AF',    // Gray-400
  
  // Categories
  spiritual: '#8B5CF6',   // Purple
  kesehatan: '#10B981',   // Green
  karir: '#3B82F6',       // Blue
  other: '#6B7280',       // Gray
};
```

### Responsive Breakpoints

```css
/* Mobile first */
.monthly-grid {
  /* Vertical list, one habit at a time */
}

@media (min-width: 768px) {
  /* Tablet: Show 2 weeks side by side */
}

@media (min-width: 1024px) {
  /* Desktop: Full month grid visible */
}
```

### Touch Optimization

- Checkbox size: 32px on mobile, 24px on desktop
- Touch targets: minimum 44x44px
- Swipe gestures for mobile navigation
- Pull-to-refresh for today's view

---

## Migration from Spreadsheet

### CSV Import Feature

**Upload format:**
```csv
habit_name,category,frequency,monthly_goal,target_time
Shalat Tahajud,spiritual,flexible,20,04:00
Tidur Jam 10,kesehatan,flexible,20,22:00
Baca Buku,karir,flexible,20,
```

**Import handler:**
```typescript
async function importHabitsFromCSV(csv: string) {
  const rows = parseCSV(csv);
  
  const habits = rows.map(row => ({
    name: row.habit_name,
    category: row.category,
    frequency: row.frequency,
    monthlyGoal: parseInt(row.monthly_goal),
    targetTime: row.target_time || null
  }));
  
  // Bulk insert
  await db.habits.createMany({ data: habits });
}
```

---

## Success Criteria

MVP is successful when I can:

✅ Add my 17 habits to the system
✅ View monthly grid with all habits and days
✅ Click checkbox to mark habit complete/incomplete
✅ See progress bars update (Goal vs Actual)
✅ See current streak and best streak
✅ Use "Today's View" on mobile for quick daily check-in
✅ See overall monthly percentage
✅ Data persists and syncs across devices
✅ Fast performance (<2s page load, <100ms checkbox response)

---

## What NOT to Build (Out of Scope for MVP)

❌ Reminders/notifications
❌ Social features (sharing, friends)
❌ Advanced analytics charts
❌ Habit templates (can add manually)
❌ Calendar integration
❌ Mobile app (responsive web is OK)
❌ AI suggestions

---

## Deliverables

Please provide:

1. **Database schema** (SQL or Prisma schema)
2. **API endpoints** (implementation or detailed spec)
3. **UI Components:**
   - Monthly Grid component
   - Today's Habits component
   - Habit Form (add/edit)
   - Progress Bar component
4. **Core logic:**
   - Streak calculation
   - Monthly stats calculation
5. **Integration code:**
   - Daily Quest linking
   - Best Week suggestions
6. **Sample data / seed script** for testing with my actual habits
7. **Brief usage guide**

---

## Questions to Answer Before Starting

**Please clarify:**

1. **Database:** What are you using? (PostgreSQL, Supabase, Firebase, etc.)
2. **ORM:** Prisma? Drizzle? Raw SQL?
3. **API:** Next.js API routes? tRPC? REST?
4. **State Management:** React Query? SWR? Redux?
5. **Component Library:** shadcn/ui? Material-UI? Custom?
6. **File Structure:** Where should I create new files in your project?
7. **Existing Code:** Can you share samples of your current Quest system, Daily Quest, etc. for consistency?

---

## Implementation Approach

### Step 1: Data Foundation (Start Here!)

```bash
# 1. Create database schema
# - habits table
# - habit_completions table
# - indexes for performance

# 2. Build API layer
# - CRUD for habits
# - Toggle completion endpoint
# - Get monthly data endpoint
# - Calculate streaks endpoint

# 3. Test with sample data
# - Seed my 17 actual habits
# - Add fake completions for testing
```

### Step 2: Monthly Grid UI

```bash
# Create: /pages/habits/monthly.tsx

# Components needed:
# - MonthlyGrid (main layout)
# - HabitRow (one row per habit)
# - Checkbox (mark complete/incomplete)
# - ProgressBar (visual progress)
# - WeeklyTotals (footer row)

# Features:
# - Render 30-31 day grid
# - Group by weeks
# - Click to toggle
# - Auto-save changes
# - Show progress %
```

### Step 3: Today's View (Mobile)

```bash
# Create: /pages/habits/today.tsx

# Simpler than monthly grid:
# - List of today's habits
# - Large checkboxes
# - Group by time of day
# - Current streak display
# - Quick completion counter
```

### Step 4: Stats & Integration

```bash
# Add:
# - Monthly stats calculation
# - Streak tracking
# - Link to Daily Quest
# - Basic monthly review page
```

---

## Example User Flow (MVP)

1. I go to `/habits/monthly` (first time)
2. See empty state with "Add Habit" button
3. Click "Add Habit"
4. Fill form:
   - Name: "Shalat Tahajud"
   - Category: Spiritual
   - Frequency: Flexible
   - Monthly Goal: 20
   - Target Time: 04:00
5. Click Save
6. Habit appears in monthly grid
7. I repeat for all 17 habits (or import CSV)
8. Grid shows all habits × 31 days
9. I click checkboxes to mark completions
10. Progress bars update in real-time
11. Streaks calculated automatically
12. On mobile, I visit `/habits/today`
13. See just today's habits with big checkboxes
14. Quick daily check-in (<1 minute)
15. At end of month, see 72% overall completion
16. Next month starts fresh with same habits

---

## Let's Start!

**Your first task:**

Create the database schema for Habit Tracker following the spec in `HABIT_TRACKER_IMPLEMENTATION.md`. Show me the schema so I can review before we proceed to building the UI.

**Context you'll need from me:**
- Database type: [I'LL PROVIDE]
- Current tables/schema: [I'LL PROVIDE]
- Authentication: [I'LL PROVIDE]
- My 17 habits data for seed: (See HABIT_TRACKER_EXAMPLES.md)

Once schema is approved, we'll build the Monthly Grid step-by-step.

Ready when you are! 🚀

---

## Additional Context

**Why this feature matters to me:**

I currently track 17 habits in a Google Spreadsheet. It works, but:
- Manual data entry every day
- No mobile access (spreadsheet clunky on phone)
- No automatic streak calculation
- No integration with my other productivity tools
- Hard to analyze patterns

With this integrated into Better Planner:
- ✅ Seamless mobile experience (Today's View)
- ✅ Auto-sync with Daily Quest (no double tracking)
- ✅ Automatic streak & progress calculation
- ✅ Pattern insights (weekday vs weekend, declining trends)
- ✅ All-in-one productivity system (Best Week + Daily Quest + Habits)
- ✅ Long-term data (years of habit history)

**My commitment:**
I will actually use this daily. This is not a "nice to have" - habit tracking is core to my life system. Getting 70%+ monthly consistency is a key goal for me.

Let's build something great! 💪
