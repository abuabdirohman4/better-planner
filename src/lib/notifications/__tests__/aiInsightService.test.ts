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
});
