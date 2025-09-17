// Shared types for Weekly Sync components

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

export interface TreeGoalItem extends GoalItem {
  children: TreeGoalItem[];
}

export interface HierarchicalItem {
  id: string;
  title: string;
  status?: string;
  subtasks?: HierarchicalItem[];
}

export interface Milestone extends HierarchicalItem {
  tasks: (HierarchicalItem & { subtasks: HierarchicalItem[] })[];
}

export interface Quest extends HierarchicalItem {
  milestones: Milestone[];
}

export interface SelectedItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
}

export interface WeeklyFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedItems: SelectedItem[]) => void;
  year: number;
  initialSelectedItems?: SelectedItem[];
  existingSelectedIds?: Set<string>;
}

export interface WeeklyGoalsTableProps {
  year: number;
  weekNumber: number;
  goals: WeeklyGoal[];
  goalProgress: { [key: number]: { completed: number; total: number; percentage: number } };
  onRefreshGoals?: () => void;
}

export interface ToDontListCardProps {
  year: number;
  weekNumber: number;
  rules: Rule[];
  loading: boolean;
  onRefresh: () => void;
}

export interface Rule {
  id: string;
  rule_text: string;
  display_order: number;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  milestone_id: string;
  parent_task_id: string | null;
}
