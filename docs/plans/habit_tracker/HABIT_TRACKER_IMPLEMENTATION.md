# HABIT TRACKER - Technical Implementation Specification

## Feature Overview

Implement **Monthly Challenge Habit Tracker** - a visual monthly grid for tracking habit consistency, streaks, and progress toward behavioral goals.

**Read First:** See `HABIT_TRACKER_CONCEPT.md` for full conceptual framework.

---

## Data Model

### Habit

```typescript
interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Categorization
  category: HabitCategory;
  lifeArea?: LifeArea; // Sync Planner 7 areas
  
  // Frequency & Goal
  frequency: HabitFrequency;
  monthlyGoal: number; // e.g., 20, 30, 4
  
  // Tracking type
  trackingType: 'positive' | 'negative'; // Do this vs Don't do this
  
  // Time specificity
  isTimeBound: boolean;
  targetTime?: string; // "04:00", "22:00"
  timeWindow?: { start: string; end: string }; // "04:30-06:30"
  
  // Visual
  icon?: string;
  color?: string;
  
  // Integration
  linkedDailyQuest?: string; // ID of Daily Quest item
  linkedBestWeekBlock?: string; // ID of Best Week block
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  archivedAt?: Date;
  sortOrder: number; // For custom ordering
}

enum HabitCategory {
  SPIRITUAL = 'spiritual',
  KESEHATAN = 'kesehatan',
  KARIR = 'karir',
  KEUANGAN = 'keuangan',
  RELASI = 'relasi',
  PETUALANGAN = 'petualangan',
  KONTRIBUSI = 'kontribusi',
  OTHER = 'other'
}

enum HabitFrequency {
  DAILY = 'daily',           // Every day (goal: 30/month)
  WEEKLY = 'weekly',         // Once per week (goal: 4/month)
  FLEXIBLE = 'flexible',     // Custom frequency
  WEEKDAY_ONLY = 'weekday_only' // Mon-Fri only (goal: ~22/month)
}

enum LifeArea {
  KARIR = 'karir',
  KESEHATAN = 'kesehatan',
  RELASI = 'relasi',
  KONTRIBUSI = 'kontribusi',
  PETUALANGAN = 'petualangan',
  KEUANGAN = 'keuangan',
  SPIRITUAL = 'spiritual'
}
```

### HabitCompletion

```typescript
interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: Date; // YYYY-MM-DD format
  completed: boolean;
  
  // Optional metadata
  completedAt?: Date; // Timestamp when marked
  note?: string; // Optional note about this completion
  
  // Integration
  linkedSessionId?: string; // If completed during a work session
  autoMarked: boolean; // Auto-marked from Daily Quest or manual
}
```

### MonthlyStats

```typescript
interface MonthlyStats {
  id: string;
  userId: string;
  month: string; // "2026-03" format
  
  // Overall metrics
  totalHabits: number;
  totalPossibleCompletions: number;
  totalCompletions: number;
  overallPercentage: number;
  
  // Per-habit stats
  habitStats: HabitStat[];
  
  // Streaks
  bestStreak: StreakInfo;
  currentStreaks: StreakInfo[];
  
  // Category breakdown
  categoryStats: {
    [category: string]: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
  
  // Insights
  insights: string[];
  topPerformers: string[]; // Habit IDs
  needsAttention: string[]; // Habit IDs
  
  createdAt: Date;
  updatedAt: Date;
}

interface HabitStat {
  habitId: string;
  habitName: string;
  goal: number;
  actual: number;
  percentage: number;
  
  // Streak data
  currentStreak: number;
  bestStreak: number;
  
  // Patterns
  weekdayCompletion: number; // Mon-Fri %
  weekendCompletion: number; // Sat-Sun %
  weeklyBreakdown: number[]; // [week1%, week2%, week3%, week4%]
}

interface StreakInfo {
  habitId: string;
  habitName: string;
  streakLength: number;
  startDate: Date;
  endDate?: Date; // If streak is broken
}
```

---

## UI Components

### 1. Monthly Challenge Grid (Main View)

