import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AICharacter, AIInsight } from '../types'
import type { PerformanceMetrics } from './performanceAggregation'

const CHARACTER_PROMPTS: Record<AICharacter, string> = {
  MOTIVATIONAL_COACH: `You are an enthusiastic motivational coach. Use exclamation marks, imperatives, and phrases like "You can do this!" Keep it short and energized. Output strictly a JSON object matching the required schema.`,
  ANALYTICAL_ADVISOR: `You are a data-driven analytical advisor. Cite percentages, bullet reasoning, and stay logical and calm. Output strictly a JSON object matching the required schema.`,
  BALANCED_MENTOR: `You are a warm, balanced mentor. Acknowledge effort while gently pointing out room for growth. Output strictly a JSON object matching the required schema.`,
  FRIENDLY_BUDDY: `You are a casual, supportive friend. Use informal language, "hey!", and minimal emojis. Output strictly a JSON object matching the required schema.`,
}

const CHARACTER_NAMES: Record<AICharacter, string> = {
  MOTIVATIONAL_COACH: 'Coach Alex',
  ANALYTICAL_ADVISOR: 'Advisor Sam',
  BALANCED_MENTOR: 'Mentor Jordan',
  FRIENDLY_BUDDY: 'Buddy Riley',
}

const FALLBACK_INSIGHT: AIInsight = {
  headline: 'Keep up the great work!',
  narrative: 'You made progress today. Every step counts toward your goals.',
  topWin: 'You showed up and did the work.',
  challengeSpotted: 'Consistency is the key to long-term success.',
  actionTip: 'Plan your top 3 priorities for tomorrow.',
  motivationalClose: 'See you tomorrow!',
  characterName: 'Better Planner',
}

function buildUserPrompt(
  metrics: PerformanceMetrics,
  periodType: string,
  userName: string
): string {
  return `
Analyze user performance for a ${periodType} period. User's name is ${userName}.
Metrics provided as JSON object:
${JSON.stringify(metrics, null, 2)}

Produce a JSON object observing this schema:
{
  "headline": "<string, short catchy headline>",
  "narrative": "<string, 2-3 sentences explaining their performance>",
  "topWin": "<string, 1 short sentence on their best achievement based on data>",
  "challengeSpotted": "<string, 1 short sentence on what they could improve>",
  "actionTip": "<string, 1 actionable specific tip>",
  "motivationalClose": "<string, short sign-off phrase>"
}
No markdown wrappers around JSON, just the raw JSON object.
  `
}

function parseGeminiResponse(raw: string, character: AICharacter): AIInsight {
  try {
    const rawJson = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(rawJson)
    return {
      headline: parsed.headline || FALLBACK_INSIGHT.headline,
      narrative: parsed.narrative || FALLBACK_INSIGHT.narrative,
      topWin: parsed.topWin || FALLBACK_INSIGHT.topWin,
      challengeSpotted: parsed.challengeSpotted || FALLBACK_INSIGHT.challengeSpotted,
      actionTip: parsed.actionTip || FALLBACK_INSIGHT.actionTip,
      motivationalClose: parsed.motivationalClose || FALLBACK_INSIGHT.motivationalClose,
      characterName: CHARACTER_NAMES[character],
    }
  } catch (err) {
    console.error('[aiInsightService] Failed to parse JSON from Gemini:', err, 'Raw text:', raw)
    return { ...FALLBACK_INSIGHT, characterName: CHARACTER_NAMES[character] }
  }
}

export async function generateInsight(
  metrics: PerformanceMetrics,
  character: AICharacter,
  userName: string
): Promise<AIInsight> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: CHARACTER_PROMPTS[character],
    })
    const result = await model.generateContent(buildUserPrompt(metrics, metrics.periodType, userName))
    return parseGeminiResponse(result.response.text(), character)
  } catch (error) {
    console.error('[aiInsightService] Gemini error:', error)
    return { ...FALLBACK_INSIGHT, characterName: CHARACTER_NAMES[character] }
  }
}
