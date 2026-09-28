import { describe, it, expect } from 'vitest';
import { createdAtForQuarter, getQuarterDates } from '@/lib/quarterUtils';

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