**Route:** `/habits/monthly`

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 Monthly Challenge - March 2026           [Settings] [Export] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Consistency is the key to success                               │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ BEST STREAK          │  │ TOTAL HABITS         │           │
│  │ 🔥 7 Days            │  │ 📊 18                │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Habit Name         | Week 2        | Week 3        | Week 4    │
│                    | Mo Tu We Th..  | Mo Tu We...   | ...       │
├────────────────────┼───────────────┼───────────────┼───────────┤
│ 🙏 Shalat Tahajud  │ ☑ ☑ ☐ ☑ ☐... │ ☑ ☐ ☑ ☑...   │ ...       │
│ (04:00)            │               │               │           │
│                    │ Goal: 20  Actual: 8  Progress: ████ 40%   │
├────────────────────┼───────────────┼───────────────┼───────────┤
│ 😴 Tidur Jam 10    │ ☑ ☑ ☐ ☐ ☐... │ ☐ ☐ ☐ ☑...   │ ...       │
│ (Last Night)       │               │               │           │
│                    │ Goal: 25  Actual: 12  Progress: ████ 48%  │
├────────────────────┼───────────────┼───────────────┼───────────┤
│ ...                │               │               │           │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Weekly Totals:                                              ││
│ │ Week 1: 67/150  Week 2: 40/150  Week 3: 47/150  Week 4: 0  ││
│ │         10/15           6/15            7/15         0/17   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ [+ Add Habit]                              [Monthly Review →]   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Sticky header (habit names) when scrolling horizontally
- Collapsible progress bars (can hide to save space)
- Quick mark entire day (tap column header)
- Color-coded progress bars (red/yellow/green)
- Weekly totals at bottom

**Responsive Design:**
- Desktop: Full grid visible
- Tablet: Horizontal scroll for weeks
- Mobile: Vertical list, one habit at a time

### 2. Today's Habits View (Mobile Optimized)

**Quick daily check-in interface:**

```
┌─────────────────────────────────┐
│ 📅 Today's Habits               │
│ Monday, March 27, 2026          │
├─────────────────────────────────┤
│                                  │
│ Morning (Before 12:00)           │
│ ☑ Shalat Subuh On Time          │
│ ☐ Shalat Tahajud (04:00)        │
│ ☑ Tidak Buka HP Pagi            │
│ ☐ Shalat Duha (06:30)           │
│                                  │
│ Afternoon (12:00-18:00)          │
│ ☑ Shalat Dzuhur On Time         │
│ ☐ Shalat Ashar On Time          │
│                                  │
│ Evening (18:00-22:00)            │
│ ☐ Shalat Maghrib On Time        │
│ ☐ Shalat Isya On Time           │
│ ☐ Baca Al Qur'an (06:00)        │
│                                  │
│ Before Sleep                     │
│ ☐ Tidur Jam 10                  │
│ ☐ Evening Routine               │
│                                  │
├─────────────────────────────────┤
│ 3/12 completed today             │
│ Current Streak: 2 days 🔥       │
│                                  │
│ [Mark All Remaining] [View Grid]│
└─────────────────────────────────┘
```

**Features:**
- Grouped by time of day
- Large touch targets (mobile-friendly)
- Swipe to mark
- Push notification integration
- Quick "Mark All" option
- Link to full monthly grid

### 3. Habit Detail View

**Tap on any habit to see details:**

```
┌─────────────────────────────────────┐
│ [<] Shalat Tahajud (04:00)          │
├─────────────────────────────────────┤
│                                      │
│ 📊 This Month (March)                │
│ Goal: 20 days                        │
│ Actual: 8 days (40%)                │
│ ████░░░░░░░░░░                      │
│                                      │
│ 🔥 Streaks                           │
│ Current: 0 days (broken yesterday)  │
│ Best: 7 days (March 1-7)            │
│ This month: 2 streaks               │
│                                      │
│ 📈 Patterns                          │
│ Weekdays: 6/15 (40%)               │
│ Weekends: 2/4 (50%)                │
│                                      │
│ Weekly Breakdown:                    │
│ Week 1: 5/7 ████████░░ 71%         │
│ Week 2: 2/7 ████░░░░░░ 29%         │
│ Week 3: 1/7 ██░░░░░░░░ 14%         │
│ Week 4: 0/2 ░░░░░░░░░░ 0%          │
│                                      │
│ 💡 Insights                          │
│ • Performance declining over month   │
│ • Strongest in first week           │
│ • Try: Earlier bedtime for success  │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ Calendar View                     ││
│ │ [Mini month calendar with marks] ││
│ └──────────────────────────────────┘│
│                                      │
│ [Edit Habit] [View History]         │
└─────────────────────────────────────┘
```

### 4. Monthly Review Dashboard

**End-of-month summary:**

