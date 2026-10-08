// Setelah deploy, tab yang masih memegang kode lama meminta file/aksi yang sudah tidak ada di server.
const SKEW = /ChunkLoadError|Loading (CSS )?chunk|Failed to find Server Action|Failed to fetch dynamically imported module|Importing a module script failed/i;
const KEY = 'beplan-skew-reload-at';
const MIN_GAP_MS = 60_000;

export function isVersionSkewError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; message?: string };
  return SKEW.test(`${e.name ?? ''} ${e.message ?? ''}`);
}

/** Boleh reload otomatis kalau reload otomatis terakhir lebih dari semenit lalu (anti loop). */
export function shouldAutoReload(lastReloadAt: string | null, now: number): boolean {
  return !lastReloadAt || now - Number(lastReloadAt) > MIN_GAP_MS;
}

/** Muat ulang halaman sekali bila error berasal dari versi lama. Mengembalikan true kalau reload dijalankan. */
export function reloadIfVersionSkew(error: unknown): boolean {
  if (!isVersionSkewError(error)) return false;
  try {
    if (!shouldAutoReload(sessionStorage.getItem(KEY), Date.now())) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sessionStorage tidak tersedia: tetap reload sekali.
  }
  window.location.reload();
  return true;
}
