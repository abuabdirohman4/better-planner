# PROMPT FOR CLAUDE CODE: Implement Best Week Feature

## Context

I'm building a productivity app called "Better Planner" that integrates concepts from:
- **Sync Planner 4.0** - 12-week goal system with daily/weekly rituals
- **LifeOS (Ali Abdaal)** - Vision + Action framework with Focused Hours concept
- **Daily Quest system** - Foundation time tracking (already implemented)

I need to add a **"Best Week"** feature - a visual time-blocking and activity categorization tool that helps users design their ideal week and track adherence.

## Reference Documents

**READ THESE FIRST:**
1. `BEST_WEEK_CONCEPT.md` - Full conceptual framework (philosophy, 4 activity levels, integration guide)
2. `BEST_WEEK_IMPLEMENTATION.md` - Technical spec (data models, UI components, user stories, API endpoints)
3. `BEST_WEEK_EXAMPLES.md` - Example templates for different user types

## Current Tech Stack

```
Frontend: React + Next.js + TypeScript
Styling: Tailwind CSS + shadcn/ui components
State: React Context + hooks
Database: [SPECIFY YOUR DB - e.g., PostgreSQL, Supabase, Firebase]
Backend: [SPECIFY - e.g., Next.js API routes, Express, tRPC]
```

## Existing Features (Already Built)

✅ **Daily Sync page** with:
- Total focus time tracking
- Session counter (16/16 sessions)
- Quest Stats (Main Quest, Work Quest, Side Quest)
- Session-based + Task-based tracking
- Pomodoro timer integration

✅ **Quest System**:
- Main Quest (high-priority project work)
- Work Quest (professional tasks)
- Side Quest (lower priority tasks)
- Daily Quest section (foundation/maintenance tasks) - recently added

✅ **Daily Quest** (just implemented):
- Checkbox-based recurring tasks
- Examples: Morning Routine, Exercise, Update Finance, Bersih Rumah
- Separate from session-tracked work

## What I Need You to Build

### PHASE 1 (MVP - Priority: HIGHEST) 🎯

Build the **core Best Week system** with essential features:

1. **Data Layer**
   - Best Week template data model (see `BEST_WEEK_IMPLEMENTATION.md` for schema)
   - Activity library data model
   - Database tables/schema
   - API endpoints for CRUD operations
   - Adherence calculation logic

2. **Best Week Builder Interface** (`/planning/best-week`)
   - Visual time-blocking UI (00:00 - 24:00 timeline)
   - Activity categorization into 4 levels:
     - 🌟 High Lifetime Value (long-term life impact)
     - 💰 High Rupiah Value (core work, revenue-generating)
     - 📋 Low Rupiah Value (necessary admin work)
     - ⛔ Zero Rupiah Value (time wasters to minimize)
   - Drag-and-drop time blocks (or simple form if drag-drop complex)
   - Color coding by category (see color scheme in implementation doc)
   - Save/load template functionality
   - Weekday vs Weekend template tabs

3. **Daily Reference Widget**
   - Add collapsible section in Daily Sync page
   - Show today's Best Week schedule
   - Highlight current time block
   - Show next upcoming block
   - Quick category hour summary

4. **Basic Adherence Tracking**
   - Auto-categorize logged sessions based on Quest type
   - Calculate weekly adherence (planned vs actual hours per category)
   - Simple weekly stats view

### PHASE 2 (Nice-to-have - Priority: MEDIUM)

If time permits after Phase 1:

5. **Activity Library Management**
   - Create/edit/delete activities
   - Auto-categorization suggestions
   - Link activities to life areas (7 areas from Sync Planner)

6. **Adherence Dashboard** (`/analytics/best-week`)
   - Visual charts (bar/line charts)
   - Category breakdown (planned vs actual)
   - Daily granularity view
   - Historical trends

7. **Auto-populate Daily Quest**
   - Pull High Lifetime activities from Best Week → Daily Quest
   - User can override/customize

### PHASE 3 (Future - Priority: LOW)

Not needed now, but document for future:

8. **Onboarding Wizard** - Step-by-step template creation
9. **Pre-built Templates** - Import example templates
10. **Smart Notifications** - Remind user of current block

## Key Design Decisions

### 1. Activity Categorization (Critical!)

The **4-level framework** is core to Best Week:

