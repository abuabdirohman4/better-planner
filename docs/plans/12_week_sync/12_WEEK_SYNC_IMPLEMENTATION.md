# 12 WEEK SYNC - Technical Implementation Specification

## Feature Overview

Implement **12 Week Sync** - a quarterly reflection and planning interface that closes each 12-week cycle and prepares for the next, integrating data from High Focus Goals, Weekly Syncs, Habit Tracker, and Best Week.

**Read First:** See `12_WEEK_SYNC_CONCEPT.md` for full conceptual framework.

---

## Data Model

### QuarterlyReview

```typescript
interface QuarterlyReview {
  id: string;
  userId: string;
  
  // Time period
  quarterIdentifier: string;  // "2026-Q1" format
  startDate: Date;            // First day of 12 weeks
  endDate: Date;              // Last day of 12 weeks
  completedAt?: Date;         // When review was done
  
  // High Focus Goal Reviews
  goalReviews: GoalReview[];
  
  // Accomplishments
  accomplishments: string[];  // 5-10 items
  
  // Reflection questions
  challengesFaced: string;
  adviceForNext: string;
  goalDifficulties: string;
  goalsNeedingCommitment: string;
  goalsNeedingRevision: string;
  reward: string;
  
  // Metadata
  syncActionsCompleted: SyncAction[];
  isArchived: boolean;
  
  // Auto-generated insights (optional)
  insights?: QuarterlyInsights;
  
  createdAt: Date;
  updatedAt: Date;
}

interface GoalReview {
  highFocusGoalId: string;
  goalName: string;
  progressScore: number;      // 1-10 rating
  achievementNotes?: string;  // Optional elaboration
  completionPercentage?: number; // Calculated or manual
}

interface SyncAction {
  action: string;
  completed: boolean;
  completedAt?: Date;
}

interface QuarterlyInsights {
  // Auto-generated from data
  averageGoalScore: number;
  totalAccomplishments: number;
  habitConsistency: number;     // From Habit Tracker
  bestWeekAdherence: number;    // From Best Week
  weeklyGoalCompletion: number; // From Weekly Syncs
  
  // Pattern detection
  patterns: string[];           // e.g., "Strong start, weak finish"
  strengths: string[];
  areasForImprovement: string[];
  
  // Comparison
  previousQuarterComparison?: {
    goalScoreDelta: number;
    accomplishmentsDelta: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}
```

### HighFocusGoal (Update existing)

```typescript
interface HighFocusGoal {
  // ... existing fields
  
  // Add quarterly tracking
  quarterIdentifier: string;  // "2026-Q1"
  milestones: Milestone[];
  progressUpdates: ProgressUpdate[];
  
  // Final status (from 12 Week Sync)
  finalScore?: number;        // 1-10 from review
  finalStatus?: 'achieved' | 'partially_achieved' | 'not_achieved' | 'ongoing';
  carryoverToNext?: boolean;  // Continue in next quarter?
}

interface Milestone {
  id: string;
  title: string;
  targetWeek: number;         // Week 4, 8, 12
  completed: boolean;
  completedAt?: Date;
}

interface ProgressUpdate {
  week: number;
  percentComplete: number;
  note?: string;
  createdAt: Date;
}
```

---

## UI Components

### 1. 12 Week Sync Page (Main Interface)

