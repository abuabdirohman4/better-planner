import { describe, it, expect } from 'vitest';
import { hourWIB, visibleHours, validateHour } from '../logic';

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
});

describe('validateHour', () => {
  it('rejects out of range', () => {
    expect(() => validateHour(24)).toThrow();
    expect(() => validateHour(-1)).toThrow();
    expect(() => validateHour(1.5)).toThrow();
    expect(() => validateHour(0)).not.toThrow();
  });
});