```
┌─────────────────────────────────────────┐
│ 📊 Monthly Review - March 2026          │
├─────────────────────────────────────────┤
│                                          │
│ Overall Score: 72/100 ⭐⭐⭐⭐          │
│ ████████████████████░░░░░░░░            │
│                                          │
│ 📈 Comparison                            │
│ February: 68% (+4% improvement!)        │
│ January: 65%                             │
│                                          │
│ 🏆 Top Performers (80%+)                 │
│ 1. Shalat Ashar On Time - 93%          │
│ 2. Tidak Buka HP Pagi - 90%            │
│ 3. Shalat Isya On Time - 87%           │
│                                          │
│ ⚠️ Needs Attention (<60%)               │
│ 1. Shalat Tahajud - 40%                │
│ 2. Shalat Duha - 35%                   │
│ 3. Baca Al Qur'an - 50%                │
│                                          │
│ 🔥 Streak Achievements                   │
│ Longest: 7 days (Shalat Subuh)         │
│ Most Streaks: 3 (Tidak Buka Instagram) │
│                                          │
│ 📊 Category Breakdown                    │
│ Spiritual: 75% ████████░░              │
│ Kesehatan: 68% ███████░░░              │
│ Karir: 70% ███████░░░                  │
│                                          │
│ 💡 Key Insights                          │
│ • Prayer habits strong and consistent   │
│ • Morning habits need work (sleep!)    │
│ • Weekend dip in consistency           │
│                                          │
│ 🎯 Next Month Goals                      │
│ • Target: 75% overall (+3%)            │
│ • Focus: Morning routine consistency   │
│ • Add: Daily gratitude journal         │
│                                          │
│ [Export Report] [Plan Next Month]       │
└─────────────────────────────────────────┘
```

### 5. Habit Settings / Add Habit Form

```
┌─────────────────────────────────────┐
│ ➕ Add New Habit                    │
├─────────────────────────────────────┤
│                                      │
│ Habit Name *                         │
│ [Shalat Dhuha                  ]    │
│                                      │
│ Category                             │
│ [Spiritual ▼]                        │
│                                      │
│ Frequency                            │
│ ( ) Daily (30 days/month)           │
│ (•) Flexible                         │
│ ( ) Weekly (4 times/month)          │
│ ( ) Weekday Only (~22 days/month)   │
│                                      │
│ Monthly Goal (if flexible)           │
│ [20] times per month                │
│                                      │
│ Time-bound?                          │
│ [x] Yes  [ ] No                      │
│                                      │
│ Target Time (optional)               │
│ [06:30]                              │
│                                      │
│ Tracking Type                        │
│ (•) Positive (Do this)               │
│ ( ) Negative (Don't do this)        │
│                                      │
│ Icon (optional)                      │
│ [🙏]                                 │
│                                      │
│ Link to Daily Quest?                 │
│ [Morning Routine ▼]                  │
│                                      │
│ Link to Best Week?                   │
│ [06:00-07:00 Morning (HLVA) ▼]     │
│                                      │
│ [Cancel]              [Save Habit]   │
└─────────────────────────────────────┘
```

### 6. Mini Widget (Dashboard)

**Quick stats for main dashboard:**

```
┌────────────────────────────┐
│ 📅 Monthly Challenge        │
├────────────────────────────┤
│ March 2026: 72% ⭐⭐⭐⭐   │
│ ████████████████░░░░░░░░   │
│                             │
│ Today: 3/12 habits ✓        │
│ Current streak: 4 days 🔥   │
│                             │
│ [View Full Tracker]         │
└────────────────────────────┘
```

---

## User Stories & Acceptance Criteria

### US1: Track Daily Habits

**As a user, I want to mark my habits as complete each day so I can build consistency.**

**Acceptance Criteria:**
- [ ] Can see today's habits in dedicated view
- [ ] Can check/uncheck habits with single tap
- [ ] Visual feedback when marked (checkmark, color change)
- [ ] Can add optional note to completion
- [ ] Auto-save on each mark
- [ ] Can undo accidental marks
- [ ] Can mark for past dates (catch-up)

### US2: View Monthly Progress

**As a user, I want to see my entire month at a glance so I can spot patterns.**

**Acceptance Criteria:**
- [ ] Can view full monthly grid
- [ ] See all habits and all days in one view
- [ ] Visual distinction between completed/incomplete
- [ ] See weekly totals
- [ ] See monthly goal vs actual per habit
- [ ] Progress bars with percentage
- [ ] Color coding (green/yellow/red)

### US3: Track Streaks

**As a user, I want to see my streaks so I stay motivated.**

**Acceptance Criteria:**
- [ ] Current streak calculated automatically
- [ ] Best streak tracked per habit
- [ ] Streak visible on habit detail view
- [ ] Broken streak notification (optional)
- [ ] Streak badges/achievements
- [ ] All-time best streak tracked

### US4: Monthly Review

**As a user, I want to review my month's performance so I can improve.**

