import { ActivityLogItem } from '@/app/(admin)/execution/daily-sync/ActivityLog/hooks/useActivityLogs';

export type ViewMode = 'list' | 'calendar';

export interface CalendarBlock extends ActivityLogItem {
  // Additional properties for calendar rendering if needed
  startMinute: number; // 0-1440
  durationMinutes: number;
  colIndex?: number; // For handling overlapping blocks
  maxCols?: number;
}

export interface TimeSlot {
  hour: number;
  label: string;
}
