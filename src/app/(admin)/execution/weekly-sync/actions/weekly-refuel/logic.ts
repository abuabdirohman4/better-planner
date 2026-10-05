// NO "use server" — pure functions, no DB calls

/** Teks kosong/spasi saja -> null. */
export function normalizeText(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  return t === '' ? null : t;
}

