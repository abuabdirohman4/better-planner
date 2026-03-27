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
      page.locator('[data-testid="daily-sync-daily-quest-section"]')
    ).toBeVisible({ timeout: 15000 });
  });

  test('daily sync page loads with quest sections visible', async ({ page }) => {
    await expect(
      page.locator('[data-testid="daily-sync-daily-quest-section"]')
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('[data-testid="daily-sync-work-quest-section"]')
    ).toBeVisible({ timeout: 15000 });
  });

  test('task status can be toggled', async ({ page }) => {
    // Global-setup seeds [E2E] Test Daily Quest task linked to today's daily plan
    // The seeded task should appear because localStorage is set to current quarter/week

    const taskToggles = page.locator('[data-testid^="task-status-"]');
    await expect(taskToggles.first()).toBeVisible({ timeout: 15000 });

    const firstToggle = taskToggles.first();
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