**Route:** `/review/12-week-sync`

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 12 Week Sync - Q1 2026                    [Save] [Export]│
│ Jan 1 - Mar 31, 2026                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✅ Review High Focus Goal                                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ HIGH FOCUS GOALS REVIEW                                  ││
│ ├──────────────────────────────────────────────────────────┤│
│ │                                                           ││
│ │ Goal 1: Menyelesaikan AutoWealth Web V3.1 & V3.2        ││
│ │ Progress: [1][2][3][4][5][6][7][8][9][10] ← Select      ││
│ │ Selected: 10 ⭐⭐⭐⭐⭐                                     ││
│ │ Status: ✅ Achieved                                      ││
│ │                                                           ││
│ │ [Add Note] ▼                                             ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Completed ahead of schedule! V3.2 launched with... │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Goal 2: [Empty or other goal]                           ││
│ │ Progress: [1][2][3][4][5][6][7][8][9][10]              ││
│ │                                                           ││
│ │ Goal 3: [Empty or other goal]                           ││
│ │ Progress: [1][2][3][4][5][6][7][8][9][10]              ││
│ │                                                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🎯 DAFTAR PENCAPAIAN 12 MINGGU                           ││
│ ├──────────────────────────────────────────────────────────┤│
│ │                                                           ││
│ │ 1. Fixing AutoWealth Web                                 ││
│ │ 2. Money DPP LDII                                        ││
│ │ 3. Wedding 💒                                            ││
│ │ 4. AW : SRS Form                                         ││
│ │ 5. AW : v3.2 Custody Account                            ││
│ │ 6. [+ Add accomplishment]                                ││
│ │ ...                                                       ││
│ │ [+ Add more]                                             ││
│ │                                                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 💭 REFLECTION QUESTIONS                                  ││
│ ├──────────────────────────────────────────────────────────┤│
│ │                                                           ││
│ │ Kesulitan apa yang saya hadapi dalam proses 12 Minggu?  ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Untuk AW tidak, selain itu goal nya tidak jelas    │ ││
│ │ │                                                      │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Nasihat dari saya untuk 12 Minggu ke depan              ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Pelan-pelan saja kembalikan habit menggunakan SP   │ ││
│ │ │ nya, ingat, be nice to yourself                     │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Reward Untuk Diri Saya                                   ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Menikmati hidup & berhubungan dengan istri          │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Goal mana yang memerlukan komitmen Anda kembali?        ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Kerjaan di AW & Web Portfolio                       │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Goal mana yang perlu Anda revisi?                        ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Tidak ada                                            │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ✅ SYNC ACTION TO-DO                                     ││
│ ├──────────────────────────────────────────────────────────┤│
│ │                                                           ││
│ │ ☑ Archive completed quarter                             ││
│ │ ☑ Review & update Highest First Process                 ││
│ │ ☐ Set 3 new High Focus Goals for Q2                     ││
│ │ ☑ Update Best Week template based on learnings          ││
│ │ ☐ Review habit tracker patterns                          ││
│ │ ☐ Schedule Q2 accountability check-in                    ││
│ │ ☐ Celebrate wins! 🎉                                     ││
│ │                                                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [Save Draft]  [Complete Review →]  [View Insights]          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Quarterly Insights Dashboard

**Auto-generated analytics from quarter data:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Q1 2026 Insights & Analytics                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Overall Quarter Performance: 8.3/10 ⭐⭐⭐⭐               │
│ ████████████████████░░░░░░░░░░                              │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Goal Score   │ │ Habits       │ │ Best Week    │        │
│ │ 8.3 / 10     │ │ 72% avg      │ │ 75% adhere   │        │
│ │ ▲ +1.5 vs Q4 │ │ ▲ +4% vs Q4  │ │ ▼ -3% vs Q4  │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│ 📈 Trends                                                    │
│ • Strong start (Week 1-4: 90% goal progress)               │
│ • Mid-quarter dip (Week 5-8: 65%)                          │
│ • Strong finish (Week 9-12: 85%)                           │
│                                                              │
│ 💪 Strengths                                                 │
│ • High focus on main goal (AW project)                     │
│ • Consistent spiritual habits (85%)                         │
│ • Strong accountability (weekly reviews)                    │
│                                                              │
│ ⚠️ Areas for Improvement                                    │
│ • Weekend consistency (55% vs 80% weekday)                 │
│ • Goal clarity (only 1 clear goal out of 3)                │
│ • Mid-quarter energy management                             │
│                                                              │
│ 📊 Comparison to Previous Quarter                           │
│ [Line chart showing trend over last 4 quarters]            │
│                                                              │
│ 🎯 Recommendations for Q2                                   │
│ • Continue strong main goal focus                           │
│ • Add clearer goals #2 and #3 using SMART framework        │
│ • Plan mid-quarter energy boost (Week 6)                   │
│ • Improve weekend template in Best Week                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Historical Quarters View

