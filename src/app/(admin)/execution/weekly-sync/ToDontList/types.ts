// ToDontList Types
// Types specific to ToDontList functionality

import type { Rule } from '@/types/weekly-sync';

export interface ToDontListCardProps {
  year: number;
  quarter: number;
  weekNumber: number;
  rules: Rule[];
  loading: boolean;
  onRefresh: () => void;
}
