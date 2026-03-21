export interface WorkQuestProject {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  created_at: string
  updated_at: string
  tasks: WorkQuestTask[]
}

export interface WorkQuestTask {
  id: string
  parent_task_id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  created_at: string
  updated_at: string
}

export interface WorkQuestProjectFormData {
  title: string
}

export interface WorkQuestTaskFormData {
  title: string
  description?: string
}

// Legacy aliases for backward compatibility
export interface WorkQuest extends WorkQuestProject {}
export interface WorkQuestSubtask extends WorkQuestTask {}
export interface WorkQuestFormData extends WorkQuestProjectFormData {
  description?: string
  subtasks: WorkQuestSubtaskFormData[]
}
export interface WorkQuestSubtaskFormData extends WorkQuestTaskFormData {}
