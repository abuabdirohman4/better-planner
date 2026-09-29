export type Energy = -1 | 0 | 1;

export const ENERGY_OPTIONS: { value: Energy; symbol: string; hint: string }[] = [
  { value: 1, symbol: '+', hint: 'Nambah energi' },
  { value: 0, symbol: '=', hint: 'Biasa saja' },
  { value: -1, symbol: '−', hint: 'Terkuras' },
];

export function energyLabel(energy: Energy | null | undefined): string | null {
  return ENERGY_OPTIONS.find((o) => o.value === energy)?.symbol ?? null;
}

export function summarizeEnergy(rows: { energy?: number | null }[]) {
  const s = { plus: 0, neutral: 0, minus: 0, total: 0 };
  for (const { energy } of rows) {
    if (energy === 1) s.plus++;
    else if (energy === 0) s.neutral++;
    else if (energy === -1) s.minus++;
    else continue;
    s.total++;
  }
  return s;
}
