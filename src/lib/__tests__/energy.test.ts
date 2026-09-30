import { describe, it, expect } from 'vitest';
import { summarizeEnergy, energyLabel, mostDrainingTask } from '@/lib/energy';

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

describe('mostDrainingTask', () => {
  it('memilih tugas dengan tanda − terbanyak', () => {
    const rows = [
      { energy: -1, tasks: { title: 'A' } },
      { energy: -1, tasks: [{ title: 'B' }] },
      { energy: -1, tasks: { title: 'B' } },
      { energy: 1, tasks: { title: 'A' } },
    ];
    expect(mostDrainingTask(rows)).toBe('B');
  });
  it('null bila tak ada tanda −', () => {
    expect(mostDrainingTask([{ energy: 1, tasks: { title: 'A' } }])).toBeNull();
  });
});
