// Weekly Sync Types
// Consolidated types for weekly sync functionality

// ============================================================================
// DOMAIN TYPES (Business Logic)
// ============================================================================

// Weekly Goals Domain
export interface GoalItem {
  id: string;
  item_id: string;
  item_type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  status: string;
  display_order?: number;
  priority_score?: number;
  quest_id?: string;
  milestone_id?: string;
  parent_task_id?: string;
  parent_quest_id?: string;
  parent_quest_title?: string;
  parent_quest_priority_score?: number;
}

export interface WeeklyGoal {
  id: string;
  goal_slot: number;
  items: GoalItem[];
}

// Weekly Sync Domain
export interface HierarchicalItem {
  id: string;
  title: string;
  status?: string;
  subtasks?: HierarchicalItem[];
}

export interface SelectedItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
}

export interface Milestone {
  id: string;
  title: string;
  tasks?: (HierarchicalItem & { subtasks: HierarchicalItem[] })[];
}

export interface Quest {
  id: string;
  title: string;
  milestones?: Milestone[];
}

// Progress & Calculations Domain
export interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

export interface WeeklyGoalsProgress {
  [slotNumber: number]: ProgressData;
}

// ============================================================================
// RE-EXPORTED TYPES
// ============================================================================

// Re-export Rule type (used in hooks)
export type { 
  Rule
} from './ToDontList/types';
