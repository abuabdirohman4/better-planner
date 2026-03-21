export interface ActivityLogItem {
  id: string
  type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'BREAK'
  task_id?: string
  task_title?: string | null
  start_time: string
  end_time: string
  duration_minutes: number
  milestone_id?: string
  milestone_title?: string | null
  quest_id?: string
  quest_title?: string | null
  what_done?: string | null
  what_think?: string | null
  task_type?: string
}

export type ViewMode = 'GROUPED' | 'TIMELINE' | 'CALENDAR'
export type CalendarViewMode = '24_HOUR' | 'DYNAMIC'
