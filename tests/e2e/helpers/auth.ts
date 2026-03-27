import { Page, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.test' });

// Load userId yang di-write oleh global-setup
export function getTestUserId(): string {
  const testEnvPath = path.join(process.cwd(), 'tests', '.test-env.json');
  const data = JSON.parse(fs.readFileSync(testEnvPath, 'utf-8'));
  return data.userId;
}

// Login dengan email/password — SELALU sequential, JANGAN Promise.all
export async function login(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  // Sequential steps — Supabase auth tidak bisa di-parallel
  await page.goto('/signin');
  await page.waitForLoadState('domcontentloaded'); // JANGAN 'networkidle' — Supabase cloud hang
  await expect(page.locator('[data-testid="signin-email"]')).toBeVisible({ timeout: 15000 });

  await page.locator('[data-testid="signin-email"]').fill(email);
  await page.locator('[data-testid="signin-password"]').fill(password);
  await page.locator('[data-testid="signin-submit"]').click();

  // Login action redirect ke '/', middleware redirect ke '/dashboard'
  // Tunggu sampai URL bukan /signin — middleware akan handle redirect ke /dashboard
  await page.waitForURL((url) => !url.pathname.startsWith('/signin'), { timeout: 45000 });
  // Jika masih di '/', navigasi manual ke dashboard (middleware kadang butuh request baru)
  if (page.url().endsWith('/') || page.url() === 'http://localhost:3000') {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  }
}

// Clear cookies dan permissions sebelum setiap test
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}

const UI_PREFERENCES = JSON.stringify({
  state: {
    showCompletedMainQuest: true,
    showCompletedSideQuest: true,
    showCompletedWorkQuest: true,
    showCompletedDailyQuest: true,
    showAllTasksAutomatically: false,
    cardCollapsed: {
      pomodoroTimer: false,
      mainQuest: false,
      sideQuest: false,
      workQuest: false,
      dailyQuest: false,
      activityLog: false,
      brainDump: false,
      bestWeekRef: false,
    },
  },
  version: 0,
});

// Set localStorage state directly on a loaded page (after navigation)
export async function setPageLocalStorage(page: Page, year: number, quarter: number): Promise<void> {
  await page.evaluate(
    ({ y, q, uiPrefs }) => {
      localStorage.setItem(
        'quarter-storage',
        JSON.stringify({ state: { year: y, quarter: q }, version: 0 })
      );
      localStorage.setItem('ui-preferences-storage', uiPrefs);
    },
    { y: year, q: quarter, uiPrefs: UI_PREFERENCES }
  );
}

// Inject Zustand quarterStore ke localStorage SEBELUM navigasi ke daily-sync
// Diperlukan karena default store = Q1, tapi hari ini mungkin bukan Q1
// Juga inject ui-preferences-storage agar semua cards expanded (tidak collapsed)
export async function injectQuarterState(
  page: Page,
  year: number,
  quarter: number
): Promise<void> {
  await page.addInitScript(
    ({ y, q, uiPrefs }) => {
      // Clear stale quarter/UI state from previous tests
      localStorage.removeItem('quarter-storage');
      localStorage.removeItem('ui-preferences-storage');
      localStorage.setItem(
        'quarter-storage',
        JSON.stringify({ state: { year: y, quarter: q }, version: 0 })
      );
      // Pastikan semua CollapsibleCard tidak collapsed saat test
      localStorage.setItem('ui-preferences-storage', uiPrefs);
    },
    { y: year, q: quarter, uiPrefs: UI_PREFERENCES }
  );
}

// Helper: hitung quarter berdasarkan tanggal hari ini
// Menggunakan logika yang sama dengan getWeekOfYear di src/lib/quarterUtils.ts
export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const year = now.getFullYear();

  // Gunakan logika planning year (sama dengan quarterUtils.ts)
  // Planning year start = Monday of the week containing Jan 1
  const getPlanningYearStartDate = (y: number): Date => {
    const janFirst = new Date(y, 0, 1);
    const dayOfWeekJan1 = janFirst.getDay();
    const daysToSubtract = dayOfWeekJan1 === 0 ? 6 : dayOfWeekJan1 - 1;
    const start = new Date(janFirst);
    start.setDate(janFirst.getDate() - daysToSubtract);
    return start;
  };

  const currentYearStart = getPlanningYearStartDate(year);
  const nextYearStart = getPlanningYearStartDate(year + 1);

  let planningYearStartDate = currentYearStart;
  let planningYear = year;
  if (now >= nextYearStart) {
    planningYear = year + 1;
    planningYearStartDate = nextYearStart;
  }

  // Integer days (floor) to avoid floating-point week boundary issues
  const diffInDays = Math.floor(
    (now.getTime() - planningYearStartDate.getTime()) / 86400000
  );
  const weekNumber = Math.floor(diffInDays / 7) + 1;

  const quarter = weekNumber <= 13 ? 1 : weekNumber <= 26 ? 2 : weekNumber <= 39 ? 3 : 4;
  return { year: planningYear, quarter };
}
