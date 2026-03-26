# BEST WEEK - Technical Implementation Specification

## Feature Overview

Implement "Best Week" feature in Better Planner app - a visual time-blocking and activity categorization tool that helps users design their ideal week and track adherence.

**Read First:** See `BEST_WEEK_CONCEPT.md` for full conceptual framework.

---

## Data Model

### BestWeekTemplate

```typescript
interface BestWeekTemplate {
  id: string;
  userId: string;
  name: string; // e.g., "Default Weekday", "Weekend", "Project Mode"
  isDefault: boolean;
  
  // Template for different day types
  weekdayTemplate: DayTemplate;
  weekendTemplate: DayTemplate;
  
  // Category targets (hours per week)
  targets: {
    highLifetimeValue: number;   // e.g., 20 hours/week
    highRupiahValue: number;      // e.g., 30 hours/week
    lowRupiahValue: number;       // e.g., 10 hours/week
    zeroRupiahValue: number;      // e.g., 0-2 hours/week (minimize)
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface DayTemplate {
  blocks: TimeBlock[];
}

interface TimeBlock {
  id: string;
  startTime: string;        // "HH:MM" format, e.g., "06:00"
  endTime: string;          // "HH:MM" format, e.g., "08:00"
  category: ActivityCategory;
  title: string;            // e.g., "Morning Routine"
  description?: string;
  
  // Mapping to quest system
  questMapping?: {
    type: 'daily_quest' | 'main_quest' | 'work_quest' | 'side_quest' | 'none';
    activities: string[];   // e.g., ["Exercise", "Meditation"]
  };
  
  // Visual
  color: string;            // hex color based on category
  icon?: string;
}

enum ActivityCategory {
  HIGH_LIFETIME_VALUE = 'high_lifetime_value',
  HIGH_RUPIAH_VALUE = 'high_rupiah_value',
  LOW_RUPIAH_VALUE = 'low_rupiah_value',
  ZERO_RUPIAH_VALUE = 'zero_rupiah_value',
  TRANSITION = 'transition',  // breaks, meals
  UNSCHEDULED = 'unscheduled' // buffer time
}
```

### Activity (for categorization)

```typescript
interface Activity {
  id: string;
  userId: string;
  name: string;
  category: ActivityCategory;
  description?: string;
  
  // Estimated time
  estimatedDuration?: number; // minutes
  
  // Quest mapping
  defaultQuestType?: 'daily' | 'main' | 'work' | 'side';
  
  // 7 Life Areas mapping
  lifeArea?: LifeArea[];
  
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'custom';
  
  createdAt: Date;
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

### WeeklyAdherence (tracking)

```typescript
interface WeeklyAdherence {
  id: string;
  userId: string;
  weekStartDate: Date; // Monday of the week
  
  // Planned (from Best Week template)
  planned: {
    highLifetimeValue: number;
    highRupiahValue: number;
    lowRupiahValue: number;
    zeroRupiahValue: number;
  };
  
  // Actual (from logged sessions)
  actual: {
    highLifetimeValue: number;
    highRupiahValue: number;
    lowRupiahValue: number;
    zeroRupiahValue: number;
  };
  
  // Calculated metrics
  adherenceRate: number; // 0-100%
  categoryAdherence: {
    highLifetimeValue: number; // %
    highRupiahValue: number;   // %
    lowRupiahValue: number;    // %
  };
  