**See all past quarters:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Quarterly Reviews History                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 2026                                                         │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Q1 2026 (Jan-Mar)                          Score: 8.3/10 ││
│ │ • Menyelesaikan AutoWealth Web             [View →]      ││
│ │ • 5 accomplishments • Completed Mar 31                   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ 2025                                                         │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Q4 2025 (Oct-Dec)                          Score: 6.8/10 ││
│ │ • Year-end goals                           [View →]      ││
│ │ • 7 accomplishments • Completed Dec 31                   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Q3 2025 (Jul-Sep)                          Score: 7.5/10 ││
│ │ • Business expansion                       [View →]      ││
│ │ • 6 accomplishments • Completed Sep 30                   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [Load More]                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Data Import Interface

**Import from Excel/past planning:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📥 Import Historical Reviews                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Import your past 12 Week Sync data to build your journey    │
│                                                              │
│ Format: Excel (.xlsx) or CSV                                │
│                                                              │
│ [Upload File] or [Paste Text]                               │
│                                                              │
│ Template columns:                                            │
│ - Quarter (e.g., "2025-Q4")                                 │
│ - Goal 1, Goal 1 Score                                      │
│ - Goal 2, Goal 2 Score                                      │
│ - Goal 3, Goal 3 Score                                      │
│ - Accomplishments (comma-separated)                         │
│ - Challenges Faced                                           │
│ - Advice for Next                                            │
│ - Reward                                                     │
│                                                              │
│ [Download Template] [Import]                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## User Stories & Acceptance Criteria

### US1: Complete 12 Week Sync

**As a user, I want to complete my quarterly review so I can learn and plan better.**

**Acceptance Criteria:**
- [ ] Can access 12 Week Sync page at end of quarter
- [ ] Can rate each High Focus Goal 1-10
- [ ] Can add 5-10 accomplishments
- [ ] Can answer all reflection questions
- [ ] Can mark sync actions complete
- [ ] Data saves automatically (draft mode)
- [ ] Can mark review as "Complete"
- [ ] Can export as PDF

### US2: View Auto-Generated Insights

**As a user, I want to see insights from my quarter data so I understand patterns.**

**Acceptance Criteria:**
- [ ] System pulls data from High Focus Goals, Weekly Syncs, Habits, Best Week
- [ ] Calculates average goal score
- [ ] Shows habit consistency %
- [ ] Shows Best Week adherence %
- [ ] Identifies trends (strong start, weak finish, etc.)
- [ ] Compares to previous quarter
- [ ] Suggests improvements for next quarter

### US3: Historical Quarterly Journey

**As a user, I want to see all my past quarters so I can track long-term growth.**

**Acceptance Criteria:**
- [ ] Can view list of all completed quarters
- [ ] Can click to view details of any quarter
- [ ] Can see trend line across quarters
- [ ] Can filter by year
- [ ] Can search within accomplishments/notes

### US4: Import Historical Data

**As a user, I want to import my past reviews so I have complete history.**

**Acceptance Criteria:**
- [ ] Can upload Excel/CSV file
- [ ] System parses and validates data
- [ ] Creates QuarterlyReview records
- [ ] Links to existing High Focus Goals if possible
- [ ] Shows import success summary
- [ ] Can undo import if needed

### US5: Prepare Next Quarter

**As a user, I want to transition smoothly to next quarter with learnings applied.**

