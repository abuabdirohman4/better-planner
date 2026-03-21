import type {
  DailyPlan,
  DailyPlanItem,
  WeeklyTaskItem,
} from '@/types/daily-plan';


export interface DailySyncClientProps {
  year: number;
  weekNumber: number;
  selectedDate: string;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string; focus_duration?: number; completed_sessions?: number; target_sessions?: number }) => void;
  dailyPlan: DailyPlan | null;
  loading: boolean;
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
}

export interface TaskColumnProps {
  title: string;
  items: DailyPlanItem[];
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<void>;
  onAddSideQuest?: (title: string) => void;
  onSelectTasks?: (newItems: { item_id: string; item_type: string; }[]) => void;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string; focus_duration?: number; completed_sessions?: number; target_sessions?: number }) => void;
  selectedDate?: string;
  onTargetChange?: (itemId: string, newTarget: number) => Promise<void>;
  onFocusDurationChange: (itemId: string, duration: number) => Promise<void>;
  completedSessions: Record<string, number>;
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
  showAddQuestButton?: boolean;
  onRemove?: (itemId: string) => Promise<void>; // NEW: Handler untuk remove item
  onConvertToChecklist?: (itemId: string) => Promise<void>; // NEW: Handler untuk convert to checklist
  onConvertToQuest?: (itemId: string) => Promise<void>; // NEW: Handler untuk convert to quest
  // Drag handle props (optional, for sortable cards)
  dragHandleProps?: {
    listeners?: any;
    attributes?: any;
  };
}

export interface TaskCardProps {
  item: DailyPlanItem;
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<void>;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string; focus_duration?: number; completed_sessions?: number; target_sessions?: number }) => void;
  selectedDate?: string;
  onTargetChange?: (itemId: string, newTarget: number) => Promise<void>;
  onFocusDurationChange: (itemId: string, duration: number) => Promise<void>;
  completedSessions: Record<string, number>;
  refreshKey?: number;
  forceRefreshTaskId?: string | null;
  onRemove?: (itemId: string) => Promise<void>; // NEW: Handler untuk remove item
  onConvertToChecklist?: (itemId: string) => Promise<void>; // NEW: Handler untuk convert to checklist
  onConvertToQuest?: (itemId: string) => Promise<void>; // NEW: Handler untuk convert to quest
  // Drag handle props (optional, for sortable cards)
  dragHandleProps?: {
    listeners?: any;
    attributes?: any;
  };
}

export interface TaskSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WeeklyTaskItem[];
  selectedTasks: Record<string, boolean>;
  onTaskToggle: (taskId: string) => void;
  onSave: () => void;
  isLoading: boolean; // Loading untuk konten (skeleton)
  savingLoading?: boolean; // Loading untuk button (spinner)
  completedTodayCount?: number; // Jumlah tugas yang sudah selesai hari ini
}


export interface SideQuestFormProps {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

