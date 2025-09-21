// WeeklySyncTable Types
// Types specific to WeeklySyncTable functionality

import type { GoalItem, WeeklyGoal, ProgressData } from '../WeeklySyncClient/types';

export interface WeeklyGoalsTableProps {
  year: number;
  weekNumber: number;
  goals: WeeklyGoal[];
  goalProgress: { [key: number]: ProgressData };
  onRefreshGoals?: () => void;
}

export interface GoalRowProps {
  slotNumber: number;
  goal: WeeklyGoal | undefined;
  progress: ProgressData;
  onSlotClick: (slotNumber: number) => void;
}

export interface HorizontalGoalDisplayProps {
  items: GoalItem[];
  onClick: () => void;
  slotNumber: number;
}

export interface ProgressIndicatorProps {
  progress: ProgressData;
}
