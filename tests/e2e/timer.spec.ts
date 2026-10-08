import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

// Timer interaction requires NEXT_PUBLIC_ENABLE_TIMER_DEV=true in .env.local
const TIMER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TIMER_DEV === 'true';
test.describe.configure({ mode: 'serial' });

test.describe('Siklus Kerja timer', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
    await page.goto('/execution/daily-sync', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('siklus kerja tampil dengan slot', async ({ page }) => {
    await expect(page.getByTestId('daily-sync-work-cycles')).toBeVisible({ timeout: 15000 });
  });

  test('baris 25/5 -> pilih task [E2E] -> jeda -> stop (app-mgsb)', async ({ page }) => {
    test.skip(!TIMER_ENABLED, 'NEXT_PUBLIC_ENABLE_TIMER_DEV != true');
    // Hanya task [E2E] dari global-setup (Daily Quest di Tugas Lain) — akun e2e = akun asli Abu.
    await page.getByTestId('cycle-add-25').click();
    const select = page.locator('[data-testid^="cycle-row-select-"]').last();
    const value = await select.locator('option', { hasText: '[E2E] Test Daily Quest' }).first().getAttribute('value');
    await select.selectOption(value!);
    await page.locator('[data-testid^="cycle-row-play-"]').last().click();

    const runner = page.getByTestId('cycle-runner');
    await expect(runner).toBeVisible({ timeout: 15000 });
    const clock = runner.locator('.text-4xl');
    const first = await clock.textContent();
    await page.waitForTimeout(2500);
    expect(await clock.textContent()).not.toBe(first);

    await page.getByTestId('cycle-pause').click();
    const paused = await clock.textContent();
    await page.waitForTimeout(2000);
    expect(await clock.textContent()).toBe(paused);

    await page.getByTestId('cycle-stop').click();
    await expect(runner).toBeHidden({ timeout: 15000 });
    // Baris tambahan dibuang lagi supaya rencana siklus akun asli tidak berubah.
    await page.getByRole('button', { name: 'Hapus baris siklus' }).last().click();
  });
});