**Acceptance Criteria:**
- [ ] Can click "Start Next Quarter" from 12 Week Sync
- [ ] System creates new quarter structure
- [ ] Carries over unfinished goals (if requested)
- [ ] Applies learnings to new High Focus Goals
- [ ] Updates Best Week based on feedback
- [ ] Archives completed quarter

---

## Technical Implementation Guide

### Phase 1: Data Layer (Week 1)

**Priority: HIGH**

1. **Database Schema**
   ```sql
   CREATE TABLE quarterly_reviews (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     quarter_identifier VARCHAR(10) NOT NULL, -- "2026-Q1"
     start_date DATE NOT NULL,
     end_date DATE NOT NULL,
     completed_at TIMESTAMP,
     
     -- Reflection data
     challenges_faced TEXT,
     advice_for_next TEXT,
     goal_difficulties TEXT,
     goals_needing_commitment TEXT,
     goals_needing_revision TEXT,
     reward TEXT,
     
     -- Metadata
     is_archived BOOLEAN DEFAULT false,
     
     created_at TIMESTAMP,
     updated_at TIMESTAMP,
     UNIQUE(user_id, quarter_identifier)
   );

   CREATE TABLE goal_reviews (
     id UUID PRIMARY KEY,
     quarterly_review_id UUID REFERENCES quarterly_reviews(id),
     high_focus_goal_id UUID REFERENCES high_focus_goals(id),
     goal_name VARCHAR(255),
     progress_score INTEGER CHECK (progress_score >= 1 AND progress_score <= 10),
     achievement_notes TEXT,
     completion_percentage INTEGER,
     created_at TIMESTAMP
   );

   CREATE TABLE accomplishments (
     id UUID PRIMARY KEY,
     quarterly_review_id UUID REFERENCES quarterly_reviews(id),
     description TEXT NOT NULL,
     sort_order INTEGER,
     created_at TIMESTAMP
   );

   CREATE TABLE sync_actions (
     id UUID PRIMARY KEY,
     quarterly_review_id UUID REFERENCES quarterly_reviews(id),
     action VARCHAR(255) NOT NULL,
     completed BOOLEAN DEFAULT false,
     completed_at TIMESTAMP,
     sort_order INTEGER
   );

   CREATE TABLE quarterly_insights (
     id UUID PRIMARY KEY,
     quarterly_review_id UUID REFERENCES quarterly_reviews(id),
     average_goal_score DECIMAL(3,1),
     total_accomplishments INTEGER,
     habit_consistency DECIMAL(5,2),
     best_week_adherence DECIMAL(5,2),
     weekly_goal_completion DECIMAL(5,2),
     patterns JSONB,
     strengths TEXT[],
     areas_for_improvement TEXT[],
     previous_quarter_comparison JSONB,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   ```

2. **API Endpoints**
   ```
   # Quarterly Reviews
   GET    /api/quarterly-reviews
   POST   /api/quarterly-reviews
   GET    /api/quarterly-reviews/:id
   PUT    /api/quarterly-reviews/:id
   DELETE /api/quarterly-reviews/:id
   
   # Current quarter
   GET    /api/quarterly-reviews/current
   POST   /api/quarterly-reviews/current/complete
   
   # Insights
   GET    /api/quarterly-reviews/:id/insights
   POST   /api/quarterly-reviews/:id/insights/generate
   
   # History
   GET    /api/quarterly-reviews/history
   
   # Import
   POST   /api/quarterly-reviews/import
   POST   /api/quarterly-reviews/import/validate
   
   # Export
   GET    /api/quarterly-reviews/:id/export/pdf
   GET    /api/quarterly-reviews/:id/export/csv
   ```

