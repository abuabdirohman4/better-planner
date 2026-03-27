import useSWR from 'swr';
import { getBlocksForTemplate } from '../actions';

export function useBestWeekBlocks(templateId: string | null) {
  const { data: blocks, mutate, isLoading, error } = useSWR(
    templateId ? `best-week-blocks-${templateId}` : null,
    () => getBlocksForTemplate(templateId!)
  );

  return {
    blocks: blocks ?? [],
    mutate,
    isLoading,
    error,
  };
}
