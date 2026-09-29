import { describe, it, expect } from 'vitest';
import { shouldShowInstallPrompt, INSTALL_DISMISS_DAYS } from '@/lib/pwaInstallDismiss';

const DAY = 86400000;
const now = new Date('2026-09-29T00:00:00Z').getTime();

describe('shouldShowInstallPrompt', () => {
  it('tampil kalau belum pernah di-dismiss', () => {
    expect(shouldShowInstallPrompt(null, now)).toBe(true);
  });

  it('tersembunyi kalau di-dismiss kemarin', () => {
    expect(shouldShowInstallPrompt(now - DAY, now)).toBe(false);
  });

  it('tersembunyi tepat sebelum 30 hari', () => {
    expect(shouldShowInstallPrompt(now - (INSTALL_DISMISS_DAYS * DAY - 1), now)).toBe(false);
  });

  it('tampil lagi setelah 30 hari', () => {
    expect(shouldShowInstallPrompt(now - INSTALL_DISMISS_DAYS * DAY, now)).toBe(true);
  });

  it('nilai rusak (NaN) dianggap belum pernah di-dismiss', () => {
    expect(shouldShowInstallPrompt(NaN, now)).toBe(true);
  });
});
