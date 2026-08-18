import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { login, clearSession, injectQuarterState, getCurrentQuarter } from './helpers/auth';
import { getServiceRoleClient, getTestUserId, cleanupIds } from './helpers/db';

dotenv.config({ path: '.env.test' });

test.describe.configure({ mode: 'serial' });

test.describe('Work Quest — task CRUD inside a project', () => {
  const created: string[] = [];
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    const { data, error } = await getServiceRoleClient()
      .from('tasks')
      .insert({ user_id: getTestUserId(), title: `E2E Project ${Date.now()}`, type: 'WORK_QUEST', status: 'TODO', parent_task_id: null, milestone_id: null })
      .select('id')
      .single();
    if (error || !data) throw new Error(`seed failed: ${error?.message}`);
    projectId = data.id;
    created.push(projectId);

    await clearSession(page);
    const { year, quarter } = getCurrentQuarter();
    await injectQuarterState(page, year, quarter);
    await login(page);
    await page.goto('/quests/work-quests', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    // Child tasks cascade? Be explicit: delete children first.
    await getServiceRoleClient().from('tasks').delete().eq('parent_task_id', projectId);
    await cleanupIds('tasks', created);
  });

  test('can add, edit, then delete a task in a project', async ({ page }) => {
    await expect(page.locator(`[data-testid="project-item-${projectId}"]`)).toBeVisible({ timeout: 15000 });
    await page.locator(`[data-testid="project-toggle-${projectId}"]`).click();

    // Add
    await page.locator(`[data-testid="project-add-task-${projectId}"]`).click();
    const title = `E2E Task ${Date.now()}`;
    const input = page.locator('[data-testid="task-form-input"]');
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill(title);
    await page.locator('[data-testid="task-form-save"]').click();
    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 15000 });

    const { data: task } = await getServiceRoleClient()
      .from('tasks').select('id').eq('parent_task_id', projectId).eq('title', title).single();
    expect(task?.id).toBeTruthy();
    const taskId = task!.id;

    // Edit
    const row = page.locator(`[data-testid="task-item-${taskId}"]`);
    await row.hover();
    await page.locator(`[data-testid="task-edit-${taskId}"]`).click();
    const edited = `${title} edited`;
    await page.locator('[data-testid="task-form-input"]').fill(edited);
    await page.locator('[data-testid="task-form-save"]').click();
    await expect(page.locator(`[data-testid="task-item-${taskId}"]`)).toContainText(edited, { timeout: 15000 });

    // Delete (window.confirm)
    page.once('dialog', (d) => d.accept());
    await row.hover();
    await page.locator(`[data-testid="task-delete-${taskId}"]`).click();
    await expect(page.locator(`[data-testid="task-item-${taskId}"]`)).toBeHidden({ timeout: 15000 });
  });
});
