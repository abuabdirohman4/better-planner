import { setDailyPlan } from './actions/dailyPlanActions';

export interface DailyPlan {
  id: string;
  plan_date: string;
  daily_plan_items?: DailyPlanItem[];
}

export interface DailyPlanItem {
  id: string;
  item_id: string;
  item_type: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  title?: string;
  quest_title?: string;
  daily_session_target?: number;
  focus_duration?: number;
}

export interface DailySyncClientProps {
  year: number;
  quarter: number;
  weekNumber: number;
  selectedDate: string;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string; focus_duration?: number }) => void;
  dailyPlan: DailyPlan | null;
  setDailyPlanState: (plan: DailyPlan | null) => void;
  setDailyPlanAction?: typeof setDailyPlan;
  loading: boolean;
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
}

export interface TaskColumnProps {
  title: string;
  items: DailyPlanItem[];
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onAddSideQuest?: (title: string) => void;
  onSelectTasks?: () => void;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string; focus_duration?: number }) => void;
  selectedDate?: string;
  onTargetChange?: (itemId: string, newTarget: number) => void;
  onFocusDurationChange: (itemId: string, duration: number) => void;
  completedSessions: Record<string, number>;
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
  showAddQuestButton?: boolean;
}
