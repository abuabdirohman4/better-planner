// WeeklySyncClient Types
// Types specific to WeeklySyncClient functionality

import type { WeeklyGoal, Rule } from '@/types/weekly-sync';


export interface MainContentProps {
  // Week navigation
  displayWeek: number;
  totalWeeks: number;
  isWeekDropdownOpen: boolean;
  setIsWeekDropdownOpen: (value: boolean) => void;
  handleSelectWeek: (weekIdx: number) => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
  
  // Data
  year: number;
  quarter: number;
  mobileOptimizedGoals: WeeklyGoal[];
  processedProgress: any;
  processedRules: Rule[];
  
  // Loading states
  toDontListLoading: boolean;
  
  // Handlers
  handleRefreshGoals: () => void;
  handleRefreshToDontList: () => void;
  
  // Data source indicator
  dataSource?: string;
}

export interface WeekSelectorProps {
  displayWeek: number;
  totalWeeks: number;
  isWeekDropdownOpen: boolean;
  setIsWeekDropdownOpen: (value: boolean) => void;
  handleSelectWeek: (weekIdx: number) => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
}