**Acceptance Criteria:**
- [ ] Monthly summary dashboard
- [ ] Overall percentage score
- [ ] Top performers identified
- [ ] Habits needing attention highlighted
- [ ] Category breakdown
- [ ] Comparison to previous months
- [ ] Insights generated automatically
- [ ] Exportable report (PDF/CSV)

### US5: Manage Habits

**As a user, I want to add/edit/archive habits so I can customize my tracker.**

**Acceptance Criteria:**
- [ ] Can add new habit
- [ ] Can edit existing habit
- [ ] Can archive (not delete) habit
- [ ] Can reorder habits
- [ ] Can set custom goals per habit
- [ ] Can categorize habits
- [ ] Can link to Daily Quest / Best Week

### US6: Integration with Daily Quest

**As a user, I want my Daily Quest completions to auto-mark habits so I don't double-track.**

**Acceptance Criteria:**
- [ ] Completing Daily Quest item auto-marks linked habit
- [ ] Can see which habits are linked to Daily Quest
- [ ] Can override auto-mark if needed
- [ ] Visual indicator of auto-marked habits

---

## Technical Implementation Guide

### Phase 1: Data Layer (Week 1)

**Priority: HIGH**

1. **Database Schema**
   ```sql
   CREATE TABLE habits (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     category VARCHAR(50),
     life_area VARCHAR(50),
     frequency VARCHAR(50),
     monthly_goal INTEGER,
     tracking_type VARCHAR(20),
     is_time_bound BOOLEAN DEFAULT false,
     target_time TIME,
     time_window_start TIME,
     time_window_end TIME,
     icon VARCHAR(50),
     color VARCHAR(7),
     linked_daily_quest UUID,
     linked_best_week_block UUID,
     is_active BOOLEAN DEFAULT true,
     sort_order INTEGER,
     created_at TIMESTAMP,
     archived_at TIMESTAMP
   );

   CREATE TABLE habit_completions (
     id UUID PRIMARY KEY,
     habit_id UUID REFERENCES habits(id),
     user_id UUID NOT NULL,
     date DATE NOT NULL,
     completed BOOLEAN DEFAULT true,
     completed_at TIMESTAMP,
     note TEXT,
     linked_session_id UUID,
     auto_marked BOOLEAN DEFAULT false,
     UNIQUE(habit_id, date)
   );

   CREATE TABLE monthly_stats (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     month VARCHAR(7), -- "2026-03"
     total_habits INTEGER,
     total_possible_completions INTEGER,
     total_completions INTEGER,
     overall_percentage DECIMAL(5,2),
     habit_stats JSONB,
     category_stats JSONB,
     best_streak JSONB,
     insights TEXT[],
     created_at TIMESTAMP,
     updated_at TIMESTAMP,
     UNIQUE(user_id, month)
   );

   CREATE INDEX idx_habit_completions_user_date 
     ON habit_completions(user_id, date);
   CREATE INDEX idx_habit_completions_habit_date 
     ON habit_completions(habit_id, date);
   ```

2. **API Endpoints**
   ```
   # Habits CRUD
   GET    /api/habits
   POST   /api/habits
   GET    /api/habits/:id
   PUT    /api/habits/:id
   DELETE /api/habits/:id (soft delete/archive)
   POST   /api/habits/reorder
   
   # Completions
   GET    /api/habits/completions?month=2026-03
   POST   /api/habits/completions
   PUT    /api/habits/completions/:id
   DELETE /api/habits/completions/:id
   POST   /api/habits/completions/batch (mark multiple)
   
   # Stats & Analytics
   GET    /api/habits/stats/monthly?month=2026-03
   GET    /api/habits/stats/habit/:id
   POST   /api/habits/stats/calculate (trigger recalculation)
   GET    /api/habits/streaks
   
   # Integration
   POST   /api/habits/sync-from-daily-quest
   GET    /api/habits/today
   ```

