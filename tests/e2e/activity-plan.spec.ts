import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe('Timeline Harian (app-6god)', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
    await page.goto('/execution/daily-sync', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('baris jam 04:00-22:00 tampil, tanpa toggle tampilan', async ({ page }) => {
    const timeline = page.getByTestId('hourly-timeline').filter({ visible: true }).first();
    await expect(timeline).toBeVisible({ timeout: 15000 });
    await expect(timeline.getByTestId('hour-row-4')).toBeVisible();
    await expect(timeline.getByTestId('hour-row-22')).toBeVisible();
    await expect(page.locator('[data-testid="activity-view-switch"]')).toHaveCount(0);
  });
});
