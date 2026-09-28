import { describe, it, expect } from 'vitest';
import { createdAtForQuarter, getQuarterDates, quarterOfDate } from '@/lib/quarterUtils';

describe('createdAtForQuarter', () => {
  it('memakai waktu sekarang kalau sekarang di dalam quarter itu', () => {
    const { startDate } = getQuarterDates(2026, 3);
    const now = new Date(startDate.getTime() + 5 * 86400000);
    expect(createdAtForQuarter(2026, 3, now)).toBe(now.toISOString());
  });

  it('memakai awal quarter kalau quarter itu di masa depan', () => {
    const { startDate } = getQuarterDates(2026, 4);
    const now = new Date(startDate.getTime() - 86400000);
    expect(createdAtForQuarter(2026, 4, now)).toBe(startDate.toISOString());
  });

  it('memakai awal quarter kalau quarter itu sudah lewat', () => {
    const { startDate, endDate } = getQuarterDates(2026, 2);
    const now = new Date(endDate.getTime() + 30 * 86400000);
    expect(createdAtForQuarter(2026, 2, now)).toBe(startDate.toISOString());
  });
});

describe('quarterOfDate', () => {
  it('menghitung quarter awal Q3 2026', () => {
    expect(quarterOfDate(getQuarterDates(2026, 3).startDate)).toEqual({ year: 2026, quarter: 3 });
  });

  it('menghitung tanggal di awal Q4 2026', () => {
    const date = new Date(getQuarterDates(2026, 4).startDate.getTime() + 86400000);
    expect(quarterOfDate(date)).toEqual({ year: 2026, quarter: 4 });
  });

  it('menghitung tanggal awal Q1 2026 yang jatuh di akhir Desember planning year', () => {
    expect(quarterOfDate(getQuarterDates(2026, 1).startDate)).toEqual({ year: 2026, quarter: 1 });
  });
});