3. **Business Logic**
   ```typescript
   // Streak calculation
   function calculateStreak(
     habitId: string, 
     completions: HabitCompletion[]
   ): { current: number; best: number } {
     // Sort by date descending
     const sorted = completions
       .filter(c => c.completed)
       .sort((a, b) => b.date.getTime() - a.date.getTime());
     
     // Current streak (consecutive from today backwards)
     let currentStreak = 0;
     let currentDate = new Date();
     currentDate.setHours(0,0,0,0);
     
     for (const completion of sorted) {
       const compDate = new Date(completion.date);
       compDate.setHours(0,0,0,0);
       
       const daysDiff = Math.floor(
         (currentDate.getTime() - compDate.getTime()) / (1000*60*60*24)
       );
       
       if (daysDiff === currentStreak) {
         currentStreak++;
       } else {
         break;
       }
     }
     
     // Best streak (longest consecutive)
     let bestStreak = 0;
     let tempStreak = 0;
     let prevDate: Date | null = null;
     
     for (const completion of sorted.reverse()) {
       const compDate = new Date(completion.date);
       
       if (prevDate === null) {
         tempStreak = 1;
       } else {
         const daysDiff = Math.floor(
           (compDate.getTime() - prevDate.getTime()) / (1000*60*60*24)
         );
         
         if (daysDiff === 1) {
           tempStreak++;
         } else {
           bestStreak = Math.max(bestStreak, tempStreak);
           tempStreak = 1;
         }
       }
       
       prevDate = compDate;
     }
     
     bestStreak = Math.max(bestStreak, tempStreak);
     
     return { current: currentStreak, best: bestStreak };
   }
   
   // Monthly stats calculation
   function calculateMonthlyStats(
     userId: string,
     month: string
   ): MonthlyStats {
     const habits = getActiveHabits(userId);
     const completions = getCompletionsForMonth(userId, month);
     
     const daysInMonth = getDaysInMonth(month);
     let totalPossible = 0;
     let totalCompleted = 0;
     
     const habitStats: HabitStat[] = habits.map(habit => {
       const habitCompletions = completions.filter(
         c => c.habitId === habit.id && c.completed
       );
       
       const goal = habit.monthlyGoal;
       const actual = habitCompletions.length;
       const percentage = (actual / goal) * 100;
       
       const streaks = calculateStreak(habit.id, completions);
       
       totalPossible += goal;
       totalCompleted += actual;
       
       return {
         habitId: habit.id,
         habitName: habit.name,
         goal,
         actual,
         percentage,
         currentStreak: streaks.current,
         bestStreak: streaks.best,
         weekdayCompletion: calculateWeekdayPercentage(habitCompletions),
         weekendCompletion: calculateWeekendPercentage(habitCompletions),
         weeklyBreakdown: calculateWeeklyBreakdown(habitCompletions, month)
       };
     });
     
     const overallPercentage = (totalCompleted / totalPossible) * 100;
     
     // Generate insights
     const insights = generateInsights(habitStats);
     const topPerformers = habitStats
       .filter(h => h.percentage >= 80)
       .map(h => h.habitId);
     const needsAttention = habitStats
       .filter(h => h.percentage < 60)
       .map(h => h.habitId);
     
     return {
       userId,
       month,
       totalHabits: habits.length,
       totalPossibleCompletions: totalPossible,
       totalCompletions: totalCompleted,
       overallPercentage,
       habitStats,
       topPerformers,
       needsAttention,
       insights,
       // ... other fields
     };
   }
   ```

### Phase 2: Monthly Grid UI (Week 2)

**Priority: HIGH**

1. **Grid Component**
   ```tsx
   interface MonthlyGridProps {
     month: string; // "2026-03"
     habits: Habit[];
     completions: HabitCompletion[];
     onToggle: (habitId: string, date: Date) => void;
   }
   
   function MonthlyGrid({ month, habits, completions, onToggle }: MonthlyGridProps) {
     const daysInMonth = getDaysInMonth(month);
     const weeks = groupDaysByWeek(daysInMonth);
     
     return (
       <div className="overflow-x-auto">
         <table className="habit-grid">
           <thead>
             <tr>
               <th className="sticky left-0">Habit Name</th>
               {weeks.map(week => (
                 <th key={week.number}>
                   Week {week.number}
                   <div className="day-headers">
                     {week.days.map(day => (
                       <span key={day}>{formatDay(day)}</span>
                     ))}
                   </div>
                 </th>
               ))}
               <th>Analysis</th>
             </tr>
           </thead>
           <tbody>
             {habits.map(habit => {
               const habitCompletions = getHabitCompletions(habit.id, completions);
               const stats = calculateHabitStats(habit, habitCompletions);
               
               return (
                 <tr key={habit.id}>
                   <td className="sticky left-0">
                     {habit.icon} {habit.name}
                     {habit.targetTime && <span>({habit.targetTime})</span>}
                   </td>
                   {weeks.map(week => (
                     <td key={week.number}>
                       <div className="checkbox-row">
                         {week.days.map(day => {
                           const completion = habitCompletions.find(
                             c => isSameDay(c.date, day)
                           );
                           return (
                             <Checkbox
                               key={day.toISOString()}
                               checked={completion?.completed || false}
                               onChange={() => onToggle(habit.id, day)}
                               disabled={isFutureDate(day)}
                             />
                           );
                         })}
                       </div>
                     </td>
                   ))}
                   <td>
                     <ProgressBar
                       goal={habit.monthlyGoal}
                       actual={stats.actual}
                       percentage={stats.percentage}
                     />
                   </td>
                 </tr>
               );
             })}
           </tbody>
           <tfoot>
             <tr>
               <td>Weekly Totals</td>
               {weeks.map(week => (
                 <td key={week.number}>
                   {calculateWeeklyTotal(week, completions)}
                 </td>
               ))}
               <td></td>
             </tr>
           </tfoot>
         </table>
       </div>
     );
   }
   ```

