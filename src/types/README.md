# Better Planner - Centralized Types

This directory contains all centralized domain and shared types for the Better Planner application. 

**CRITICAL RULE**: All domain types MUST be centralized here. Do not create new interfaces/types for data entities or shared domains inside feature folders.

## Importing Types

Always use exact explicit imports. Do NOT use barrel files (`index.ts`).

```typescript
// ✅ CORRECT
import type { DailyPlan } from '@/types/daily-plan';
import type { UserProfile } from '@/types/user-profile';

// ❌ INCORRECT
import type { DailyPlan, UserProfile } from '@/types'; // No barrel files
import { DailyPlan } from '@/types/daily-plan'; // Always use `import type`
```

## Available Domains

| Domain | File | Key Types |
|--------|------|-----------|
| **Activity Tracking** | `activity-log.ts` | `ActivityLogItem`, `ViewMode`, `CalendarViewMode` |
| **Brain Dump** | `brain-dump.ts` | `BrainDumpItem` |
| **Calendar** | `calendar.ts` | `CalendarBlock`, `TimeSlot` |
| **Daily Execution** | `daily-plan.ts` | `DailyPlan`, `DailyPlanItem`, `TaskSchedule`, `ActivityViewMode` |
| **Daily Quests** | `daily-quest.ts` | `DailyQuest` |
| **Journaling** | `journal.ts` | `JournalEntry`, `JournalData` |
| **12-Week Planning** | `planning-quest.ts`| `PlanningQuest`, `QuarterData`, `RankedQuest`, `QuestInput` |
| **Quest Continuity** | `questContinuity.ts`| `QuestWithContinuity` |
| **Side Quests** | `side-quest.ts` | `SideQuest`, `SideQuestFormData` |
| **Sound Settings** | `sound.ts` | `SoundSettings`, `SoundOption` |
| **Pomodoro Timer** | `timer.ts` | `TimerState`, `TimerTask`, `TimerSettings`, `TimerSession` |
| **User Profile** | `user-profile.ts` | `UserProfile` |
| **Vision/Goals** | `vision.ts` | `Vision`, `VisionEntry` |
| **Weekly Planning** | `weekly-sync.ts` | `WeeklyGoal`, `GoalItem`, `Quest`, `Rule` |
| **Work Quests** | `work-quest.ts` | `WorkQuestProject`, `WorkQuestTask`, form definitions |

## What Stays Collocated?

1. **Component Props**: `interface MyComponentProps {}` should stay in the component file or a local `types.ts` next to the component.
2. **Hook Returns**: Internal UI-specific states returned by a hook.
3. **Single-Use Request/Response**: If an API type or server action parameter is only used in exactly one file, it can remain collocated.

## Adding a New Type

1. **Check if it exists**: Run `grep -r "interface YourType" src/types/`.
2. **If it belongs to an existing domain**: Add it to that domain's file.
3. **If it is a new domain**: Create a new file `src/types/[domain-name].ts`.

*For more details on type management guidelines, read `@docs/claude/type-management.md`.*
