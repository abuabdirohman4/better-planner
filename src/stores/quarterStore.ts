import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quarterOfDate } from '@/lib/quarterUtils';

interface QuarterState {
  year: number;
  quarter: number;
  setQuarter: (year: number, quarter: number) => void;
  getQuarterString: () => string;
}

export const useQuarterStore = create<QuarterState>()(
  persist(
    (set, get) => ({
      ...quarterOfDate(new Date()), // default = quarter berjalan (13 minggu); persist menimpa kalau user pernah memilih

      setQuarter: (year: number, quarter: number) => {
        set({ year, quarter });
      },

      getQuarterString: () => {
        const { year, quarter } = get();
        return `Q${quarter} ${year}`;
      },
    }),
    {
      name: 'quarter-storage', // localStorage key
      version: 1, // naik dari 0: bug lama menyimpan Q1 di semua browser, reset sekali
      migrate: (persisted, version) =>
        version < 1 ? { ...(persisted as object), ...quarterOfDate(new Date()) } : persisted,
    }
  )
);
