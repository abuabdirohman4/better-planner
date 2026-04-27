import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import type { BrainDumpItem } from '@/types/brain-dump';
import { getBrainDumpByDateRange, upsertBrainDump } from '@/app/(admin)/execution/daily-sync/BrainDump/actions/actions';
import { brainDumpKeys } from '@/lib/swr';
import { getQuarterDates } from '@/lib/quarterUtils';
import { getLocalDateString } from '@/lib/dateUtils';

interface UseBrainDumpQuarterOptions {
  year: number;
  quarter: number;
}

interface UseBrainDumpQuarterReturn {
  dumpsByDate: Map<string, BrainDumpItem>;
  isLoading: boolean;
  error: string | null;
  saveDump: (date: string, content: string) => Promise<void>;
  isSaving: boolean;
}

export function useBrainDumpQuarter({ year, quarter }: UseBrainDumpQuarterOptions): UseBrainDumpQuarterReturn {
  const [isSaving, setIsSaving] = useState(false);

  // Hitung date range untuk quarter ini
  const { startDate, endDate } = getQuarterDates(year, quarter);
  const startDateStr = getLocalDateString(startDate);
  const endDateStr = getLocalDateString(endDate);

  const { data, error, isLoading, mutate } = useSWR(
    brainDumpKeys.byDateRange(startDateStr, endDateStr),
    () => getBrainDumpByDateRange(startDateStr, endDateStr),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 15 * 60 * 1000, // 15 menit
      errorRetryCount: 3,
    }
  );

  // Convert array ke Map untuk O(1) lookup
  const dumpsByDate = useMemo(
    () => new Map((data ?? []).map((d) => [d.date, d])),
    [data]
  );

  const saveDump = useCallback(
    async (date: string, content: string) => {
      setIsSaving(true);
      try {
        const result = await upsertBrainDump({ date, content });
        if (result) {
          // Optimistic update: replace atau insert entry di cache
          mutate((prev) => {
            const updated = [...(prev ?? [])];
            const idx = updated.findIndex((d) => d.date === date);
            if (idx >= 0) {
              updated[idx] = result;
            } else {
              updated.push(result);
            }
            return updated;
          }, false);
        }
      } catch {
        toast.error('Gagal menyimpan brain dump');
        throw new Error('Save failed');
      } finally {
        setIsSaving(false);
      }
    },
    [mutate]
  );

  return {
    dumpsByDate,
    isLoading,
    error: error?.message ?? null,
    saveDump,
    isSaving,
  };
}
