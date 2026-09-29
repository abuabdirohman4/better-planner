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

describe('getQuarterDates.endExclusive', () => {
  it('endExclusive Q3 = startDate Q4 (tanpa gap dan overlap)', () => {
    expect(getQuarterDates(2026, 3).endExclusive.getTime()).toBe(getQuarterDates(2026, 4).startDate.getTime());
  });

  it('endExclusive Q4 = endDate + 1 hari', () => {
    const { endDate, endExclusive } = getQuarterDates(2026, 4);
    expect(endExclusive.getTime() - endDate.getTime()).toBe(86400000);
  });

  it('endDate tetap Minggu 00:00 (tidak berubah, dipakai untuk tampilan)', () => {
    const { startDate, endDate } = getQuarterDates(2026, 3);
    expect(Math.round((endDate.getTime() - startDate.getTime()) / 86400000)).toBe(90);
  });

  it('Side Quest 27 Sep 2026 19:44 WIB masuk Q3, bukan Q4 (regresi app-taj8)', () => {
    const created = new Date('2026-09-27T19:44:00+07:00');
    const q3 = getQuarterDates(2026, 3);
    const q4 = getQuarterDates(2026, 4);
    expect(created >= q3.startDate && created < q3.endExclusive).toBe(true);
    expect(created >= q4.startDate).toBe(false);
  });
});

describe('createdAtForQuarter di hari terakhir kuartal', () => {
  it('memakai waktu sekarang kalau sekarang Minggu sore hari terakhir quarter itu', () => {
    const now = new Date('2026-09-27T19:44:00+07:00');
    expect(createdAtForQuarter(2026, 3, now)).toBe(now.toISOString());
  });
});

describe('getQuarterDates di tahun 53 minggu', () => {
  it('endExclusive Q4 2028 = startDate Q1 2029 (25-31 Des 2028 tidak hilang)', () => {
    expect(getQuarterDates(2028, 4).endExclusive.getTime()).toBe(getQuarterDates(2029, 1).startDate.getTime());
  });

  it('endExclusive Q4 2026 = startDate Q1 2027 (tahun 52 minggu tidak berubah)', () => {
    expect(getQuarterDates(2026, 4).endExclusive.getTime()).toBe(getQuarterDates(2027, 1).startDate.getTime());
  });

  it('tanggal minggu ke-53 (28 Des 2028) masuk Q4 2028 menurut quarterOfDate dan rentang query', () => {
    const date = new Date('2028-12-28T12:00:00+07:00');
    const q4 = getQuarterDates(2028, 4);
    expect(quarterOfDate(date)).toEqual({ year: 2028, quarter: 4 });
    expect(date >= q4.startDate && date < q4.endExclusive).toBe(true);
  });
});
