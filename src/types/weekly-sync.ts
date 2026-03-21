export interface GoalItem {
  id: string
  item_id: string
  title: string
  status: string
  display_order?: number
  priority_score?: number
  quest_id?: string
  milestone_id?: string
  parent_task_id?: string
  parent_quest_id?: string
  parent_quest_title?: string
  parent_quest_priority_score?: number
}

export interface WeeklyGoal {
  id: string
  goal_slot: number
  items: GoalItem[]
  weekDate?: string
}

export interface HierarchicalItem {
  id: string
  title: string
  status?: string
  subtasks?: HierarchicalItem[]
}

export interface SelectedItem {
  id: string
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK'
}

export interface Milestone {
  id: string
  title: string
  tasks?: (HierarchicalItem & { subtasks: HierarchicalItem[] })[]
}

export interface Quest {
  id: string
  title: string
  milestones?: Milestone[]
}

export interface ProgressData {
  completed: number
  total: number
  percentage: number
}

export interface WeeklyGoalsProgress {
  [slotNumber: number]: ProgressData
}

export interface Rule {
  id: string
  rule_text: string
  display_order: number
}