2. **Checkbox Component**
   ```tsx
   interface CheckboxProps {
     checked: boolean;
     onChange: () => void;
     disabled?: boolean;
   }
   
   function Checkbox({ checked, onChange, disabled }: CheckboxProps) {
     return (
       <button
         className={cn(
           "habit-checkbox",
           checked && "checked",
           disabled && "disabled"
         )}
         onClick={onChange}
         disabled={disabled}
         aria-label={checked ? "Completed" : "Not completed"}
       >
         {checked && <CheckIcon />}
       </button>
     );
   }
   ```

   ```css
   .habit-checkbox {
     width: 24px;
     height: 24px;
     border: 2px solid #e5e7eb;
     border-radius: 4px;
     cursor: pointer;
     transition: all 0.2s;
   }
   
   .habit-checkbox.checked {
     background-color: #10b981;
     border-color: #10b981;
     color: white;
   }
   
   .habit-checkbox:hover:not(.disabled) {
     border-color: #10b981;
     transform: scale(1.1);
   }
   
   .habit-checkbox.disabled {
     opacity: 0.3;
     cursor: not-allowed;
   }
   ```

3. **Progress Bar Component**
   ```tsx
   interface ProgressBarProps {
     goal: number;
     actual: number;
     percentage: number;
   }
   
   function ProgressBar({ goal, actual, percentage }: ProgressBarProps) {
     const color = percentage >= 80 
       ? 'bg-green-500' 
       : percentage >= 60 
       ? 'bg-yellow-500' 
       : 'bg-red-500';
     
     return (
       <div className="progress-container">
         <div className="flex justify-between text-sm mb-1">
           <span>Goal: {goal}</span>
           <span>Actual: {actual}</span>
           <span>{percentage.toFixed(0)}%</span>
         </div>
         <div className="progress-bar-bg">
           <div 
             className={`progress-bar-fill ${color}`}
             style={{ width: `${Math.min(percentage, 100)}%` }}
           />
         </div>
       </div>
     );
   }
   ```

### Phase 3: Today's View (Week 3)

**Priority: MEDIUM**

**Mobile-optimized daily checklist:**

```tsx
function TodaysHabits() {
  const today = new Date();
  const habits = useHabits();
  const completions = useCompletionsForDate(today);
  
  // Group by time of day
  const grouped = useMemo(() => {
    return {
      morning: habits.filter(h => isTimeBefore(h.targetTime, '12:00')),
      afternoon: habits.filter(h => isTimeBetween(h.targetTime, '12:00', '18:00')),
      evening: habits.filter(h => isTimeBetween(h.targetTime, '18:00', '22:00')),
      beforeSleep: habits.filter(h => isTimeAfter(h.targetTime, '22:00')),
      flexible: habits.filter(h => !h.isTimeBound)
    };
  }, [habits]);
  
  return (
    <div className="todays-habits">
      <header>
        <h2>Today's Habits</h2>
        <p>{formatDate(today, 'EEEE, MMMM d, yyyy')}</p>
      </header>
      
      {Object.entries(grouped).map(([period, periodHabits]) => (
        periodHabits.length > 0 && (
          <section key={period}>
            <h3>{formatPeriod(period)}</h3>
            {periodHabits.map(habit => {
              const completion = completions.find(c => c.habitId === habit.id);
              return (
                <HabitCheckItem
                  key={habit.id}
                  habit={habit}
                  completed={completion?.completed || false}
                  onToggle={() => toggleHabit(habit.id, today)}
                />
              );
            })}
          </section>
        )
      ))}
      
      <footer>
        <CompletionSummary completions={completions} total={habits.length} />
        <CurrentStreak />
      </footer>
    </div>
  );
}
```

### Phase 4: Analytics & Review (Week 4)

**Priority: MEDIUM**

1. **Monthly Stats Calculation**
   - Nightly batch job at 00:00
   - Recalculate on-demand when viewing review
   - Cache results for performance

