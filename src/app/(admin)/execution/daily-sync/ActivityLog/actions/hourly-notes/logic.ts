export const DEFAULT_FIRST_HOUR = 4;
export const DEFAULT_LAST_HOUR = 22;

/** Jam (0-23) WIB dari timestamp UTC. */
export function hourWIB(iso: string): number {
  const h = new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false });
  return Number(h) % 24;
}

/** Baris jam yang tampil: rentang setelan user (bawaan 04-22), melebar bila ada isi di luar rentang itu. */
export function visibleHours(usedHours: number[], from = DEFAULT_FIRST_HOUR, to = DEFAULT_LAST_HOUR): number[] {
  const first = Math.min(from, ...usedHours);
  const last = Math.max(to, ...usedHours);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

export function validateHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Jam tidak valid');
}

/** Menit sejak 00:00 WIB. */
export function minuteOfDayWIB(iso: string): number {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Bagi blok siklus ke jalur (kolom) supaya yang waktunya bertumpuk tampil berdampingan. start/minutes dalam menit. */
export function layoutBlocks(blocks: { id: string; start: number; minutes: number }[]): { lanes: number; lane: Record<string, number> } {
  const laneEnds: number[] = [];
  const lane: Record<string, number> = {};
  for (const blk of [...blocks].sort((x, y) => x.start - y.start)) {
    let i = laneEnds.findIndex((end) => end <= blk.start);
    if (i === -1) i = laneEnds.push(0) - 1;
    laneEnds[i] = blk.start + blk.minutes;
    lane[blk.id] = i;
  }
  return { lanes: laneEnds.length, lane };
}
