import type { BrainDumpItem } from '@/types/brain-dump';
export interface BrainDumpProps {
  date: string;
  onSave?: (content: string) => void;
  onLoad?: (date: string) => Promise<BrainDumpItem[]>;
}