2. **Insights Generation**
   ```typescript
   function generateInsights(habitStats: HabitStat[]): string[] {
     const insights: string[] = [];
     
     // Declining performance
     habitStats.forEach(habit => {
       if (habit.weeklyBreakdown[0] > 70 && 
           habit.weeklyBreakdown[3] < 40) {
         insights.push(
           `${habit.habitName}: Performance declining over month`
         );
       }
     });
     
     // Weekend weakness
     habitStats.forEach(habit => {
       if (habit.weekdayCompletion > 70 && 
           habit.weekendCompletion < 40) {
         insights.push(
           `${habit.habitName}: Weak on weekends (${habit.weekendCompletion}% vs ${habit.weekdayCompletion}% weekdays)`
         );
       }
     });
     
     // Category analysis
     const categoryAvg = calculateCategoryAverages(habitStats);
     const lowestCategory = Object.entries(categoryAvg)
       .sort(([,a], [,b]) => a - b)[0];
     if (lowestCategory[1] < 60) {
       insights.push(
         `${lowestCategory[0]} habits need attention (${lowestCategory[1]}% average)`
       );
     }
     
     return insights;
   }
   ```

3. **Charts & Visualization**
   ```tsx
   import { LineChart, BarChart } from 'recharts';
   
   function MonthlyTrendChart({ habitStats }: { habitStats: HabitStat[] }) {
     const data = habitStats.map(stat => ({
       name: stat.habitName,
       percentage: stat.percentage,
       goal: stat.goal,
       actual: stat.actual
     }));
     
     return (
       <BarChart width={600} height={300} data={data}>
         <XAxis dataKey="name" />
         <YAxis />
         <Tooltip />
         <Bar dataKey="percentage" fill="#3b82f6" />
       </BarChart>
     );
   }
   ```

### Phase 5: Integration (Week 5)

**Priority: LOW**

1. **Daily Quest Integration**
   ```typescript
   // When Daily Quest item is completed
   async function onDailyQuestComplete(questItem: DailyQuestItem) {
     // Find linked habit
     const linkedHabit = await db.habits.findOne({
       linkedDailyQuest: questItem.id
     });
     
     if (linkedHabit) {
       // Auto-mark habit for today
       await db.habitCompletions.upsert({
         habitId: linkedHabit.id,
         date: new Date(),
         completed: true,
         autoMarked: true,
         linkedSessionId: questItem.sessionId
       });
     }
   }
   ```

2. **Best Week Integration**
   ```typescript
   // When creating Best Week template, suggest habits
   function suggestHabitsFromBestWeek(blocks: TimeBlock[]): Habit[] {
     return blocks
       .filter(block => block.category === 'high_lifetime_value')
       .map(block => ({
         name: block.title,
         frequency: 'daily',
         monthlyGoal: 30,
         targetTime: block.startTime,
         linkedBestWeekBlock: block.id
       }));
   }
   ```

---

## Color Scheme

```typescript
const HABIT_COLORS = {
  // Progress bars
  excellent: '#10B981',  // Green (80-100%)
  good: '#F59E0B',       // Amber (60-79%)
  needsWork: '#EF4444',  // Red (<60%)
  
  // Categories (match 7 Life Areas)
  spiritual: '#8B5CF6',   // Purple
  kesehatan: '#10B981',   // Green
  karir: '#3B82F6',       // Blue
  keuangan: '#F59E0B',    // Amber
  relasi: '#EC4899',      // Pink
  petualangan: '#06B6D4', // Cyan
  kontribusi: '#14B8A6',  // Teal
  
  // UI elements
  checked: '#10B981',     // Green
  unchecked: '#E5E7EB',   // Gray
  disabled: '#9CA3AF',    // Gray-400
  
  // Streaks
  streak: '#F97316',      // Orange (fire)
};
```

---

## Performance Optimization

### 1. Virtual Scrolling

For users with 20+ habits:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedMonthlyGrid({ habits }: { habits: Habit[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: habits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
    overscan: 5
  });
  
  return (
    <div ref={parentRef} className="grid-container">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const habit = habits[virtualRow.index];
          return (
            <HabitRow
              key={habit.id}
              habit={habit}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
```

### 2. Optimistic Updates

```typescript
function useOptimisticToggle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ habitId, date, completed }) => {
      return api.toggleHabit(habitId, date, completed);
    },
    onMutate: async ({ habitId, date, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['habits', 'completions']);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['habits', 'completions']);
      
      // Optimistically update
      queryClient.setQueryData(['habits', 'completions'], old => {
        // Update completion in cache
        return updateCompletionInCache(old, habitId, date, completed);
      });
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['habits', 'completions'], context.previous);
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries(['habits', 'completions']);
    }
  });
}
```

### 3. Caching Strategy

```typescript
// Cache monthly data aggressively
const monthlyDataQuery = useQuery({
  queryKey: ['habits', 'monthly', month],
  queryFn: () => fetchMonthlyData(month),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});