  // Notes
  insights?: string[];
  wins?: string[];
  challenges?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## UI Components

### 1. Best Week Builder (Main Interface)

**Route:** `/planning/best-week`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ [<] Best Week Builder           [Save] [Reset]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Template: [Weekday ▼] [Weekend] [+ New]       │
│                                                  │
│  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ Activity Library │  │   Time Blocks        │ │
│  ├──────────────────┤  ├─────────────────────┤ │
│  │                  │  │                      │ │
│  │ 🌟 High Lifetime │  │ 06:00 ────────────  │ │
│  │ [ ] Exercise     │  │ │ Morning Routine  │ │
│  │ [ ] Meditation   │  │ │ HLVA - 2h        │ │
│  │ [ ] Learning     │  │ 08:00 ────────────  │ │
│  │                  │  │                      │ │
│  │ 💰 High Rupiah   │  │ 08:00 ────────────  │ │
│  │ [ ] Deep Work    │  │ │ Deep Work Block  │ │
│  │ [ ] Client Call  │  │ │ HRVA - 4h        │ │
│  │                  │  │ 12:00 ────────────  │ │
│  │ 📋 Low Rupiah    │  │                      │ │
│  │ [ ] Email        │  │ 12:00 ────────────  │ │
│  │ [ ] Admin        │  │ │ Lunch Break      │ │
│  │                  │  │ 13:00 ────────────  │ │
│  │ ⛔ Zero Rupiah   │  │                      │ │
│  │ [ ] Social Media │  │ ...                  │ │
│  │                  │  │                      │ │
│  │ [+ Add Activity] │  │ [+ Add Block]       │ │
│  └──────────────────┘  └─────────────────────┘ │
│                                                  │
├─────────────────────────────────────────────────┤
│ Weekly Targets                                   │
│ High Lifetime: [20] hours/week                  │
│ High Rupiah:   [30] hours/week                  │
│ Low Rupiah:    [10] hours/week                  │
│ Zero Rupiah:   [ 0] hours/week (minimize!)      │
└─────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop time blocks
- Visual time blocking (Gantt chart style)
- Color-coded by category
- Duplicate weekday → weekend option
- Multiple template support
- Real-time hour calculation

### 2. Activity Categorization Wizard

**Flow for new users:**

```
Step 1: List Your Activities
┌─────────────────────────────────┐
│ What do you do in a typical     │
│ week? List all activities.      │
│                                  │
│ [Exercise            ] [+ Add]  │
│ [Deep Work           ] [+ Add]  │
│ [Email               ] [+ Add]  │
│ [Family Time         ] [+ Add]  │
│ ...                              │
│                                  │
│           [Next →]               │
└─────────────────────────────────┘

Step 2: Categorize Each Activity
┌─────────────────────────────────┐
│ Activity: Exercise               │
│                                  │
│ Which category best fits?        │
│                                  │
│ ( ) 🌟 High Lifetime Value      │
│     Long-term life impact        │
│                                  │
│ ( ) 💰 High Rupiah Value        │
│     Core work, revenue-gen       │
│                                  │
│ ( ) 📋 Low Rupiah Value         │
│     Necessary admin work         │
│                                  │
│ ( ) ⛔ Zero Rupiah Value         │
│     Time waster, distraction     │
│                                  │
│      [← Back]      [Next →]     │
└─────────────────────────────────┘

Step 3: Time Blocking
┌─────────────────────────────────┐
│ Now let's build your ideal day! │
│                                  │
│ Drag activities into time slots │
│                                  │
│ [Visual time blocking interface] │
│                                  │
│           [Finish ✓]             │
└─────────────────────────────────┘
```

### 3. Daily Reference View

**In Daily Sync page, add collapsible section:**

```
┌────────────────────────────────────┐
│ 📅 Best Week Reference        [▼] │
├────────────────────────────────────┤
│ Today's Ideal Schedule:             │
│                                     │
│ 06:00-08:00  Morning Routine (HLVA)│
│ 08:00-12:00  Deep Work Block (HRVA)│
│ 12:00-13:00  Lunch Break            │
│ 13:00-17:00  Deep Work Block (HRVA)│
│ 17:00-18:00  Admin Time (LRVA)     │
│ 18:00-21:00  Family Time (HLVA)    │
│                                     │
│ Expected Time by Category:          │
│ 🌟 High Lifetime: 4h               │
│ 💰 High Rupiah: 8h                 │
│ 📋 Low Rupiah: 1h                  │
└────────────────────────────────────┘
```

### 4. Weekly Adherence Dashboard

**Route:** `/analytics/best-week`

```
┌─────────────────────────────────────────────┐
│ Best Week Adherence - Week 11               │
├─────────────────────────────────────────────┤
│                                              │
│  Overall Adherence: 78% ⚡ Good!            │
│  ████████████████░░░░░░                     │
│                                              │
│  Category Breakdown:                         │
│                                              │
│  🌟 High Lifetime Value                     │
│     Planned: 20h  |  Actual: 15h  (75%)    │
│     ████████████░░░░                        │
│                                              │
│  💰 High Rupiah Value                       │
│     Planned: 30h  |  Actual: 32h  (107%) 🔥│
│     ████████████████                        │
│                                              │
│  📋 Low Rupiah Value                        │
│     Planned: 10h  |  Actual: 8h   (80%)    │
│     ████████████░░                          │
│                                              │
│  ⛔ Zero Rupiah Value                       │
│     Target: <2h   |  Actual: 3h   ⚠️       │
│     - Instagram: 2h                         │
│     - Random browsing: 1h                   │
│                                              │
├─────────────────────────────────────────────┤
│  Daily Breakdown:                            │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun         │
│  85%  90%  70%  65%  88%  75%  73%         │
│                                              │
│  [View Details] [Adjust Best Week]          │
└─────────────────────────────────────────────┘
```

### 5. Mini Widget (Dashboard)

Quick reference widget for main dashboard:

```
┌────────────────────────────┐
│ 📅 Best Week               │
├────────────────────────────┤
│ This week: 78% adherence   │
│                             │
│ Now (14:30):                │
│ ► Deep Work Block (HRVA)   │
│   Until 17:00               │
│                             │
│ Up next:                    │
│ Admin Time (LRVA)           │
│ 17:00-18:00                 │
│                             │
│ [View Full Schedule]        │
└────────────────────────────┘
```

---

## User Stories & Acceptance Criteria

### US1: Create Best Week Template

**As a user, I want to create my ideal week template so I can plan proactively.**

**Acceptance Criteria:**
- [ ] Can access Best Week Builder from planning menu
- [ ] Can categorize activities into 4 levels (HLVA/HRVA/LRVA/ZRVA)
- [ ] Can create time blocks with drag-and-drop
- [ ] Can set different templates for weekday vs weekend
- [ ] Can save template and set as default
- [ ] Can see total hours per category
- [ ] Can validate that total doesn't exceed 24h/day

### US2: Reference Best Week Daily

**As a user, I want to see my Best Week plan during daily planning so I stay on track.**

**Acceptance Criteria:**
- [ ] Can see Best Week reference in Daily Sync page
- [ ] Shows today's ideal schedule from template
- [ ] Shows current time block highlighted
- [ ] Shows next upcoming block
- [ ] Can toggle visibility (expand/collapse)

### US3: Track Weekly Adherence

**As a user, I want to compare my actual week vs Best Week to improve.**

**Acceptance Criteria:**
- [ ] System automatically tracks time by category from logged sessions
- [ ] Can view weekly adherence dashboard
- [ ] Shows planned vs actual hours per category
- [ ] Shows overall adherence percentage
- [ ] Shows daily breakdown (adherence per day)
- [ ] Identifies Zero Rupiah activities that crept in
- [ ] Can add notes/insights for the week

### US4: Activity Library Management

**As a user, I want to manage my activity library so I can reuse activities.**

**Acceptance Criteria:**
- [ ] Can create new activities
- [ ] Can assign category to each activity
- [ ] Can map activity to life areas (7 areas)
- [ ] Can set estimated duration
- [ ] Can mark activity as recurring
- [ ] Can edit/delete activities
- [ ] Can search/filter activity library

### US5: Auto-populate Daily Quest from Best Week

**As a user, I want my Daily Quest to auto-fill from Best Week so I save time.**

**Acceptance Criteria:**
- [ ] Daily Quest items can be linked to Best Week blocks
- [ ] HLVA blocks auto-create Daily Quest checkboxes
- [ ] LRVA blocks (recurring) auto-create Daily Quest items
- [ ] Can override auto-population if needed
- [ ] Weekday vs weekend templates create different Daily Quests

---

## Technical Implementation Guide

### Phase 1: Data Layer (Week 1)

**Priority: HIGH**

1. **Database Schema**
   - Create `best_week_templates` table
   - Create `activities` table
   - Create `time_blocks` table
   - Create `weekly_adherence` table

2. **API Endpoints**
   ```
   POST   /api/best-week/templates
   GET    /api/best-week/templates
   GET    /api/best-week/templates/:id
   PUT    /api/best-week/templates/:id
   DELETE /api/best-week/templates/:id
   
   POST   /api/best-week/activities
   GET    /api/best-week/activities
   PUT    /api/best-week/activities/:id
   DELETE /api/best-week/activities/:id
   
   GET    /api/best-week/adherence/weekly
   POST   /api/best-week/adherence/calculate
   ```

3. **Business Logic**
   - Template validation (no overlapping blocks)
   - Hour calculation per category
   - Adherence calculation algorithm
   - Category color mapping

### Phase 2: Best Week Builder UI (Week 2)

**Priority: HIGH**

1. **Activity Library Component**
   - List view with categories
   - Add/edit/delete activities
   - Category filter
   - Search functionality

2. **Time Block Editor**
   - Visual time slots (00:00 - 24:00)
   - Drag-and-drop interface
   - Block creation/editing modal
   - Color coding by category
   - Duration auto-calculation

3. **Template Management**
   - Create new template
   - Weekday/Weekend tabs
   - Save/Load templates
   - Set default template
   - Clone template feature

### Phase 3: Daily Integration (Week 3)

**Priority: MEDIUM**

1. **Best Week Reference Widget**
   - Collapsible section in Daily Sync
   - Current time block highlighting
   - Next block preview
   - Quick stats (hours by category today)

2. **Auto-population Logic**
   - Daily Quest generation from Best Week
   - Morning: populate from HLVA blocks
   - Evening: populate from LRVA blocks
   - User can override/customize

3. **Quest Mapping**
   - Link time blocks to Quest types
   - Activity → Quest type defaults
   - Visual indicators in Quest sections

### Phase 4: Analytics & Tracking (Week 4)

**Priority: MEDIUM**

1. **Session Categorization**
   - When user logs session, auto-categorize based on Quest type
   - Manual override option
   - Category tagging in session log

2. **Adherence Calculation**
   - Nightly batch job to calculate weekly adherence
   - Compare logged sessions vs Best Week template
   - Generate insights (e.g., "Low on High Lifetime this week")

3. **Adherence Dashboard**
   - Weekly view with charts
   - Category breakdown (planned vs actual)
   - Daily granularity
   - Historical trends (last 4-12 weeks)
   - Exportable reports

### Phase 5: Onboarding & Polish (Week 5)

**Priority: LOW**

1. **Activity Categorization Wizard**
   - Step-by-step guided flow
   - Help text explaining each category
   - Example activities per category
   - Skip option for power users

2. **Templates & Examples**
   - Pre-built templates (Software Engineer, Entrepreneur, Student, etc.)
   - Import template feature
   - Community template sharing (future)

3. **Help & Documentation**
   - Tooltip explanations
   - Video tutorial
   - Link to BEST_WEEK_CONCEPT.md

---

## Integration Points

### With Daily Sync

```typescript
// On Daily Sync page load
async function loadDailyPlan() {
  // 1. Get user's default Best Week template
  const template = await getBestWeekTemplate(userId, 'default');
  
  // 2. Get today's template (weekday or weekend)
  const dayType = isWeekend(today) ? 'weekend' : 'weekday';
  const todayTemplate = template[`${dayType}Template`];
  
  // 3. Display reference section
  renderBestWeekReference(todayTemplate);
  
  // 4. Auto-populate Daily Quest if not already done
  if (!dailyQuestPopulated) {
    autoPopulateDailyQuest(todayTemplate);
  }
}
```

### With Quest System

```typescript
// Map activity category to Quest type
function getQuestType(category: ActivityCategory): QuestType {
  switch (category) {
    case ActivityCategory.HIGH_LIFETIME_VALUE:
      return 'daily_quest'; // Foundation
    case ActivityCategory.HIGH_RUPIAH_VALUE:
      return 'main_quest'; // or 'work_quest' based on user config
    case ActivityCategory.LOW_RUPIAH_VALUE:
      return 'side_quest'; // or 'daily_quest' if recurring
    case ActivityCategory.ZERO_RUPIAH_VALUE:
      return 'to_dont_list';
    default:
      return 'main_quest';
  }
}
```

### With Session Tracking

```typescript
// When user completes a session
async function logSession(sessionData) {
  // 1. Normal session logging
  const session = await createSession(sessionData);
  
  // 2. Categorize based on Quest type
  const category = getCategoryFromQuestType(session.questType);
  
  // 3. Update weekly adherence
  await updateWeeklyAdherence(userId, {
    category,
    duration: session.duration,
    weekStartDate: getWeekStart(session.completedAt)
  });
}
```

---

## Color Scheme

```typescript
const CATEGORY_COLORS = {
  [ActivityCategory.HIGH_LIFETIME_VALUE]: {
    primary: '#10B981',   // Green
    light: '#D1FAE5',
    dark: '#047857',
    icon: '🌟'
  },
  [ActivityCategory.HIGH_RUPIAH_VALUE]: {
    primary: '#3B82F6',   // Blue
    light: '#DBEAFE',
    dark: '#1E40AF',
    icon: '💰'
  },
  [ActivityCategory.LOW_RUPIAH_VALUE]: {
    primary: '#F59E0B',   // Amber
    light: '#FEF3C7',
    dark: '#D97706',
    icon: '📋'
  },
  [ActivityCategory.ZERO_RUPIAH_VALUE]: {
    primary: '#EF4444',   // Red
    light: '#FEE2E2',
    dark: '#B91C1C',
    icon: '⛔'
  },
  [ActivityCategory.TRANSITION]: {
    primary: '#8B5CF6',   // Purple
    light: '#EDE9FE',
    dark: '#6D28D9',
    icon: '⏸️'
  },
  [ActivityCategory.UNSCHEDULED]: {
    primary: '#6B7280',   // Gray
    light: '#F3F4F6',
    dark: '#374151',
    icon: '📭'
  }
};
```

---

## Testing Checklist

### Unit Tests
- [ ] Template validation logic
- [ ] Hour calculation per category
- [ ] Overlapping block detection
- [ ] Adherence calculation algorithm
- [ ] Quest type mapping

### Integration Tests
- [ ] Create and save template
- [ ] Load template in Daily Sync
- [ ] Auto-populate Daily Quest
- [ ] Session categorization
- [ ] Weekly adherence calculation

### E2E Tests
- [ ] Complete onboarding wizard
- [ ] Create Best Week from scratch
- [ ] Use Best Week for daily planning
- [ ] Log sessions and track adherence
- [ ] View weekly adherence dashboard

### UX Tests
- [ ] Time blocking drag-and-drop smooth
- [ ] Color coding clear and intuitive
- [ ] Mobile responsive
- [ ] Load time acceptable (<2s)
- [ ] Help text clear and useful

---

## Success Metrics

### Adoption
- % of users who complete Best Week setup
- % of users who reference Best Week daily
- Average templates per user

### Engagement
- Daily Quest auto-population usage rate
- Weekly adherence dashboard views
- Template edits/iterations frequency

### Outcomes
- Average weekly adherence rate
- Correlation: adherence % vs goal completion %
- User-reported satisfaction with work-life balance

---

## Future Enhancements (Post-MVP)

1. **AI Suggestions**
   - Suggest activity categorization based on description
   - Suggest optimal time blocks based on user patterns
   - Suggest adjustments based on adherence data

2. **Templates Marketplace**
   - Share Best Week templates with community
   - Browse templates by role/industry
   - Import and customize community templates

3. **Smart Notifications**
   - Remind user of current Best Week block
   - Alert when spending too long on Zero Rupiah
   - Nudge to protect High Lifetime activities

4. **Calendar Integration**
   - Sync Best Week blocks to Google Calendar
   - Import calendar events to Best Week
   - Block time automatically

5. **Team Best Week**
   - Share Best Week with team/family
   - Coordinate schedules
   - Find common free blocks

---

## Files to Create

```
/lib
  /best-week
    - models.ts          (Data models & interfaces)
    - api.ts             (API calls)
    - calculations.ts    (Adherence calculation logic)
    - validation.ts      (Template validation)
    - utils.ts           (Helper functions)

/components
  /best-week
    - BestWeekBuilder.tsx
    - ActivityLibrary.tsx
    - TimeBlockEditor.tsx
    - TemplateSelector.tsx
    - CategoryBadge.tsx
    - AdherenceDashboard.tsx
    - BestWeekReference.tsx
    - OnboardingWizard.tsx

/pages
  /planning
    - best-week.tsx
  /analytics
    - best-week-adherence.tsx

/styles
  /best-week
    - builder.module.css
    - widgets.module.css
```

---

## Dependencies

```json
{
  "react-beautiful-dnd": "^13.1.1",    // Drag and drop
  "react-big-calendar": "^1.8.5",      // Calendar view
  "recharts": "^2.10.3",               // Charts for adherence
  "date-fns": "^2.30.0",               // Date utilities
  "clsx": "^2.0.0",                    // Conditional classes
  "framer-motion": "^10.16.16"         // Animations
}
```

---

## Timeline Estimate

- **Week 1:** Data model + API endpoints (20-25 hours)
- **Week 2:** Best Week Builder UI (25-30 hours)
- **Week 3:** Daily integration + auto-populate (15-20 hours)
- **Week 4:** Analytics dashboard (15-20 hours)
- **Week 5:** Onboarding + polish (10-15 hours)

**Total: 85-110 hours** (~3-4 weeks full-time)

---

## Questions for Clarification

Before starting implementation, confirm:

1. **Scope:** MVP is template builder + daily reference + basic adherence tracking?
2. **Priority:** Which features are must-have vs nice-to-have for V1?
3. **Data:** Can we retroactively categorize existing sessions for adherence?
4. **UI Framework:** React? Next.js? Existing component library?
5. **Mobile:** Mobile-first design or desktop-first with responsive?
6. **Integration:** Any existing calendar/scheduling integrations to consider?

---

## References

- Concept doc: `BEST_WEEK_CONCEPT.md`
- Sync Planner 4.0 PDF
- LifeOS framework (Ali Abdaal)
- Daily Quest implementation (existing)
- Quest system architecture (existing)
