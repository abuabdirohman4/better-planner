import type { ActivityLogItem, ViewMode, CalendarViewMode } from '@/types/activity-log';
export type { ActivityLogItem, ViewMode, CalendarViewMode };

export interface ActivityLogProps {
  date: string;
  refreshKey?: number;
}


export interface TimeSlot {
  hour: number;
  label: string;
  isEmpty: boolean;
}

export interface CalendarBlock {
  id: string;
  activity: ActivityLogItem;
  topPercent: number;
  heightPercent: number;
  questType: 'main' | 'work' | 'side' | 'daily' | 'break' | null;
}
