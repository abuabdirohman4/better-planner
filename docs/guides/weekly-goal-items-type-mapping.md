# Weekly Goal Items Type Mapping

## Overview

Dokumen ini menjelaskan bagaimana menentukan `item_type` untuk items di `weekly_goal_items` table berdasarkan struktur data di `tasks` table.

## Database Structure

### `tasks` Table
- `id`: UUID (Primary Key)
- `title`: Text
- `type`: USER-DEFINED (enum: MAIN_QUEST, WORK, SIDE_QUEST, LEARNING, SUBTASK)
- `milestone_id`: UUID (nullable)
- `parent_task_id`: UUID (nullable)
- `status`: USER-DEFINED (enum: TODO, IN_PROGRESS, DONE)
- `user_id`: UUID
- `due_date`: Date (nullable)
- `scheduled_date`: Date (nullable)
- `display_order`: Double Precision
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `weekly_goal_items` Table
- `id`: UUID (Primary Key)
- `weekly_goal_id`: UUID (Foreign Key to weekly_goals)
- `item_id`: UUID (Foreign Key to tasks.id)

**Note**: Kolom `item_type` dihapus karena menyebabkan constraint error saat upsert.

## Type Mapping Rules

### TASK (Parent Task)
**Kondisi:**
- `type = 'MAIN_QUEST'`
- `milestone_id IS NOT NULL`
- `parent_task_id IS NULL`

**Contoh:**
```sql
-- Task "Daily Sync"
id: 85ad21c9-8462-410d-83fe-dbbd16aac352
type: MAIN_QUEST
milestone_id: 54badf28-6dad-4162-b012-675b269d6a02
parent_task_id: null
```

### SUBTASK (Child Task)
**Kondisi:**
- `type = 'MAIN_QUEST'`
- `milestone_id IS NULL`
- `parent_task_id IS NOT NULL`

**Contoh:**
```sql
-- Subtask "add what have done & what next"
id: 25c0036d-1c29-467a-9956-bfda1fa6b037
type: MAIN_QUEST
milestone_id: null
parent_task_id: 85ad21c9-8462-410d-83fe-dbbd16aac352
```

## Implementation

### Database Query untuk Menentukan Type
```sql
-- Get item type based on task structure
SELECT 
  t.id,
  t.title,
  CASE 
    WHEN t.type = 'MAIN_QUEST' AND t.milestone_id IS NOT NULL AND t.parent_task_id IS NULL 
    THEN 'TASK'
    WHEN t.type = 'MAIN_QUEST' AND t.milestone_id IS NULL AND t.parent_task_id IS NOT NULL 
    THEN 'SUBTASK'
    ELSE 'TASK' -- Default fallback
  END as item_type
FROM tasks t
WHERE t.id = 'item_id_from_weekly_goal_items';
```

### UI Implementation
Karena `weekly_goal_items` tidak memiliki kolom `item_type`, UI menggunakan logic berikut:

**TaskList.tsx:**
```typescript
// Check if item is in current selection
const isInCurrentSelection = selectedItems.some(item => item.id === task.id && item.type === 'TASK');
```

**SubtaskList.tsx:**
```typescript
// Check if subtask is in current selection (handles both TASK and SUBTASK types)
const isChecked = selectedItems.some(item => 
  item.id === subtask.id && 
  (item.type === 'SUBTASK' || item.type === 'TASK')
) || existingSelectedIds.has(subtask.id) || parentTaskSelected;
```

## Data Flow

1. **User selects task/subtask** in Weekly Sync Modal
2. **All items stored as `type: 'TASK'`** in `selectedItems` (WeeklySyncTable.tsx line 121)
3. **UI renders based on hierarchical structure**:
   - Tasks with `milestone_id` → rendered in TaskList
   - Tasks with `parent_task_id` → rendered in SubtaskList
4. **Checkbox logic handles both types** for proper selection state

## Notes

- **Current Fix**: UI handles both `'TASK'` and `'SUBTASK'` types in checkbox logic
- **Database**: No `item_type` column needed (removed to fix constraint errors)
- **Future**: If needed, can add `item_type` column with computed values based on rules above

## Related Files

- `src/app/(admin)/execution/weekly-sync/WeeklySyncTable/WeeklySyncTable.tsx`
- `src/app/(admin)/execution/weekly-sync/WeeklySyncModal/components/TaskList.tsx`
- `src/app/(admin)/execution/weekly-sync/WeeklySyncModal/components/SubtaskList.tsx`
- `src/app/(admin)/execution/weekly-sync/actions/hierarchicalDataActions.ts`

## Last Updated

December 2024 - Fix for subtask selection in Weekly Sync Modal
