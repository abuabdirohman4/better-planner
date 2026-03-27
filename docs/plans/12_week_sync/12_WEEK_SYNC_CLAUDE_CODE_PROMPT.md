# PROMPT FOR CLAUDE CODE: Implement 12 Week Sync Feature

## Context

I'm building **Better Planner** - a comprehensive productivity app that integrates:
- ✅ **High Focus Goals** - 3 quarterly goals (12-week cycles)
- ✅ **Weekly Sync** - Weekly planning & review
- ✅ **Daily Sync** - Session tracking & task management
- ✅ **Daily Quest** - Foundation tasks & recurring to-dos
- ✅ **Best Week** - Time-blocking & activity categorization
- ✅ **Habit Tracker** - Monthly consistency tracking

Now I need the **missing piece**: **12 Week Sync** - a quarterly reflection and planning interface that closes each 12-week cycle and opens the next one with insights and learnings applied.

## Reference Documents

**READ THESE FIRST:**
1. `12_WEEK_SYNC_CONCEPT.md` - Philosophy, psychology, reflection-action loop
2. `12_WEEK_SYNC_IMPLEMENTATION.md` - Technical spec, data models, UI components
3. `12_WEEK_SYNC_EXAMPLES.md` - My actual Q1 2026 review + templates

## My Actual 12 Week Sync (Q1 2026)

From my actual quarterly review (screenshot provided):

**High Focus Goal Review:**
1. Menyelesaikan AutoWealth Web V3.1 & V3.2 - **Score: 10/10** ⭐⭐⭐⭐⭐
2. [Empty]
3. [Empty]

**Daftar Pencapaian (5 items):**
1. Fixing AutoWealth Web
2. Money DPP LDII
3. Wedding 💒
4. AW : SRS Form
5. AW : v3.2 Custody Account

**Reflection Answers:**
- **Challenges:** "Untuk AW tidak, selain itu goal nya tidak jelas"
- **Advice:** "Pelan-pelan saja kembalikan habit menggunakan SP nya, ingat, be nice to yourself"
- **Reward:** "Menikmati hidup & berhubungan dengan istri"
- **Goals Needing Commitment:** "Kerjaan di AW & Web Portfolio"
- **Goals to Revise:** "Tidak ada"

**Sync Actions Completed:**
- ☑ Dapatkan Sync Planner yang baru
- ☑ Pindahkan goal, update Highest First Anda
- ☑ Review Best Week, Ritual dan revisi sesuai kebutuhan
- ☑ Simpan planner ini untuk review dan konsultasikan

## Tech Stack

```
Frontend: [SPECIFY - e.g., Next.js + React + TypeScript]
Styling: [SPECIFY - e.g., Tailwind CSS + shadcn/ui]
State: [SPECIFY - e.g., React Query + Context]
Database: [SPECIFY - e.g., Supabase, PostgreSQL]
Backend: [SPECIFY - e.g., Next.js API routes]
```

## What I Need You to Build

### PHASE 1 (MVP - Priority: HIGHEST) 🎯

Build the **core 12 Week Sync system**:

1. **Data Layer**
   - QuarterlyReview table (quarter ID, user, dates, reflection data)
   - GoalReview table (link to High Focus Goals with 1-10 scores)
   - Accomplishments table (5-10 items per quarter)
   - SyncActions table (checklist items)
   - API endpoints for CRUD operations

2. **12 Week Sync Form** (`/review/12-week-sync`)
   - Header with quarter identifier (e.g., "Q1 2026")
   - Date range display
   - High Focus Goal review section:
     - Pull active goals for current quarter
     - Rating buttons 1-10 for each goal
     - Visual feedback (stars) for selected score
     - Optional notes field
   - Accomplishments list:
     - Add/remove items (5-10 recommended)
     - Drag-to-reorder (optional)
     - Quick add with Enter key
   - Reflection questions (text areas):
     - Kesulitan yang dihadapi
     - Nasihat untuk 12 minggu depan
     - Reward untuk diri saya
     - Goal needing commitment
     - Goal needing revision
   - Sync Actions checklist:
     - Standard actions (archive, set new goals, etc.)
     - Mark complete/incomplete
   - Save draft + Complete review buttons

