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

  test('renders all navigation cards', async ({ page }) => {
    const cards = page.locator('[data-testid^="dashboard-card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBe(11);
  });

  test('card navigates to its route', async ({ page }) => {
    await page.locator('[data-testid="dashboard-card-execution-daily-sync"]').click();
    await page.waitForURL(/\/execution\/daily-sync/, { timeout: 45000 });
    expect(page.url()).toContain('/execution/daily-sync');
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
