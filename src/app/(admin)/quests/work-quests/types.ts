import type {
  WorkQuestProject,
  WorkQuestTask,
  WorkQuest,
  WorkQuestSubtask,
  WorkQuestProjectFormData,
  WorkQuestTaskFormData,
  WorkQuestFormData,
  WorkQuestSubtaskFormData
} from '@/types/work-quest';



export interface WorkQuestProjectListProps {
  projects: WorkQuestProject[];
  onEditProject: (project: WorkQuestProject) => void;
  onInlineUpdateProject: (project: WorkQuestProject) => Promise<void>;
  onDeleteProject: (id: string) => void;
  onAddTask: (projectId: string, formData: WorkQuestTaskFormData) => void;
  onEditTask: (projectId: string, task: WorkQuestTask) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  onToggleProjectStatus: (projectId: string, status: 'TODO' | 'DONE') => void;
  onToggleTaskStatus: (taskId: string, status: 'TODO' | 'DONE') => void;
}

export interface WorkQuestProjectFormProps {
  initialData?: WorkQuestProject | null;
  onSubmit: (data: WorkQuestProjectFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export interface WorkQuestTaskFormProps {
  projectId: string;
  initialData?: WorkQuestTask | null;
  onSubmit: (data: WorkQuestTaskFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

// Legacy interfaces for backward compatibility
export interface WorkQuestListProps extends WorkQuestProjectListProps {
  workQuests: WorkQuest[];
  onEdit: (quest: WorkQuest) => void;
  onDelete: (id: string) => void;
}

export interface WorkQuestFormProps {
  initialData?: WorkQuest | null;
  onSubmit: (data: WorkQuestFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export interface WorkQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workQuest?: WorkQuest | null;
  onSave: (data: WorkQuestFormData) => void;
}
