import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { login, clearSession } from './helpers/auth';

dotenv.config({ path: '.env.test' });

function getTestUserId(): string {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests', '.test-env.json'), 'utf-8'));
  return data.userId;
}

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('Daily Quest Management', () => {
  const createdQuestIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/quests/daily-quests', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (createdQuestIds.length > 0) {
      const supabase = getServiceRoleClient();
      await supabase.from('tasks').delete().in('id', createdQuestIds);
      createdQuestIds.length = 0;
    }
  });

  test('can create a new daily quest', async ({ page }) => {
    const testTitle = `E2E Test Quest ${Date.now()}`;

    // Klik "Add Task" dulu untuk munculkan form
    await page.locator('[data-testid="daily-quest-add-btn"]').click();
    await expect(page.locator('[data-testid="daily-quest-new-title-input"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="daily-quest-new-title-input"]').fill(testTitle);
    await page.locator('[data-testid="daily-quest-submit-btn"]').click();

    // Quest baru harus muncul di list
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 15000 });

    // Catat ID untuk cleanup — ambil dari data-testid
    const questRow = page.locator(`[data-testid^="daily-quest-item-"]`).filter({ hasText: testTitle });
    const testId = await questRow.getAttribute('data-testid');
    if (testId) {
      const questId = testId.replace('daily-quest-item-', '');
      createdQuestIds.push(questId);
    }
  });

  test('can delete a quest', async ({ page }) => {
    // Buat quest dulu via Supabase langsung untuk isolation
    const supabase = getServiceRoleClient();
    const userId = getTestUserId();
    const { data } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: `E2E Delete Test ${Date.now()}`,
        type: 'DAILY_QUEST',
        status: 'TODO',
        focus_duration: 25,
        milestone_id: null,
      })
      .select()
      .single();

    if (!data) throw new Error('Failed to create test quest');

    // Reload untuk tampilkan quest baru
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const deleteBtn = page.locator(`[data-testid="daily-quest-delete-${data.id}"]`);
    await expect(deleteBtn).toBeVisible({ timeout: 15000 });
    await deleteBtn.click();

    // Tunggu confirm dialog dan konfirmasi
    const confirmBtn = page.locator('button', { hasText: /hapus|delete|confirm/i }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    // Quest harus hilang dari list
    await expect(page.locator(`[data-testid="daily-quest-item-${data.id}"]`)).not.toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Work Quest Management', () => {
  const createdProjectIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page);
    await page.goto('/quests/work-quests', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (createdProjectIds.length > 0) {
      const supabase = getServiceRoleClient();
      await supabase.from('work_quests').delete().in('id', createdProjectIds);
      createdProjectIds.length = 0;
    }
  });

  test('can create a new project', async ({ page }) => {
    const testTitle = `E2E Project ${Date.now()}`;

    // Cari dan klik "Add Project" button
    await page.locator('button', { hasText: /add project|tambah project/i }).click();

    await expect(page.locator('[data-testid="project-form-title"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="project-form-title"]').fill(testTitle);
    await page.locator('[data-testid="project-form-submit"]').click();

    // Project baru harus muncul
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 15000 });
  });
});
