import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders greeting, habit summary and no old cards', async ({ page }) => {
    await expect(page.getByTestId('dashboard-greeting')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('dashboard-greeting')).toContainText('Selamat');
    await expect(page.getByTestId('dashboard-habit-summary')).toBeVisible();
    // Kartu jam HFG, energi, dan quick action dihapus (app-m8li, app-4d2x).
    expect(await page.locator('[data-testid="dashboard-hfg-weekly"], [data-testid^="dashboard-card-"]').count()).toBe(0);
  });

  test('quarter selector prev/next changes label', async ({ page }) => {
    const toggle = page.locator('[data-testid="quarter-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 15000 });
    const initial = await toggle.textContent();

    await page.locator('[data-testid="quarter-prev"]').click();
    await expect(toggle).not.toHaveText(initial ?? '', { timeout: 10000 });

    await page.locator('[data-testid="quarter-next"]').click();
    await expect(toggle).toHaveText(initial ?? '', { timeout: 10000 });
  });
});