3. **Business Logic**
   ```typescript
   // Calculate quarter identifier from date
   function getQuarterIdentifier(date: Date): string {
     const year = date.getFullYear();
     const month = date.getMonth() + 1;
     const quarter = Math.ceil(month / 3);
     return `${year}-Q${quarter}`;
   }

   // Get quarter date range
   function getQuarterDateRange(quarterIdentifier: string): { start: Date, end: Date } {
     const [year, quarter] = quarterIdentifier.split('-Q');
     const startMonth = (parseInt(quarter) - 1) * 3;
     const start = new Date(parseInt(year), startMonth, 1);
     const end = new Date(parseInt(year), startMonth + 3, 0);
     return { start, end };
   }

   // Calculate insights
   async function generateQuarterlyInsights(
     quarterlyReviewId: string
   ): Promise<QuarterlyInsights> {
     const review = await getQuarterlyReview(quarterlyReviewId);
     const { start, end } = getQuarterDateRange(review.quarterIdentifier);
     
     // Fetch data from various sources
     const goalReviews = await getGoalReviews(quarterlyReviewId);
     const habitData = await getHabitDataForPeriod(review.userId, start, end);
     const bestWeekData = await getBestWeekDataForPeriod(review.userId, start, end);
     const weeklyData = await getWeeklySyncsForPeriod(review.userId, start, end);
     
     // Calculate metrics
     const averageGoalScore = goalReviews.reduce((sum, g) => sum + g.progressScore, 0) / goalReviews.length;
     const habitConsistency = habitData.overallPercentage;
     const bestWeekAdherence = bestWeekData.averageAdherence;
     const weeklyGoalCompletion = calculateWeeklyCompletion(weeklyData);
     
     // Detect patterns
     const patterns = detectPatterns(weeklyData, habitData);
     const strengths = identifyStrengths(goalReviews, habitData, bestWeekData);
     const areasForImprovement = identifyWeaknesses(goalReviews, habitData, bestWeekData);
     
     // Compare to previous quarter
     const previousQuarter = await getPreviousQuarter(review.userId, review.quarterIdentifier);
     const comparison = previousQuarter 
       ? compareQuarters(review, previousQuarter)
       : null;
     
     return {
       averageGoalScore,
       totalAccomplishments: review.accomplishments.length,
       habitConsistency,
       bestWeekAdherence,
       weeklyGoalCompletion,
       patterns,
       strengths,
       areasForImprovement,
       previousQuarterComparison: comparison
     };
   }

   // Pattern detection
   function detectPatterns(weeklyData: WeeklySync[], habitData: MonthlyStats[]): string[] {
     const patterns: string[] = [];
     
     // Check for start vs finish pattern
     const earlyWeeks = weeklyData.slice(0, 4);
     const lateWeeks = weeklyData.slice(8, 12);
     const earlyCompletion = earlyWeeks.reduce((sum, w) => sum + w.completionRate, 0) / earlyWeeks.length;
     const lateCompletion = lateWeeks.reduce((sum, w) => sum + w.completionRate, 0) / lateWeeks.length;
     
     if (earlyCompletion > lateCompletion + 20) {
       patterns.push("Strong start, declining toward end");
     } else if (lateCompletion > earlyCompletion + 20) {
       patterns.push("Slow start, strong finish");
     } else {
       patterns.push("Consistent performance throughout quarter");
     }
     
     // Check for mid-quarter dip
     const midWeeks = weeklyData.slice(4, 8);
     const midCompletion = midWeeks.reduce((sum, w) => sum + w.completionRate, 0) / midWeeks.length;
     if (midCompletion < earlyCompletion - 20 && midCompletion < lateCompletion - 20) {
       patterns.push("Mid-quarter energy dip detected");
     }
     
     // Add more pattern detection...
     
     return patterns;
   }
   ```

### Phase 2: 12 Week Sync UI (Week 2)

**Priority: HIGH**