```
HIGH LIFETIME VALUE (HLVA)
├─ Definition: Long-term life impact activities
├─ Examples: Exercise, family time, learning, spiritual practice
├─ Color: Green (#10B981)
├─ Quest Mapping: → DAILY QUEST (Foundation)
└─ Weekly Target: 15-25 hours

HIGH RUPIAH VALUE (HRVA)
├─ Definition: Core work, revenue-generating, strategic
├─ Examples: Deep work, client calls, product development
├─ Color: Blue (#3B82F6)
├─ Quest Mapping: → MAIN QUEST / WORK QUEST
└─ Weekly Target: 25-35 hours

LOW RUPIAH VALUE (LRVA)
├─ Definition: Necessary admin work, support tasks
├─ Examples: Email, meetings, maintenance, updates
├─ Color: Amber (#F59E0B)
├─ Quest Mapping: → SIDE QUEST / DAILY QUEST (maintenance)
└─ Weekly Target: 5-15 hours

ZERO RUPIAH VALUE (ZRVA)
├─ Definition: Time wasters, distractions
├─ Examples: Social media scrolling, random browsing
├─ Color: Red (#EF4444)
├─ Quest Mapping: → TO DON'T LIST
└─ Weekly Target: Minimize! (<2 hours)
```

### 2. Quest Mapping Logic

```typescript
// How Best Week categories map to existing Quest system:

function getQuestType(category: ActivityCategory): QuestType {
  switch (category) {
    case 'high_lifetime_value':
      return 'daily_quest';  // Foundation time
    case 'high_rupiah_value':
      return 'main_quest';   // or 'work_quest' based on activity
    case 'low_rupiah_value':
      return 'side_quest';   // or 'daily_quest' if recurring
    case 'zero_rupiah_value':
      return 'to_dont_list'; // Track to avoid
  }
}

// When calculating adherence:
// - Sessions logged under MAIN/WORK Quest → High Rupiah
// - Sessions/tasks from DAILY Quest → High Lifetime or Low Rupiah
// - To Don't List violations → Zero Rupiah
```

### 3. Time Block Structure

Keep it simple for MVP:

```typescript
interface TimeBlock {
  startTime: string;  // "08:00"
  endTime: string;    // "10:00"
  category: 'high_lifetime_value' | 'high_rupiah_value' | 'low_rupiah_value' | 'zero_rupiah_value';
  title: string;      // "Deep Work Block"
  description?: string;
  color: string;      // Category color
}

// Calculate duration automatically:
const duration = calculateDuration(startTime, endTime); // in minutes
```

### 4. UI Simplicity Principles

- **Clean over feature-rich** - Start minimal, add complexity later
- **Mobile-first** - Many users will check on phone
- **Quick reference** - Daily view should load fast (<1s)
- **Visual hierarchy** - Category colors should be instantly recognizable

## Implementation Approach

### Step 1: Data Foundation (Do First!)

```bash
# 1. Create database schema
# - best_week_templates table
# - activities table (optional for MVP, can hardcode categories)
# - weekly_adherence table

# 2. Build API layer
# - POST /api/best-week/templates (create/update template)
# - GET /api/best-week/templates (get user's templates)
# - GET /api/best-week/current (get active template for today)

# 3. Create TypeScript types
# - BestWeekTemplate interface
# - TimeBlock interface
# - ActivityCategory enum
```

### Step 2: Builder UI (Core Feature)

```bash
# Create: /pages/planning/best-week.tsx

# Components needed:
# - TemplateSelector (Weekday/Weekend tabs)
# - TimeBlockList (visual timeline)
# - TimeBlockForm (add/edit blocks)
# - CategoryBadge (visual category indicator)
# - HourSummary (total hours per category)

# For MVP, can use simple approach:
# - List of time blocks (not drag-drop)
# - Form to add new block (start time, end time, category, title)
# - Edit/delete existing blocks
# - Auto-calculate hours per category
# - Save button
```

### Step 3: Daily Reference (Integration)

```bash
# Modify: /pages/daily-sync.tsx (or wherever Daily Sync lives)

# Add collapsible section:
# <BestWeekReference>
#   - Fetch today's template (weekday or weekend)
#   - Filter blocks for current day
#   - Highlight current time block
#   - Show next block
#   - Display quick stats (hours by category today)
# </BestWeekReference>

# Place it:
# - Below session stats (existing)
# - Above or below Quest Stats
# - Make it collapsible to save space
```

### Step 4: Adherence Tracking (Basic)

```bash
# When user logs a session:
# 1. Determine category based on Quest type
# 2. Update weekly adherence counter
# 3. Calculate % of target hours per category

# Weekly stats view (simple table):
# Category          | Planned | Actual | %
# ──────────────────┼─────────┼────────┼────
# High Lifetime     | 20h     | 15h    | 75%
# High Rupiah       | 30h     | 32h    | 107%
# Low Rupiah        | 10h     | 8h     | 80%
# Zero Rupiah       | <2h     | 3h     | ⚠️
```

