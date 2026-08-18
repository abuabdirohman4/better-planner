import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Activity Plan — view switching', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
    await page.goto('/execution/daily-sync', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('Calendar / List / Quest buttons toggle aria-pressed', async ({ page }) => {
    const sw = page.locator('[data-testid="activity-view-switch"]').filter({ visible: true }).first();
    await expect(sw).toBeVisible({ timeout: 15000 });

    const cal = sw.locator('[data-testid="activity-view-calendar"]');
    const list = sw.locator('[data-testid="activity-view-list"]');
    const quest = sw.locator('[data-testid="activity-view-quest"]');

    await expect(cal).toHaveAttribute('aria-pressed', 'true');

    await list.click();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await expect(cal).toHaveAttribute('aria-pressed', 'false');

    await quest.click();
    await expect(quest).toHaveAttribute('aria-pressed', 'true');
    await expect(list).toHaveAttribute('aria-pressed', 'false');

    await cal.click();
    await expect(cal).toHaveAttribute('aria-pressed', 'true');
  });
});
