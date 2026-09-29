import type { Energy } from '@/lib/energy';

export interface OneMinuteJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (whatDone: string, whatThink: string, energy: Energy | null) => Promise<void>;
  taskTitle?: string;
  duration: number;
  isRetrying?: boolean;
  retryCount?: number;
}

