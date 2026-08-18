import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';
import { getServiceRoleClient, getTestUserId, cleanupIds } from './helpers/db';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Side Quest Management', () => {
  const created: string[] = [];

  async function seedSideQuest(title: string): Promise<string> {
    const { data, error } = await getServiceRoleClient()
      .from('tasks')
      .insert({ user_id: getTestUserId(), title, type: 'SIDE_QUEST', status: 'TODO', milestone_id: null })
      .select('id')
      .single();
    if (error || !data) throw new Error(`seed failed: ${error?.message}`);
    created.push(data.id);
    return data.id;
  }

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
  });

  test.afterEach(async () => { await cleanupIds('tasks', created); });

  test('can toggle status via checkbox', async ({ page }) => {
    const id = await seedSideQuest(`E2E Side Toggle ${Date.now()}`);
    await page.goto('/quests/side-quests', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    const cb = page.locator(`[data-testid="side-quest-status-${id}"]`);
    await expect(cb).toBeVisible({ timeout: 15000 });
    await cb.click();

    // Default list hides DONE items → row disappears; persisted status = DONE
    await expect(page.locator(`[data-testid="side-quest-item-${id}"]`)).toBeHidden({ timeout: 15000 });
    await expect.poll(async () => {
      const { data } = await getServiceRoleClient().from('tasks').select('status').eq('id', id).single();
      return data?.status;
    }, { timeout: 15000 }).toBe('DONE');

    // Show completed → row kembali dengan checkbox checked
    await page.locator('[data-testid="side-quest-toggle-completed"]').click();
    await expect(page.locator(`[data-testid="side-quest-status-${id}"]`)).toBeChecked({ timeout: 15000 });
  });

  test('can edit title inline', async ({ page }) => {
    const id = await seedSideQuest(`E2E Side Edit ${Date.now()}`);
    await page.goto('/quests/side-quests', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    const row = page.locator(`[data-testid="side-quest-item-${id}"]`);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.hover();
    await page.locator(`[data-testid="side-quest-edit-${id}"]`).click();

    const input = page.locator('[data-testid="side-quest-edit-input"]');
    await expect(input).toBeVisible({ timeout: 10000 });
    const newTitle = `E2E Side Edited ${Date.now()}`;
    await input.fill(newTitle);
    await page.locator('[data-testid="side-quest-save-btn"]').click();

    await expect(page.locator(`[data-testid="side-quest-item-${id}"]`)).toContainText(newTitle, { timeout: 15000 });
  });

  test('can delete via confirm modal', async ({ page }) => {
    const id = await seedSideQuest(`E2E Side Delete ${Date.now()}`);
    await page.goto('/quests/side-quests', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    const row = page.locator(`[data-testid="side-quest-item-${id}"]`);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.hover();
    await page.locator(`[data-testid="side-quest-delete-${id}"]`).click();
    await page.locator('[data-testid="confirm-modal-confirm"]').click();

    await expect(row).toBeHidden({ timeout: 15000 });
    created.length = 0; // already deleted
  });
});
