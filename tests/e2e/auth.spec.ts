import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('shows sign-in form at /signin', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="signin-password"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="signin-submit"]')).toBeVisible({ timeout: 15000 });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="signin-email"]').fill('wrong@example.com');
    await page.locator('[data-testid="signin-password"]').fill('wrongpassword');
    await page.locator('[data-testid="signin-submit"]').click();

    // Error redirect ke /signin?message=...
    await page.waitForURL('**/signin**', { timeout: 30000 });
    await expect(page.locator('[data-testid="signin-message"]')).toBeVisible({ timeout: 15000 });
  });

  test('successful login redirects away from /signin', async ({ page }) => {
    await login(page);
    // Setelah login, user tidak boleh ada di /signin
    expect(page.url()).not.toContain('/signin');
  });

  test('unauthenticated user redirected from /execution/daily-sync to /signin', async ({ page }) => {
    await page.goto('/execution/daily-sync');
    // Middleware redirect unauthenticated → /signin
    await page.waitForURL('**/signin**', { timeout: 30000 });
    await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });
  });
});
