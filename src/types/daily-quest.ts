export interface DailyQuest {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  focus_duration: number
  is_archived: boolean
  /** Hari jadwal rutin (0=Min..6=Sab); null = dipilih manual (app-fj81). */
  repeat_days?: number[] | null
  created_at: string
  updated_at: string
}
