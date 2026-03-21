// Internal domain types for main-quests feature
// These types are NOT exported outside this feature folder

export interface Task {
  id: string
  title: string
  status: 'TODO' | 'DONE'
  parent_task_id?: string | null
  display_order?: number
}

export interface Milestone {
  id: string
  title: string
  display_order: number
  status?: 'TODO' | 'DONE'
}

export interface Quest {
  id: string
  title: string
  motivation?: string
}

export interface QuestProgress {
  totalMilestones: number
  completedMilestones: number
  totalTasks: number
  completedTasks: number
  totalSubtasks: number
  completedSubtasks: number
  overallProgress: number
  milestoneProgress: number
  taskProgress: number
  subtaskProgress: number
  isLoading: boolean
}
