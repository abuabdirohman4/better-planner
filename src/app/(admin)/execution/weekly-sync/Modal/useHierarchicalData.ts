import { useState, useEffect, useCallback } from 'react';
import CustomToast from '@/components/ui/toast/CustomToast';
import { getHierarchicalData } from '../actions/hierarchicalDataActions';
import type { Quest } from '../types';

export function useHierarchicalData(year: number, quarter: number, isOpen: boolean) {
  const [hierarchicalData, setHierarchicalData] = useState<Quest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const loadHierarchicalData = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await getHierarchicalData(year, quarter);
      setHierarchicalData(data);
    } catch (error) {
      console.error('Error loading hierarchical data:', error);
      CustomToast.error('Gagal memuat data hierarkis');
    } finally {
      setDataLoading(false);
    }
  }, [year, quarter]);

  useEffect(() => {
    if (isOpen) {
      loadHierarchicalData();
    }
  }, [isOpen, loadHierarchicalData]);

  return { hierarchicalData, dataLoading };
}