3. **Historical Quarters View** (`/review/history`)
   - List all completed quarters
   - Group by year
   - Show quarter score average
   - Click to view details
   - Filter/search functionality

4. **Basic Integration**
   - Pull High Focus Goals for current quarter
   - Link goal reviews to actual goals
   - Calculate average score across goals
   - Mark quarter as "completed" when review done

### PHASE 2 (Nice-to-have - Priority: MEDIUM)

If time permits after Phase 1:

5. **Auto-Generated Insights**
   - Calculate metrics from integrated data:
     - Average goal score
     - Habit Tracker consistency (3 months)
     - Best Week adherence
     - Weekly Sync completion rate
   - Detect patterns:
     - "Strong start, weak finish"
     - "Mid-quarter dip"
     - "Weekend consistency weak"
   - Compare to previous quarter
   - Generate recommendations

6. **Insights Dashboard** (`/review/insights`)
   - Visual metric cards
   - Trend charts (line/bar)
   - Strengths & weaknesses
   - Recommendations for next quarter

7. **Import Historical Data**
   - CSV/Excel upload interface
   - Parse and validate data
   - Create QuarterlyReview records
   - Bulk import past quarters

### PHASE 3 (Future - Priority: LOW)

Not needed now, document for later:

8. Export to PDF
9. Share with accountability partner
10. AI-powered insights (pattern recognition at scale)

---

## Key Design Requirements

### 1. Quarter Identification

**Automatic quarter detection:**
```typescript
// Current date determines current quarter
function getCurrentQuarter(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

// Quarter date range
function getQuarterDateRange(quarterIdentifier: string) {
  const [year, q] = quarterIdentifier.split('-Q');
  const startMonth = (parseInt(q) - 1) * 3;
  const start = new Date(parseInt(year), startMonth, 1);
  const end = new Date(parseInt(year), startMonth + 3, 0);
  return { start, end };
}

// Examples:
// "2026-Q1" = Jan 1 - Mar 31, 2026
// "2026-Q2" = Apr 1 - Jun 30, 2026
// "2026-Q3" = Jul 1 - Sep 30, 2026
// "2026-Q4" = Oct 1 - Dec 31, 2026
```

### 2. Goal Review UI (Critical!)

**Score selector:**
```
Goal: Menyelesaikan AutoWealth Web V3.1 & V3.2

Progress Score:
[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]  ← Clickable buttons

Selected: 10 ⭐⭐⭐⭐⭐
Status: ✅ Fully Achieved

[Add Notes] ▼
┌─────────────────────────────────────────────┐
│ Completed ahead of schedule! Launched...   │
│                                             │
└─────────────────────────────────────────────┘
```

**Requirements:**
- Buttons 1-10 for each goal
- Selected button highlighted
- Show star rating based on score
- Optional notes section (expandable)
- Auto-save on change

### 3. Reflection Questions

**Standard format:**
```
Kesulitan apa yang saya hadapi dalam proses 12 Minggu ini?
┌─────────────────────────────────────────────────────────┐
│                                                          │
│ [User types answer here]                                │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘

Character count: 0/2000  [Expand]
```

**Questions to include:**
1. Kesulitan apa yang saya hadapi dalam proses 12 Minggu ini?
2. Nasihat dari saya untuk 12 Minggu ke depan
3. Reward Untuk Diri Saya
4. Goal mana yang memerlukan komitmen Anda kembali?
5. Goal mana yang perlu Anda revisi?

### 4. Accomplishments List

**UI Pattern:**
```
🎯 Daftar Pencapaian 12 Minggu

1. Fixing AutoWealth Web                    [✕]
2. Money DPP LDII                            [✕]
3. Wedding 💒                                [✕]
4. AW : SRS Form                             [✕]
5. AW : v3.2 Custody Account                [✕]

[+ Add accomplishment...]

Tip: Aim for 5-10 items. Include both goal-related and personal wins!
```

**Requirements:**
- Numbered list (auto-increments)
- Remove button per item
- Quick add with Enter key
- Emoji support
- Reorder (drag-drop optional)

### 5. Sync Actions Checklist