## Example Code Snippets

### Time Block Component (Simple)

```tsx
interface TimeBlockProps {
  block: TimeBlock;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}

function TimeBlock({ block, onEdit, onDelete }: TimeBlockProps) {
  const categoryColors = {
    high_lifetime_value: 'bg-green-100 border-green-500',
    high_rupiah_value: 'bg-blue-100 border-blue-500',
    low_rupiah_value: 'bg-amber-100 border-amber-500',
    zero_rupiah_value: 'bg-red-100 border-red-500'
  };

  const duration = calculateDuration(block.startTime, block.endTime);

  return (
    <div className={`border-l-4 p-4 mb-2 ${categoryColors[block.category]}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-600">
            {block.startTime} - {block.endTime} ({duration}m)
          </div>
          <div className="font-medium">{block.title}</div>
          {block.description && (
            <div className="text-sm text-gray-500">{block.description}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(block)}>Edit</button>
          <button onClick={() => onDelete(block.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
```

### Category Hour Calculation

```typescript
function calculateCategoryHours(blocks: TimeBlock[]): Record<string, number> {
  const hours = {
    high_lifetime_value: 0,
    high_rupiah_value: 0,
    low_rupiah_value: 0,
    zero_rupiah_value: 0
  };

  blocks.forEach(block => {
    const duration = calculateDuration(block.startTime, block.endTime);
    hours[block.category] += duration / 60; // convert to hours
  });

  return hours;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}
```

## Questions to Answer Before Starting

Please clarify these so I can give better guidance:

1. **Database:** What database are you using? (PostgreSQL, Supabase, Firebase, etc.)
2. **API Layer:** Next.js API routes? tRPC? Express backend?
3. **Existing Components:** Do you have a component library? shadcn/ui? Custom?
4. **Drag-and-Drop:** Is drag-and-drop required for MVP, or can we start with simple forms?
5. **Authentication:** How are users authenticated? Need to scope templates by userId?
6. **File Structure:** What's your current project structure? Where should I create new files?

## Success Criteria

MVP is successful when user can:

✅ Create a Best Week template (weekday + weekend)
✅ Add time blocks with start/end time and category
✅ See total hours per category (validation that it's realistic)
✅ Save template
✅ View their Best Week reference in Daily Sync page
✅ See which block they should be in right now
✅ Track weekly adherence (at least basic - planned vs actual hours)

## What NOT to Build (Out of Scope)

❌ Drag-and-drop interface (nice-to-have, not MVP)
❌ AI suggestions for categorization
❌ Calendar integration
❌ Template sharing/marketplace
❌ Mobile app (focus on responsive web)
❌ Advanced charts (simple tables OK for MVP)

## Deliverables

Please provide:

1. **Database schema** (SQL or schema definition)
2. **API endpoints** (implementation or spec)
3. **React components** for:
   - Best Week Builder page
   - Daily Reference widget
   - Basic stats view
4. **Integration code** for Daily Sync page
5. **Sample data** or seed script for testing
6. **Brief usage guide** - how to use the feature

## Additional Notes

- **Refer to examples:** See `BEST_WEEK_EXAMPLES.md` for template structure
- **Color consistency:** Use the color scheme defined in implementation doc
- **Existing patterns:** Try to match existing UI patterns in the app
- **Mobile responsive:** Ensure works on mobile (collapsible sections helpful)
- **Performance:** Keep it fast - Best Week reference should load <500ms

## Example User Flow (MVP)

1. User goes to `/planning/best-week` (first time)
2. Sees empty template builder
3. Clicks "Add Time Block"
4. Fills form:
   - Start: 08:00
   - End: 10:00
   - Category: High Rupiah Value (💰)
   - Title: "Deep Work Block"
5. Block appears in timeline with blue color
6. Repeats for more blocks
7. Sees summary: "High Rupiah: 8h, High Lifetime: 4h, Low Rupiah: 2h"
8. Clicks "Save Template"
9. Goes to Daily Sync page
10. Sees "Best Week Reference" section showing today's blocks
11. Current time block is highlighted
12. Works through the day
13. At week end, checks adherence: "78% adherence this week"

---

## Let's Start!

**Your first task:** 

Create the database schema and data models for Best Week feature, following the specs in `BEST_WEEK_IMPLEMENTATION.md`. Then show me the schema so I can review before we proceed to building the UI.

**Context you'll need from me:**
- Database type: [I'LL PROVIDE]
- Current schema/tables: [I'LL PROVIDE]
- Authentication setup: [I'LL PROVIDE]

Once schema is approved, we'll build the Best Week Builder UI step-by-step.

Ready when you are! 🚀
