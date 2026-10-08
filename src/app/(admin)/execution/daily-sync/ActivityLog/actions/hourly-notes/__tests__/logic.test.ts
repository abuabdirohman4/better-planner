import { describe, it, expect } from 'vitest';
import { hourWIB, visibleHours, validateHour, coveredHours } from '../logic';

describe('hourWIB', () => {
  it('converts UTC to WIB hour', () => {
    expect(hourWIB('2026-10-06T01:30:00Z')).toBe(8);
    expect(hourWIB('2026-10-06T17:00:00Z')).toBe(0);
  });
});

describe('visibleHours', () => {
  it('defaults to 04-22', () => {
    const h = visibleHours([]);
    expect(h[0]).toBe(4);
    expect(h[h.length - 1]).toBe(22);
    expect(h).toHaveLength(19);
  });
  it('widens to include used hours outside the default', () => {
    const h = visibleHours([2, 23, 10]);
    expect(h[0]).toBe(2);
    expect(h[h.length - 1]).toBe(23);
  });
  it('ikut rentang setelan user', () => {
    const h = visibleHours([], 6, 23);
    expect([h[0], h[h.length - 1]]).toEqual([6, 23]);
    expect(visibleHours([4], 6, 23)[0]).toBe(4);
  });
});

describe('validateHour', () => {
  it('rejects out of range', () => {
    expect(() => validateHour(24)).toThrow();
    expect(() => validateHour(-1)).toThrow();
    expect(() => validateHour(1.5)).toThrow();
    expect(() => validateHour(0)).not.toThrow();
  });
});

describe('coveredHours', () => {
  it('90 menit mulai 11:10 WIB melewati jam 11 dan 12', () => {
    expect(coveredHours('2026-10-08T04:10:00Z', 90)).toEqual([11, 12]);
  });
  it('selesai tepat di pergantian jam tidak ikut baris berikutnya', () => {
    expect(coveredHours('2026-10-08T04:00:00Z', 60)).toEqual([11]);
    expect(coveredHours('2026-10-08T04:30:00Z', 25)).toEqual([11]);
  });
  it('lewat tengah malam berhenti di 23', () => {
    expect(coveredHours('2026-10-08T16:30:00Z', 90)).toEqual([23]);
  });
});