1. **Main Review Form**
   ```tsx
   interface ReviewFormProps {
     quarterIdentifier: string;
     existingReview?: QuarterlyReview;
   }

   function QuarterlyReviewForm({ quarterIdentifier, existingReview }: ReviewFormProps) {
     const [review, setReview] = useState(existingReview || initializeReview());
     const highFocusGoals = useHighFocusGoals(quarterIdentifier);
     
     return (
       <div className="review-form">
         <header>
           <h1>12 Week Sync - {quarterIdentifier}</h1>
           <DateRange start={review.startDate} end={review.endDate} />
         </header>
         
         <section className="goal-reviews">
           <h2>✅ Review High Focus Goal</h2>
           {highFocusGoals.map(goal => (
             <GoalReviewCard
               key={goal.id}
               goal={goal}
               review={review.goalReviews.find(r => r.highFocusGoalId === goal.id)}
               onUpdate={(reviewData) => updateGoalReview(goal.id, reviewData)}
             />
           ))}
         </section>
         
         <section className="accomplishments">
           <h2>🎯 Daftar Pencapaian 12 Minggu</h2>
           <AccomplishmentsList
             accomplishments={review.accomplishments}
             onAdd={addAccomplishment}
             onRemove={removeAccomplishment}
             onReorder={reorderAccomplishments}
           />
         </section>
         
         <section className="reflection">
           <h2>💭 Reflection Questions</h2>
           <ReflectionQuestions
             questions={REFLECTION_QUESTIONS}
             answers={review}
             onChange={updateReflection}
           />
         </section>
         
         <section className="sync-actions">
           <h2>✅ Sync Action To-Do</h2>
           <SyncActionChecklist
             actions={review.syncActionsCompleted}
             onToggle={toggleSyncAction}
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

2. **Goal Review Card**
   ```tsx
   function GoalReviewCard({ goal, review, onUpdate }: GoalReviewCardProps) {
     const [score, setScore] = useState(review?.progressScore || 0);
     const [notes, setNotes] = useState(review?.achievementNotes || '');
     
     return (
       <div className="goal-review-card">
         <h3>{goal.name}</h3>
         
         <div className="score-selector">
           <label>Progress Score:</label>
           <div className="score-buttons">
             {[1,2,3,4,5,6,7,8,9,10].map(num => (
               <button
                 key={num}
                 className={score === num ? 'selected' : ''}
                 onClick={() => {
                   setScore(num);
                   onUpdate({ progressScore: num, achievementNotes: notes });
                 }}
               >
                 {num}
               </button>
             ))}
           </div>
           {score > 0 && (
             <div className="score-display">
               Selected: {score} {getScoreEmoji(score)}
             </div>
           )}
         </div>
         
         <div className="notes">
           <label>Notes (optional):</label>
           <textarea
             value={notes}
             onChange={(e) => {
               setNotes(e.target.value);
               onUpdate({ progressScore: score, achievementNotes: e.target.value });
             }}
             placeholder="What went well? What challenges did you face?"
           />
         </div>
       </div>
     );
   }

   function getScoreEmoji(score: number): string {
     if (score >= 9) return '⭐⭐⭐⭐⭐';
     if (score >= 7) return '⭐⭐⭐⭐';
     if (score >= 5) return '⭐⭐⭐';
     if (score >= 3) return '⭐⭐';
     return '⭐';
   }
   ```

3. **Accomplishments List**
   ```tsx
   function AccomplishmentsList({ accomplishments, onAdd, onRemove, onReorder }: Props) {
     const [newItem, setNewItem] = useState('');
     
     return (
       <div className="accomplishments-list">
         <ol>
           {accomplishments.map((item, index) => (
             <li key={item.id}>
               <span>{item.description}</span>
               <button onClick={() => onRemove(item.id)}>✕</button>
             </li>
           ))}
         </ol>
         
         <div className="add-accomplishment">
           <input
             type="text"
             value={newItem}
             onChange={(e) => setNewItem(e.target.value)}
             placeholder="Add accomplishment..."
             onKeyPress={(e) => {
               if (e.key === 'Enter') {
                 onAdd(newItem);
                 setNewItem('');
               }
             }}
           />
           <button onClick={() => {
             onAdd(newItem);
             setNewItem('');
           }}>
             + Add
           </button>
         </div>
         
         <p className="hint">
           Aim for 5-10 accomplishments. Include both goal-related and personal wins!
         </p>
       </div>
     );
   }
   ```

### Phase 3: Insights & Analytics (Week 3)

**Priority: MEDIUM**

1. **Auto-Generate Insights**
   - Run when review is completed
   - Pull data from all integrated sources
   - Calculate metrics & patterns
   - Store in quarterly_insights table

2. **Insights Dashboard**
   ```tsx
   function QuarterlyInsightsDashboard({ quarterlyReviewId }: Props) {
     const insights = useQuarterlyInsights(quarterlyReviewId);
     
     return (
       <div className="insights-dashboard">
         <header>
           <h2>Quarterly Insights & Analytics</h2>
         </header>
         
         <div className="metrics-grid">
           <MetricCard
             title="Goal Score"
             value={insights.averageGoalScore}
             max={10}
             trend={insights.previousQuarterComparison?.goalScoreDelta}
           />
           <MetricCard
             title="Habits"
             value={insights.habitConsistency}
             suffix="%"
             trend={insights.previousQuarterComparison?.habitDelta}
           />
           <MetricCard
             title="Best Week"
             value={insights.bestWeekAdherence}
             suffix="%"
             trend={insights.previousQuarterComparison?.bestWeekDelta}
           />
         </div>
         
         <section className="patterns">
           <h3>📈 Trends</h3>
           <ul>
             {insights.patterns.map((pattern, i) => (
               <li key={i}>{pattern}</li>
             ))}
           </ul>
         </section>
         
         <section className="strengths">
           <h3>💪 Strengths</h3>
           <ul>
             {insights.strengths.map((strength, i) => (
               <li key={i}>{strength}</li>
             ))}
           </ul>
         </section>
         
         <section className="improvements">
           <h3>⚠️ Areas for Improvement</h3>
           <ul>
             {insights.areasForImprovement.map((area, i) => (
               <li key={i}>{area}</li>
             ))}
           </ul>
         </section>
         
         <section className="recommendations">
           <h3>🎯 Recommendations for Next Quarter</h3>
           <RecommendationsList insights={insights} />
         </section>
       </div>
     );
   }
   ```

### Phase 4: History & Import (Week 4)

**Priority: MEDIUM**

1. **Historical View**
   ```tsx
   function QuarterlyHistory() {
     const quarters = useQuarterlyReviews();
     const groupedByYear = groupByYear(quarters);
     
     return (
       <div className="quarterly-history">
         <h2>Quarterly Reviews History</h2>
         {Object.entries(groupedByYear).map(([year, quarters]) => (
           <div key={year} className="year-group">
             <h3>{year}</h3>
             {quarters.map(quarter => (
               <QuarterCard key={quarter.id} quarter={quarter} />
             ))}
           </div>
         ))}
       </div>
     );
   }
   ```

2. **Import Interface**
   ```tsx
   function ImportHistoricalData() {
     const [file, setFile] = useState<File | null>(null);
     const [preview, setPreview] = useState<ParsedData | null>(null);
     
     async function handleFileUpload(file: File) {
       const data = await parseExcelFile(file);
       const validated = await validateImportData(data);
       setPreview(validated);
     }
     
     return (
       <div className="import-interface">
         <h2>Import Historical Reviews</h2>
         <FileUploader onUpload={handleFileUpload} />
         {preview && (
           <ImportPreview
             data={preview}
             onConfirm={executeImport}
             onCancel={() => setPreview(null)}
           />
         )}
       </div>
     );
   }
   ```

---

## Integration Points

### With High Focus Goals

```typescript
// Link review to goals
const highFocusGoals = await getHighFocusGoalsForQuarter(quarterIdentifier);

