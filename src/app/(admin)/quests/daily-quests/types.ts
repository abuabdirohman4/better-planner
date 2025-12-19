export interface DailyQuest {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  focus_duration: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}
