import useSWR from 'swr';
import { getAllTemplates } from '../actions';

export function useBestWeekTemplates() {
  const { data: templates, mutate, isLoading, error } = useSWR(
    'best-week-templates',
    () => getAllTemplates()
  );

  const activeTemplate = templates?.find(t => t.is_active) ?? null;

  return {
    templates: templates ?? [],
    activeTemplate,
    mutate,
    isLoading,
    error,
  };
}
