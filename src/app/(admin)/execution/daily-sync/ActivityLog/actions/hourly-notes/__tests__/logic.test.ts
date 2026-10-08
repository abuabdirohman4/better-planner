import { describe, it, expect } from 'vitest';
import { hourWIB, visibleHours, validateHour, minuteOfDayWIB, layoutBlocks } from '../logic';

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

describe('minuteOfDayWIB', () => {
  it('menit sejak 00:00 WIB', () => {
    expect(minuteOfDayWIB('2026-10-08T04:25:00Z')).toBe(11 * 60 + 25);
    expect(minuteOfDayWIB('2026-10-08T17:05:00Z')).toBe(5);
  });
});

describe('layoutBlocks', () => {
  const b = (id: string, start: number, minutes: number) => ({ id, start, minutes });
  it('blok tidak bertumpuk memakai jalur 0', () => {
    expect(layoutBlocks([b('a', 600, 60), b('b', 700, 30)])).toEqual({ lanes: 1, lane: { a: 0, b: 0 } });
  });
  it('blok yang waktunya bertumpuk pindah ke jalur berikutnya', () => {
    expect(layoutBlocks([b('a', 600, 90), b('b', 630, 30), b('c', 700, 10)])).toEqual({ lanes: 2, lane: { a: 0, b: 1, c: 0 } });
  });
  it('kosong = 0 jalur', () => {
    expect(layoutBlocks([])).toEqual({ lanes: 0, lane: {} });
  });
});