**Standard actions:**
```
✅ SYNC ACTION TO-DO

☑ Review and rate each High Focus Goal
☐ List 5-10 accomplishments
☑ Answer reflection questions honestly
☐ Set reward and schedule it
☐ Archive completed quarter
☐ Set 3 new High Focus Goals for next quarter
☐ Update Best Week template based on learnings
☑ Review Habit Tracker patterns

[0/8 completed]
```

**Requirements:**
- Checkbox per action
- Toggle on/off
- Count completed/total
- Save state automatically

---

## Data Model (Key Tables)

### quarterly_reviews

```sql
CREATE TABLE quarterly_reviews (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  quarter_identifier VARCHAR(10) NOT NULL,  -- "2026-Q1"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Reflection answers
  challenges_faced TEXT,
  advice_for_next TEXT,
  reward TEXT,
  goals_needing_commitment TEXT,
  goals_needing_revision TEXT,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, quarter_identifier)
);
```

### goal_reviews

```sql
CREATE TABLE goal_reviews (
  id UUID PRIMARY KEY,
  quarterly_review_id UUID REFERENCES quarterly_reviews(id),
  high_focus_goal_id UUID REFERENCES high_focus_goals(id),
  goal_name VARCHAR(255),
  progress_score INTEGER CHECK (progress_score >= 1 AND progress_score <= 10),
  achievement_notes TEXT,
  
  created_at TIMESTAMP
);
```

### accomplishments

```sql
CREATE TABLE accomplishments (
  id UUID PRIMARY KEY,
  quarterly_review_id UUID REFERENCES quarterly_reviews(id),
  description TEXT NOT NULL,
  sort_order INTEGER,
  
  created_at TIMESTAMP
);
```

### sync_actions

```sql
CREATE TABLE sync_actions (
  id UUID PRIMARY KEY,
  quarterly_review_id UUID REFERENCES quarterly_reviews(id),
  action VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  sort_order INTEGER
);
```

---

## Example Code Structure

### API Endpoint Example

```typescript
// GET /api/quarterly-reviews/current
export async function getCurrentQuarterlyReview(userId: string) {
  const currentQuarter = getCurrentQuarter();
  
  // Check if review exists
  let review = await db.quarterlyReviews.findOne({
    userId,
    quarterIdentifier: currentQuarter
  });
  
  // If not, create draft
  if (!review) {
    const { start, end } = getQuarterDateRange(currentQuarter);
    review = await db.quarterlyReviews.create({
      userId,
      quarterIdentifier: currentQuarter,
      startDate: start,
      endDate: end,
      isCompleted: false
    });
    
    // Pre-populate with High Focus Goals for this quarter
    const goals = await getHighFocusGoalsForQuarter(userId, currentQuarter);
    for (const goal of goals) {
      await db.goalReviews.create({
        quarterlyReviewId: review.id,
        highFocusGoalId: goal.id,
        goalName: goal.name,
        progressScore: null
      });
    }
  }
  
  return review;
}
```

### Component Example

```tsx
function QuarterlyReviewForm() {
  const { data: review, isLoading } = useCurrentQuarterlyReview();
  const updateReview = useUpdateQuarterlyReview();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="quarterly-review-form">
      <header>
        <h1>12 Week Sync - {review.quarterIdentifier}</h1>
        <p className="date-range">
          {formatDate(review.startDate)} - {formatDate(review.endDate)}
        </p>
      </header>
      
      <section className="goal-reviews">
        <h2>✅ Review High Focus Goal</h2>
        {review.goalReviews.map(goalReview => (
          <GoalReviewCard
            key={goalReview.id}
            goalReview={goalReview}
            onUpdate={(data) => updateGoalReview(goalReview.id, data)}
          />
        ))}
      </section>
      
      <section className="accomplishments">
        <h2>🎯 Daftar Pencapaian 12 Minggu</h2>
        <AccomplishmentsList
          accomplishments={review.accomplishments}
          onAdd={(desc) => addAccomplishment(review.id, desc)}
          onRemove={(id) => removeAccomplishment(id)}
        />
      </section>
      
      <section className="reflection">
        <h2>💭 Reflection Questions</h2>
        <ReflectionQuestion
          question="Kesulitan apa yang saya hadapi dalam proses 12 Minggu ini?"
          value={review.challengesFaced}
          onChange={(val) => updateReview({ challengesFaced: val })}
        />
        {/* ... more questions */}
      </section>
      
      <section className="sync-actions">
        <h2>✅ Sync Action To-Do</h2>
        <SyncActionChecklist
          actions={review.syncActions}
          onToggle={(id) => toggleSyncAction(id)}
        />
      </section>
      
      <footer>
        <Button onClick={saveDraft}>Save Draft</Button>
        <Button onClick={completeReview} variant="primary">
          Complete Review
        </Button>
      </footer>
    </div>
  );
}
```

