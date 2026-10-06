import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, setPageLocalStorage, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Daily Sync', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);

    // Inject quarter state via initScript (runs before each page load)
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);

    await login(page);

    // Set localStorage directly after login (before daily-sync navigation)
    // This overrides any stale localStorage from previous tests
    await setPageLocalStorage(page, year, quarter);

    await page.goto('/execution/daily-sync');
    await page.waitForLoadState('domcontentloaded');

    // Tunggu skeleton hilang — DailySyncClient render setelah SWR fetch
    await expect(
      page.locator('[data-testid="daily-sync-focus-section"]')
    ).toBeVisible({ timeout: 15000 });
  });

  // app-70vs: Daily Focus → Tugas Lain → Daily Ritual
  test('daily sync page loads with focus, other and ritual sections visible', async ({ page }) => {
    for (const id of ['daily-sync-focus-section', 'daily-sync-other-section', 'daily-sync-ritual-section']) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({ timeout: 15000 });
    }
  });

  test('task status can be toggled', async ({ page }) => {
    // Global-setup seeds [E2E] Test Daily Quest task linked to today's daily plan
    // The seeded task should appear because localStorage is set to current quarter/week

    // Hanya task uji: test user = akun nyata, jadi jangan sentuh task lain di halaman.
    const seeded = page.locator('[data-testid^="task-card-"]', { hasText: '[E2E] Test Daily Quest' });
    const firstToggle = seeded.locator('[data-testid^="task-status-"]').first();
    await expect(firstToggle).toBeVisible({ timeout: 15000 });
    // Get current visual state before clicking
    const initialClass = await firstToggle.getAttribute('class');
    await firstToggle.click();

    // Tunggu sebentar untuk optimistic update
    await page.waitForTimeout(500);

    // State button harus berubah (class akan berbeda setelah toggle)
    const newClass = await firstToggle.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });
});
