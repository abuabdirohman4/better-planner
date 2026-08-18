import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

// Timer interaction requires NEXT_PUBLIC_ENABLE_TIMER_DEV=true in .env.local
const TIMER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TIMER_DEV === 'true';
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
    expect(await timerDisplay.textContent()).toMatch(/\d{2}:\d{2}/);
  });

  test('start → pause → stop flow updates timer state', async ({ page }) => {
    test.skip(!TIMER_ENABLED, 'NEXT_PUBLIC_ENABLE_TIMER_DEV != true');
    // Pilih quest yang di-seed global-setup ([E2E] Test Daily Quest) → play button
    const playBtn = page.locator('[data-testid^="task-play-"]').filter({ visible: true }).first();
    await expect(playBtn).toBeVisible({ timeout: 15000 });
    await playBtn.click();

    const display = page.locator('[data-testid="timer-display"]').filter({ visible: true });
    const actionBtn = page.locator('[data-testid="timer-action-btn"]').filter({ visible: true });
    await expect(actionBtn).toBeVisible({ timeout: 15000 });

    // Timer idle di target (25:00) → klik = start; setelah 2 detik display berubah
    const before = await display.textContent();
    await actionBtn.click();
    await page.waitForTimeout(2500);
    const running = await display.textContent();
    expect(running).not.toBe(before);

    // Stop button muncul saat FOCUSING/PAUSED
    const stopBtn = page.locator('[data-testid="timer-stop-btn"]').filter({ visible: true });
    await expect(stopBtn).toBeVisible({ timeout: 10000 });

    // Pause: display berhenti berubah
    await actionBtn.click();
    const paused = await display.textContent();
    await page.waitForTimeout(2000);
    expect(await display.textContent()).toBe(paused);

    // Stop → sesi selesai → break prompt atau journal modal bisa muncul; stop button hilang
    await stopBtn.click();
    await expect(stopBtn).toBeHidden({ timeout: 15000 });

    // Tutup overlay bila muncul (skip break) supaya state bersih untuk test berikut
    const skipBreak = page.locator('[data-testid="break-skip-btn"]');
    if (await skipBreak.isVisible().catch(() => false)) await skipBreak.click();
  });
});
