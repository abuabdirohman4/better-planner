import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
    await page.goto('/execution/daily-sync', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('timer display is visible', async ({ page }) => {
    // Timer dirender 2x (mobile + desktop). Cari yang visible (desktop layout).
    await expect(page.locator('[data-testid="timer-display"]').filter({ visible: true })).toBeVisible({ timeout: 15000 });
  });

  test('timer shows idle state on load', async ({ page }) => {
    const timerDisplay = page.locator('[data-testid="timer-display"]').filter({ visible: true });
    await expect(timerDisplay).toBeVisible({ timeout: 15000 });

    // Timer menampilkan waktu dalam format mm:ss
    const displayText = await timerDisplay.textContent();
    expect(displayText).toMatch(/\d{2}:\d{2}/);
  });

  test('start button is visible and clickable', async ({ page }) => {
    // Timer dirender 2x (mobile + desktop). Cari yang visible.
    const actionBtn = page.locator('[data-testid="timer-action-btn"]').filter({ visible: true });
    await expect(actionBtn).toBeVisible({ timeout: 15000 });
  });
});
