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

/** Judul tugas dengan tanda − terbanyak (null bila tidak ada). */
export function mostDrainingTask(rows: { energy?: number | null; tasks?: { title: string } | { title: string }[] | null }[]): string | null {
  const count = new Map<string, number>();
  for (const { energy, tasks } of rows) {
    const title = Array.isArray(tasks) ? tasks[0]?.title : tasks?.title;
    if (energy === -1 && title) count.set(title, (count.get(title) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