// When goal is reviewed, update goal record
await updateHighFocusGoal(goalId, {
  finalScore: review.progressScore,
  finalStatus: calculateStatus(review.progressScore),
  completedAt: new Date()
});
```

### With Weekly Sync

```typescript
// Pull weekly data for insights
const weeklySyncs = await getWeeklySyncsForQuarter(userId, quarterIdentifier);

// Analyze patterns
const weeklyCompletion = weeklySyncs.map(w => w.goalsCompleted / w.totalGoals);
const averageCompletion = weeklyCompletion.reduce((a,b) => a+b) / weeklyCompletion.length;
```

### With Habit Tracker

```typescript
// Get 3-month habit data
const habitStats = await getHabitStatsForQuarter(userId, startDate, endDate);

// Pull into insights
insights.habitConsistency = habitStats.overallPercentage;
```

### With Best Week

```typescript
// Get weekly adherence data
const bestWeekData = await getBestWeekAdherenceForQuarter(userId, startDate, endDate);

insights.bestWeekAdherence = bestWeekData.averageAdherence;
```

---

## Export Functionality

### PDF Export

```typescript
async function generatePDFReport(quarterlyReviewId: string): Promise<Blob> {
  const review = await getQuarterlyReview(quarterlyReviewId);
  const insights = await getQuarterlyInsights(quarterlyReviewId);
  
  const doc = new PDFDocument();
  
  // Title page
  doc.fontSize(24).text(`12 Week Sync - ${review.quarterIdentifier}`);
  doc.fontSize(12).text(`${formatDate(review.startDate)} - ${formatDate(review.endDate)}`);
  
  // Goal reviews
  doc.addPage();
  doc.fontSize(18).text('High Focus Goals Review');
  review.goalReviews.forEach(goal => {
    doc.fontSize(14).text(goal.goalName);
    doc.fontSize(12).text(`Score: ${goal.progressScore}/10`);
    if (goal.achievementNotes) {
      doc.text(goal.achievementNotes);
    }
  });
  
  // Accomplishments
  doc.addPage();
  doc.fontSize(18).text('Accomplishments');
  review.accomplishments.forEach((item, i) => {
    doc.fontSize(12).text(`${i+1}. ${item.description}`);
  });
  
  // Reflection
  doc.addPage();
  doc.fontSize(18).text('Reflection');
  // ... add all reflection answers
  
  // Insights
  if (insights) {
    doc.addPage();
    doc.fontSize(18).text('Insights & Analytics');
    // ... add insights data
  }
  
  return doc.toBlob();
}
```

---

## Timeline Estimate

- **Week 1:** Data layer + API (20-25h)
- **Week 2:** 12 Week Sync form UI (25-30h)
- **Week 3:** Insights & analytics (20-25h)
- **Week 4:** History view + import (15-20h)
- **Week 5:** Export + polish (10-15h)

**Total: 90-115 hours** (~4 weeks)

---

## Success Metrics

### Adoption
- % of users who complete quarterly reviews
- Average time to complete review
- % who complete within 1 week of quarter end

### Engagement
- Average # of accomplishments listed
- % who view insights
- % who export reports

### Outcomes
- Trend in goal scores over quarters
- User-reported value from reflection
- Correlation: completing review → next quarter success

---

## Files to Create

```
/lib
  /quarterly-review
    - models.ts
    - api.ts
    - insights.ts
    - export.ts

/components
  /quarterly-review
    - QuarterlyReviewForm.tsx
    - GoalReviewCard.tsx
    - AccomplishmentsList.tsx
    - ReflectionQuestions.tsx
    - InsightsDashboard.tsx
    - QuarterlyHistory.tsx
    - ImportInterface.tsx

/pages
  /review
    - 12-week-sync.tsx
    - [quarter].tsx
    - history.tsx
```

---

## References

- Concept: `12_WEEK_SYNC_CONCEPT.md`
- Sync Planner 4.0 PDF
- User's actual review (screenshot)
- High Focus Goals (existing)
- Weekly Sync (existing)
- Habit Tracker (existing)
- Best Week (existing)