---

## Integration Requirements

### With High Focus Goals

```typescript
// When user sets High Focus Goals for quarter
async function setHighFocusGoalsForQuarter(
  userId: string,
  quarterIdentifier: string,
  goals: HighFocusGoal[]
) {
  // Save goals with quarter identifier
  for (const goal of goals) {
    await db.highFocusGoals.create({
      ...goal,
      userId,
      quarterIdentifier
    });
  }
  
  // Create draft quarterly review if doesn't exist
  const review = await getOrCreateQuarterlyReview(userId, quarterIdentifier);
  
  // Link goals to review
  for (const goal of goals) {
    await db.goalReviews.create({
      quarterlyReviewId: review.id,
      highFocusGoalId: goal.id,
      goalName: goal.name
    });
  }
}
```

### With Habit Tracker (For Insights)

```typescript
// Pull 3-month habit data for insights
async function calculateHabitConsistency(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const habitStats = await getHabitStatsForPeriod(userId, startDate, endDate);
  
  // Average across all months in quarter
  const monthlyAverages = habitStats.map(month => month.overallPercentage);
  const quarterlyAverage = monthlyAverages.reduce((a,b) => a+b) / monthlyAverages.length;
  
  return quarterlyAverage;
}
```

### With Best Week (For Insights)

```typescript
// Pull Best Week adherence for quarter
async function calculateBestWeekAdherence(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const weeklyAdherence = await getBestWeekAdherenceForPeriod(userId, startDate, endDate);
  
  // Average across all weeks
  const average = weeklyAdherence.reduce((a,b) => a+b) / weeklyAdherence.length;
  
  return average;
}
```

---

## UI/UX Guidelines

### Color Scheme

```typescript
const COLORS = {
  // Score indicators
  excellent: '#10B981',    // Green (9-10)
  good: '#3B82F6',         // Blue (7-8)
  moderate: '#F59E0B',     // Amber (5-6)
  needs_work: '#EF4444',   // Red (1-4)
  
  // UI elements
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral: '#6B7280',
};
```

### Score Button States

```css
.score-button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #E5E7EB;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.score-button:hover {
  border-color: #3B82F6;
  transform: scale(1.1);
}

.score-button.selected {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
  font-weight: bold;
}

.score-button.excellent.selected {
  background: #10B981;
  border-color: #10B981;
}
```

### Responsive Design

```css
/* Mobile */
@media (max-width: 768px) {
  .quarterly-review-form {
    /* Stack sections vertically */
    /* Large touch targets */
    /* Simplified layout */
  }
  
  .score-buttons {
    /* Wrap if needed */
    gap: 8px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .quarterly-review-form {
    max-width: 900px;
    margin: 0 auto;
  }
}
```

---

## Success Criteria

MVP is successful when I can:

✅ Access 12 Week Sync page at end of quarter  
✅ See my 3 High Focus Goals pre-loaded  
✅ Rate each goal 1-10 with visual feedback  
✅ Add 5-10 accomplishments easily  
✅ Answer all reflection questions in text areas  
✅ Check off sync actions  
✅ Save draft (auto-save on changes)  
✅ Mark review as "Complete"  
✅ View list of all past quarters  
✅ Click to view details of any completed quarter  
✅ Calculate average goal score automatically  

---

## What NOT to Build (Out of Scope for MVP)

❌ AI-powered insights (save for Phase 2)  
❌ Export to PDF (nice-to-have)  
❌ Advanced charting (simple stats OK)  
❌ Social sharing  
❌ Reminders/notifications  
❌ Mobile app (responsive web is fine)  

---

## Deliverables

Please provide:

1. **Database schema** (SQL or Prisma)
2. **API endpoints** (implementation or spec)
3. **UI Components:**
   - QuarterlyReviewForm
   - GoalReviewCard (with 1-10 buttons)
   - AccomplishmentsList
   - ReflectionQuestions
   - SyncActionChecklist
   - QuarterlyHistory
