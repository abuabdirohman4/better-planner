import { test, expect } from '@playwright/test';
import { clearSession } from './helpers/auth';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => { await clearSession(page); });

  test('hero Indonesia + CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Target besarmu masih di tempat');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'id_ID');
    await expect(page.getByRole('link', { name: 'Coba gratis' }).first()).toHaveAttribute('href', '/signup');
    await expect(page.getByRole('link', { name: 'Masuk' }).first()).toHaveAttribute('href', '/signin');
  });

  test('tanpa scroll samping di 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(390);
  });
});
