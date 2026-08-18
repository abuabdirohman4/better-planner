import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession } from './helpers/auth';
import { getServiceRoleClient, getTestUserId } from './helpers/db';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Best Week — template + grid block CRUD', () => {
  const templateName = `E2E Template ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/planning/best-week', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    const supabase = getServiceRoleClient();
    const { data } = await supabase.from('best_week_templates').select('id').eq('user_id', getTestUserId()).eq('name', templateName);
    const ids = (data ?? []).map((t) => t.id);
    if (ids.length) {
      await supabase.from('best_week_blocks').delete().in('template_id', ids);
      await supabase.from('best_week_templates').delete().in('id', ids);
    }
  });

  test('can create a template and make it active', async ({ page }) => {
    // Empty state → create first; otherwise open selector
    const createFirst = page.locator('[data-testid="best-week-create-first"]');
    if (await createFirst.isVisible().catch(() => false)) {
      await createFirst.click();
    }
    const toggle = page.locator('[data-testid="template-selector-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await toggle.click();
    await page.locator('[data-testid="template-new-btn"]').click();
    await page.locator('[data-testid="template-new-input"]').fill(templateName);
    await page.locator('[data-testid="template-new-ok"]').click();

    // Pilih template baru dari list
    await expect(page.locator('[data-testid^="template-item-"]').filter({ hasText: templateName })).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid^="template-item-"]').filter({ hasText: templateName }).click();
    await expect(toggle).toContainText(templateName, { timeout: 15000 });
  });

  test('can add a block via grid slot, edit, then delete it', async ({ page }) => {
    // Pastikan template E2E aktif
    const toggle = page.locator('[data-testid="template-selector-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 15000 });
    if (!(await toggle.textContent())?.includes(templateName)) {
      await toggle.click();
      await page.locator('[data-testid^="template-item-"]').filter({ hasText: templateName }).click();
      await expect(toggle).toContainText(templateName, { timeout: 15000 });
    }

    // Klik slot Senin jam ~08:00 (index 16 kalau slot 30 menit) → BlockModal
    const slot = page.locator('[data-testid^="grid-slot-0-"]').nth(16);
    await slot.click();
    const titleInput = page.locator('[data-testid="block-modal-title"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    const blockTitle = `E2E Block ${Date.now()}`;
    await titleInput.fill(blockTitle);
    await page.locator('[data-testid="block-modal-save"]').click();

    const block = page.locator('[data-testid^="grid-block-"]').filter({ hasText: blockTitle });
    await expect(block).toBeVisible({ timeout: 15000 });

    // Edit
    await block.click();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill(`${blockTitle} edited`);
    await page.locator('[data-testid="block-modal-save"]').click();
    await expect(page.locator('[data-testid^="grid-block-"]').filter({ hasText: `${blockTitle} edited` })).toBeVisible({ timeout: 15000 });

    // Delete (window.confirm)
    await page.locator('[data-testid^="grid-block-"]').filter({ hasText: `${blockTitle} edited` }).click();
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-testid="block-modal-delete"]').click();
    await expect(page.locator('[data-testid^="grid-block-"]').filter({ hasText: blockTitle })).toBeHidden({ timeout: 15000 });
  });
});
