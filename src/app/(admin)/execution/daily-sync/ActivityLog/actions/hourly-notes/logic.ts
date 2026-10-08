export const DEFAULT_FIRST_HOUR = 4;
export const DEFAULT_LAST_HOUR = 22;

/** Jam (0-23) WIB dari timestamp UTC. */
export function hourWIB(iso: string): number {
  const h = new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false });
  return Number(h) % 24;
}

/** Baris jam yang tampil: default 04-22, melebar bila ada isi di luar rentang itu. */
export function visibleHours(usedHours: number[]): number[] {
  const first = Math.min(DEFAULT_FIRST_HOUR, ...usedHours);
  const last = Math.max(DEFAULT_LAST_HOUR, ...usedHours);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

export function validateHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Jam tidak valid');
}
