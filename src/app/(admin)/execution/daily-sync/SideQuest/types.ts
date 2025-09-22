export interface SideQuestFormProps {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

export interface SideQuestItem {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  item_type: string;
  focus_duration?: number;
}
