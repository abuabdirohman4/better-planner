// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const generateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent }),
  })),
}));

import { generateInsight } from '../services/aiInsightService';
import type { PerformanceMetrics } from '../services/performanceAggregation';

const metrics = {
  periodType: 'daily', periodStart: '2026-08-17', periodEnd: '2026-08-17',
  totalFocusMinutes: 50, totalSessions: 2, tasksCompleted: 1, tasksTotal: 3, completionRate: 33,
} as unknown as PerformanceMetrics;
const ENV = { ...process.env };

describe('generateInsight', () => {
  beforeEach(() => { generateContent.mockReset(); delete process.env.GEMINI_API_KEY; });
  afterEach(() => { process.env = { ...ENV }; });

  it('returns persona-named fallback without network when no API key', async () => {
    const r = await generateInsight(metrics, 'FRIENDLY_BUDDY', 'Abu');
    expect(generateContent).not.toHaveBeenCalled();
    expect(r.characterName).toBe('Buddy Riley');
    expect(r.headline).toBeTruthy();
  });

  it('parses Gemini JSON (with code fences) when key present', async () => {
    process.env.GEMINI_API_KEY = 'k';
    generateContent.mockResolvedValue({ response: { text: () => '```json\n{"headline":"Mantap!","narrative":"n","topWin":"t","challengeSpotted":"c","actionTip":"a","motivationalClose":"m"}\n```' } });
    const r = await generateInsight(metrics, 'MOTIVATIONAL_COACH', 'Abu', 'en');
    expect(r.headline).toBe('Mantap!');
    expect(r.characterName).toBe('Coach Alex');
  });

  it('falls back on Gemini error', async () => {
    process.env.GEMINI_API_KEY = 'k';
    generateContent.mockRejectedValue(new Error('quota'));
    const r = await generateInsight(metrics, 'ANALYTICAL_ADVISOR', 'Abu');
    expect(r.characterName).toBe('Advisor Sam');
    expect(r.narrative).toBeTruthy();
  });

  /**
   * Regression: task names never reached the prompt. The block was gated on
   * totalSessions > 0, and active tasks were read only from mainQuestProgress —
   * so plans with no MAIN_QUEST item (all WORK/SIDE/DAILY) always said "none".
   */
  describe('task context in prompt', () => {
    const promptFor = async (over: Partial<PerformanceMetrics>) => {
      process.env.GEMINI_API_KEY = 'k';
      generateContent.mockResolvedValue({ response: { text: () => '{}' } });
      await generateInsight({ ...metrics, ...over } as PerformanceMetrics, 'BALANCED_MENTOR', 'Abu', 'id');
      return String(generateContent.mock.calls.at(-1)?.[0]);
    };

    it('names completed tasks even with zero focus sessions', async () => {
      const prompt = await promptFor({
        totalSessions: 0,
        topCompletedTasks: [{ title: 'Meeting with Owncrave', questName: 'Owncrave' }],
      } as unknown as Partial<PerformanceMetrics>);
      expect(prompt).toContain('Meeting with Owncrave');
    });

    it('names active tasks when there is no MAIN_QUEST', async () => {
      const prompt = await promptFor({
        mainQuestProgress: undefined,
        activeTasks: [{ title: 'Pick Up new Item', questName: 'Work' }],
      } as unknown as Partial<PerformanceMetrics>);
      expect(prompt).toContain('Pick Up new Item');
    });

    it('tells the model not to greet (template already does)', async () => {
      const prompt = await promptFor({});
      expect(prompt).toMatch(/JANGAN menyapa/);
    });

    it('frames the period as past, never "hari ini"', async () => {
      const prompt = await promptFor({});
      expect(prompt).toMatch(/jangan pernah tulis "hari ini"/i);
      expect(prompt).not.toContain('Tugas yang diselesaikan hari ini');
    });

    it('tells the model which period already ended', async () => {
      process.env.GEMINI_API_KEY = 'k';
      generateContent.mockResolvedValue({ response: { text: () => '{}' } });
      await generateInsight(metrics, 'BALANCED_MENTOR', 'Abu', 'id', undefined, 0, 'Selasa, 18 Agustus 2026');
      const prompt = String(generateContent.mock.calls.at(-1)?.[0]);
      expect(prompt).toContain('Selasa, 18 Agustus 2026');
      expect(prompt).toContain('already ended');
    });

    it('labels quest type in words and omits an empty quest name', async () => {
      const prompt = await promptFor({
        topCompletedTasks: [
          { title: 'Meeting with Owncrave', questName: '', type: 'SIDE_QUEST' },
          { title: 'issue #92 - #95', questName: 'Codex Security Scan', type: 'WORK_QUEST' },
        ],
      } as unknown as Partial<PerformanceMetrics>);
      expect(prompt).toContain('"Meeting with Owncrave" (Side Quest)');
      expect(prompt).toContain('"issue #92 - #95" (Work Quest · Codex Security Scan)');
      expect(prompt).not.toContain('WORK_QUEST');
      expect(prompt).not.toMatch(/\(\s*·/); // no dangling separator
    });
  });
});
