

export interface OneMinuteJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (whatDone: string, whatThink: string) => Promise<void>;
  taskTitle?: string;
  duration: number;
  isRetrying?: boolean;
  retryCount?: number;
}