4. **Core logic:**
   - Quarter identifier calculation
   - Auto-populate from High Focus Goals
   - Average score calculation
5. **Integration code:**
   - Link to existing High Focus Goals
   - Pull data for insights (if Phase 2)
6. **Sample data / seed script** with my Q1 2026 actual data
7. **Brief usage guide**

---

## Questions to Answer Before Starting

**Please clarify:**

1. **Database:** What are you using? (PostgreSQL, Supabase, Firebase?)
2. **High Focus Goals:** Do they already have `quarterIdentifier` field?
3. **API:** Next.js routes? tRPC? REST?
4. **State:** React Query? SWR? Redux?
5. **Component Library:** shadcn/ui? Material-UI? Custom?
6. **File Structure:** Where to create new files?

---

## Implementation Approach

### Step 1: Data Foundation (Start Here!)

```bash
# 1. Create database schema
# - quarterly_reviews table
# - goal_reviews table
# - accomplishments table
# - sync_actions table

# 2. Build API layer
# - CRUD for quarterly reviews
# - Get current quarter
# - Get historical quarters
# - Link to High Focus Goals

# 3. Seed with my Q1 2026 data
# - Use actual data from screenshot
```

### Step 2: Review Form UI

```bash
# Create: /pages/review/12-week-sync.tsx

# Components:
# - Header (quarter ID, dates)
# - GoalReviewCard (1-10 buttons, notes)
# - AccomplishmentsList (add/remove)
# - ReflectionQuestions (text areas)
# - SyncActionChecklist
# - Save/Complete buttons
```

### Step 3: Historical View

```bash
# Create: /pages/review/history.tsx

# Features:
# - List all completed quarters
# - Group by year
# - Click to view details
# - Show average score per quarter
```

### Step 4: Integration & Insights (Optional)

```bash
# If Phase 2:
# - Pull Habit Tracker data
# - Pull Best Week data
# - Calculate insights
# - Display insights dashboard
```

---

## Example User Flow (MVP)

1. I complete Week 12 of my quarter
2. System detects quarter is ending
3. I navigate to `/review/12-week-sync`
4. Page shows "Q1 2026 - 12 Week Sync"
5. My 3 High Focus Goals are pre-loaded
6. I click score buttons to rate each (Goal 1 = 10)
7. I add my 5 accomplishments
8. I answer reflection questions in text areas
9. I check off sync actions as I complete them
10. Changes auto-save as I work
11. I click "Complete Review"
12. Review is marked complete
13. System archives Q1 2026
14. I can view it later in `/review/history`
15. System prompts to set Q2 2026 goals

---

## Additional Context

**Why this feature matters:**

Currently I do quarterly reviews in physical Sync Planner book. But:
- ❌ Data not integrated with digital system
- ❌ No historical tracking (books get full, thrown away)
- ❌ Can't see trends over time
- ❌ No automatic insights from integrated data
- ❌ Hard to search past reflections

With this in Better Planner:
- ✅ All quarters in one place
- ✅ Integrated with goals, habits, Best Week
- ✅ Historical journey visible
- ✅ Insights from patterns
- ✅ Searchable reflections
- ✅ AI can learn from my journey over time

**I also have historical data:**
- Past quarterly reviews in Excel/spreadsheet
- Chat history in "SP : Visi & 12 Week Sync"
- Want to import all of this to build complete journey

**Import feature (Phase 2) enables:**
- Migrate all historical reviews
- Build complete multi-year dataset
- AI learning from full journey
- See long-term growth trajectory

---

## Let's Start!

**Your first task:**

Create the database schema for 12 Week Sync following the spec in `12_WEEK_SYNC_IMPLEMENTATION.md`. Show me the schema so I can review before we proceed.

**Context you'll need from me:**
- Database type: [I'LL PROVIDE]
- Current High Focus Goals schema: [I'LL PROVIDE]
- My Q1 2026 actual data: (See 12_WEEK_SYNC_EXAMPLES.md)

Once schema is approved, we'll build the Review Form step-by-step.

Ready when you are! Let's close the quarterly loop! 🚀📊