// Fresh data for today
const todayQuery = useQuery({
  queryKey: ['habits', 'today'],
  queryFn: () => fetchTodayHabits(),
  staleTime: 0, // Always fresh
  refetchInterval: 60 * 1000, // Refetch every minute
});
```

---

## Mobile Responsiveness

### Breakpoints

```css
/* Mobile first */
.monthly-grid {
  /* Stack habits vertically */
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .monthly-grid {
    /* Show 2-3 weeks horizontally */
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .monthly-grid {
    /* Show full month grid */
  }
}
```

### Touch Optimization

```tsx
// Larger touch targets on mobile
const Checkbox = styled.button`
  width: ${isMobile ? '32px' : '24px'};
  height: ${isMobile ? '32px' : '24px'};
  
  /* Prevent double-tap zoom */
  touch-action: manipulation;
`;

// Swipe gestures
import { useSwipeable } from 'react-swipeable';

function HabitRow({ habit }: { habit: Habit }) {
  const handlers = useSwipeable({
    onSwipedRight: () => markComplete(habit.id),
    onSwipedLeft: () => markIncomplete(habit.id),
  });
  
  return <div {...handlers}>...</div>;
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Streak calculation logic
- [ ] Monthly stats calculation
- [ ] Insight generation algorithm
- [ ] Date utilities (week grouping, etc.)

### Integration Tests
- [ ] Mark habit complete/incomplete
- [ ] Calculate monthly stats
- [ ] Auto-mark from Daily Quest
- [ ] Archive/restore habit

### E2E Tests
- [ ] Complete onboarding (add habits)
- [ ] Mark today's habits
- [ ] View monthly grid
- [ ] Review monthly stats
- [ ] Link to Daily Quest

### Performance Tests
- [ ] Grid loads <2s with 20 habits
- [ ] Checkbox response <100ms
- [ ] Monthly calculation <1s
- [ ] Virtual scrolling smooth (60fps)

---

## Success Metrics

### Adoption
- % of users who set up habits
- Average habits per user
- Retention after 1 month

### Engagement
- Daily check-in rate
- Average completion percentage
- Monthly review views

### Outcomes
- Average streak length
- Month-over-month improvement
- User-reported habit formation success

---

## Future Enhancements (Post-MVP)

1. **Habit Templates**
   - Pre-built habit sets (Morning Routine, Prayer Schedule, Fitness Plan)
   - One-click import

2. **Reminders & Notifications**
   - Time-based reminders
   - Streak protection alerts
   - Weekly review notifications

3. **Social Features**
   - Share progress with friends
   - Accountability partners
   - Group challenges

4. **Advanced Analytics**
   - Correlation analysis (which habits boost others?)
   - Predictive insights
   - AI-powered suggestions

5. **Gamification++**
   - Leaderboards
   - Challenges & quests
   - Reward system
   - Level progression

---

## Files to Create

```
/lib
  /habits
    - models.ts           (Data models & interfaces)
    - api.ts              (API calls)
    - calculations.ts     (Streak, stats logic)
    - utils.ts            (Date helpers, formatters)

/components
  /habits
    - MonthlyGrid.tsx
    - TodaysHabits.tsx
    - HabitRow.tsx
    - Checkbox.tsx
    - ProgressBar.tsx
    - HabitDetail.tsx
    - MonthlyReview.tsx
    - HabitForm.tsx
    - StreakBadge.tsx

/pages
  /habits
    - monthly.tsx
    - today.tsx
    - review.tsx

/hooks
  - useHabits.ts
  - useCompletions.ts
  - useMonthlyStats.ts
  - useStreaks.ts
```

---

## Timeline Estimate

- **Week 1:** Data layer + API (20-25h)
- **Week 2:** Monthly grid UI (25-30h)
- **Week 3:** Today's view + mobile (15-20h)
- **Week 4:** Analytics + review (15-20h)
- **Week 5:** Integration + polish (10-15h)

**Total: 85-110 hours** (~3-4 weeks full-time)

---

## References

- Concept doc: `HABIT_TRACKER_CONCEPT.md`
- User's current spreadsheet (screenshot)
- Daily Quest implementation (existing)
- Best Week framework (existing)
- Sync Planner 7 Life Areas
