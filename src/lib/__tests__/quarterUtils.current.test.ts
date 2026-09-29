import { describe, it, expect, afterEach, vi } from 'vitest';
import { parseQParam, quarterOfDate } from '@/lib/quarterUtils';

afterEach(() => vi.useRealTimers());

describe('quarter berjalan (13 minggu, bukan bulan kalender)', () => {
  it('27 Sep 2026 = Q3 2026', () => {
    expect(quarterOfDate(new Date(2026, 8, 27, 12))).toEqual({ year: 2026, quarter: 3 });
  });

  it('28 Sep 2026 (Senin) = Q4 2026', () => {
    expect(quarterOfDate(new Date(2026, 8, 28, 0, 0))).toEqual({ year: 2026, quarter: 4 });
  });

  it('parseQParam(null) mengikuti quarter berjalan', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    expect(parseQParam(null)).toEqual({ year: 2026, quarter: 4 });
  });

  it('parseQParam(null) memakai tahun perencanaan di pergantian tahun', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 30, 10)); // 28 Des 2026 sudah Q1 2027
    expect(parseQParam(null)).toEqual({ year: 2027, quarter: 1 });
  });

  it('parseQParam dengan ?q= tetap menurut parameter', () => {
    expect(parseQParam('2025-Q2')).toEqual({ year: 2025, quarter: 2 });
  });
});
