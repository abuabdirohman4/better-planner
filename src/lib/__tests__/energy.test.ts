import { describe, it, expect } from 'vitest';
import { summarizeEnergy, energyLabel } from '@/lib/energy';

describe('summarizeEnergy', () => {
  it('menghitung + = − dan mengabaikan null/undefined', () => {
    const rows = [{ energy: 1 }, { energy: 1 }, { energy: 0 }, { energy: -1 }, { energy: null }, {}];
    expect(summarizeEnergy(rows)).toEqual({ plus: 2, neutral: 1, minus: 1, total: 4 });
  });

  it('list kosong -> semua nol', () => {
    expect(summarizeEnergy([])).toEqual({ plus: 0, neutral: 0, minus: 0, total: 0 });
  });
});

describe('energyLabel', () => {
  it('memetakan nilai ke simbol', () => {
    expect(energyLabel(1)).toBe('+');
    expect(energyLabel(0)).toBe('=');
    expect(energyLabel(-1)).toBe('−');
    expect(energyLabel(null)).toBeNull();
  });
});
