import type { SideQuest, SideQuestFormData } from '@/types/side-quest';


export interface SideQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sideQuest?: SideQuest;
  onSave: (data: SideQuestFormData) => void;
}
