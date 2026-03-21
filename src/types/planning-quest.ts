export interface PlanningQuest {
  id?: string
  label: string
  title: string
  type?: 'PERSONAL' | 'WORK'
  source_quest_id?: string
  is_continuation?: boolean
  continuation_strategy?: string
  continuation_date?: string
}

export interface QuarterData {
  year: number
  quarter: number
  quarterString: string
  startDate: Date
  endDate: Date
  isCurrentQuarter: boolean
  weekRange: string
}

export interface QuestHistoryItem {
  year: number
  quarter: number
  quarterString: string
  quests: PlanningQuest[]
  questCount: number
}

export interface RankedQuest extends PlanningQuest {
  score: number
}

export interface QuestInput {
  id?: string
  title: string
  label?: string
  type?: string
  source_quest_id?: string
  is_continuation?: boolean
  continuation_strategy?: string
  continuation_date?: string
}

export interface SeparatedQuests {
  questsWithId: QuestInput[]
  newQuests: QuestInput[]
  emptyQuests: QuestInput[]
}
