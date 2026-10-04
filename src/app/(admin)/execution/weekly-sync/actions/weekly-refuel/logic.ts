// NO "use server" — pure functions, no DB calls

/** Teks kosong/spasi saja -> null. */
export function normalizeText(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  return t === '' ? null : t;
}

/** Jam tidur: '' -> null (kosong), '8' / '7,5' / '7.5' -> angka 0..24 kelipatan 0.5; selain itu -> 'invalid'. */
export function parseSleepHours(input: string | number | null | undefined): number | null | 'invalid' {
  if (input === null || input === undefined) return null;
  const s = String(input).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 24) return 'invalid';
  return Math.round(n * 2) / 2;
}
