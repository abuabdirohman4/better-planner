# Type/Interface Management Guidelines

**CRITICAL**: Avoid type fragmentation by centralizing type definitions.

---

## Rules for Type Definitions

1. **Centralize Shared Types** in `src/types/` directory
   - Database entities (Quest, DailyPlan, ActivityLog, etc.)
   - API request/response types
   - Shared business logic types

2. **NEVER Duplicate Type Definitions** across files
   - Before creating a type, search: `grep -r "interface MyType" src/` or `grep -r "type MyType" src/`
   - If type exists, import it—don't recreate

3. **Use Type Hierarchy** for complex entities (extends pattern)
   ```typescript
   // Example: Quest types (src/types/quest.ts)
   export interface QuestBase { id, title, type, status }
   export interface QuestWithSchedule extends QuestBase { schedule, frequency }
   export interface QuestWithProgress extends QuestWithSchedule { completedCount, totalCount }
   ```

4. **Re-export for Backward Compatibility** when migrating types
   ```typescript
   // Old location (for backward compatibility)
   export type { QuestWithProgress } from '@/types/quest'
   ```

5. **Name Consistently**: Use descriptive, hierarchical names
   - `QuestBase`, `QuestWithSchedule`, `QuestWithProgress`
   - NOT `Quest1`, `Quest2`, `QuestV2`

6. **Local Types Are OK For**:
   - Component-specific props
   - Form data (internal to component)
   - Internal state management

7. **Centralize Types For**:
   - Database entities
   - API request/response
   - Shared across 2+ files
   - Used in multiple modules

---

## Type Location Structure

```
src/
├── types/              # Centralized types
│   ├── quest.ts       # Quest/task types
│   ├── daily-plan.ts  # DailyPlan/DailyPlanItem types
│   ├── activity.ts    # Activity/Timer types
│   └── README.md      # Type documentation
├── app/
│   └── (admin)/
│       └── quests/
│           └── types.ts  # Re-exports from @/types/quest
└── lib/
    └── questPermissions.ts # Imports from @/types/quest
```

---

## Check Before Creating Types

**Before adding `interface MyType` or `type MyType`**:

1. **Search for existing definitions**:
   ```bash
   grep -r "interface MyType" src/
   grep -r "type MyType" src/
   ```

2. **If type exists**:
   - Import it: `import type { MyType } from '@/types/...'`
   - Don't recreate/duplicate

3. **If type needs extension**:
   - Use `extends`: `interface MyTypeExtended extends MyType { ... }`
   - Don't copy-paste fields

4. **If type doesn't exist and is shared**:
   - Create in `src/types/[entity].ts`
   - Export with clear hierarchy
   - Document in comments
