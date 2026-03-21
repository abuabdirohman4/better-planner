export interface DailyPlan {
  id: string
  plan_date: string
  daily_plan_items?: DailyPlanItem[]
}

export interface DailyPlanItem {
  id: string
  item_id: string
  item_type: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  title?: string
  quest_title?: string
  daily_session_target?: number
  focus_duration?: number
  display_order?: number
  is_archived?: boolean
}

export interface WeeklyTaskItem {
  id: string
  type: 'MAIN_QUEST' | 'WORK' | 'SIDE_QUEST' | 'LEARNING' | 'DAILY_QUEST'
  title: string
  status: string
  quest_title: string
  goal_slot: number
  parent_task_id?: string | null
  is_archived?: boolean
}

export interface SideQuestItem {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  item_type: string
  focus_duration?: number
}

export type ActivityViewMode = 'PLAN' | 'ACTUAL' | 'CALENDAR'

export interface TaskSchedule {
  id: string
  daily_plan_item_id: string
  scheduled_start_time: string
  scheduled_end_time: string
  duration_minutes: number
  session_count: number
  created_at?: string
  updated_at?: string
  daily_plan_item?: DailyPlanItem
}

export interface DailyPlanItemWithSchedules extends DailyPlanItem {
  schedules?: TaskSchedule[]
  total_scheduled_sessions?: number
  remaining_sessions?: number
  has_conflict?: boolean
}

export interface ScheduleBlockInput {
  startTime: string
  sessionCount: number
  duration: number
  endTime: string
}
