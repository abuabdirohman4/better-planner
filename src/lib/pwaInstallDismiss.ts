export const INSTALL_DISMISS_DAYS = 30;
const KEY = 'pwa-install-dismissed-at';

// Pop-up install tersembunyi selama INSTALL_DISMISS_DAYS sejak terakhir di-dismiss.
export function shouldShowInstallPrompt(dismissedAt: number | null, now: number = Date.now()): boolean {
  if (dismissedAt === null || Number.isNaN(dismissedAt)) return true;
  return now - dismissedAt >= INSTALL_DISMISS_DAYS * 86400000;
}

export function readInstallDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

export function saveInstallDismissedAt(now: number = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(now));
  } catch {
    // storage diblokir (mode privat): abaikan, pop-up muncul lagi di kunjungan berikut
  }
}
