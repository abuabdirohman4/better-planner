import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AICharacter, AIInsight, EmailLanguage } from '../types'
import type { PerformanceMetrics } from './performanceAggregation'

const CHARACTER_PROMPTS: Record<AICharacter, Record<EmailLanguage, string>> = {
  MOTIVATIONAL_COACH: {
    id: `Kamu adalah coach motivasi yang antusias. Gunakan tanda seru, kalimat imperatif, dan frasa seperti "Kamu pasti bisa!" Tetap singkat dan penuh semangat. Tujuanmu adalah membuat user tetap konsisten dan bersemangat mencapai target mereka. Output harus berupa JSON object sesuai schema yang diminta.`,
    en: `You are an enthusiastic motivational coach. Use exclamation marks, imperatives, and phrases like "You can do this!" Keep it short and energized. Your goal is to keep the user consistent and excited about reaching their goals. Output strictly a JSON object matching the required schema.`,
  },
  ANALYTICAL_ADVISOR: {
    id: `Kamu adalah advisor analitis berbasis data. Gunakan persentase, penalaran logis, dan tetap tenang namun mendorong konsistensi. Tujuanmu adalah membuat user tetap semangat dengan data yang jelas. Output harus berupa JSON object sesuai schema yang diminta.`,
    en: `You are a data-driven analytical advisor. Cite percentages, bullet reasoning, and stay logical and calm while encouraging consistency. Your goal is to keep the user motivated with clear data. Output strictly a JSON object matching the required schema.`,
  },
  BALANCED_MENTOR: {
    id: `Kamu adalah mentor yang hangat dan seimbang. Akui usaha user sambil mendorong mereka untuk terus berkembang dan konsisten. Tujuanmu adalah menginspirasi user untuk tidak menyerah pada target mereka. Output harus berupa JSON object sesuai schema yang diminta.`,
    en: `You are a warm, balanced mentor. Acknowledge effort while gently pushing them to stay consistent and keep growing. Your goal is to inspire the user to never give up on their goals. Output strictly a JSON object matching the required schema.`,
  },
  FRIENDLY_BUDDY: {
    id: `Kamu adalah teman yang santai dan suportif. Gunakan bahasa informal, "hei!", dan sesekali emoji. Tujuanmu adalah membuat user merasa didukung dan termotivasi untuk terus konsisten. Output harus berupa JSON object sesuai schema yang diminta.`,
    en: `You are a casual, supportive friend. Use informal language, "hey!", and minimal emojis. Your goal is to make the user feel supported and motivated to stay consistent. Output strictly a JSON object matching the required schema.`,
  },
}

const CHARACTER_NAMES: Record<AICharacter, string> = {
  MOTIVATIONAL_COACH: 'Coach Alex',
  ANALYTICAL_ADVISOR: 'Advisor Sam',
  BALANCED_MENTOR: 'Mentor Jordan',
  FRIENDLY_BUDDY: 'Buddy Riley',
}

const FALLBACK_INSIGHT: Record<EmailLanguage, AIInsight> = {
  id: {
    headline: 'Tetap semangat!',
    narrative: 'Setiap langkah kecil yang kamu ambil hari ini adalah investasi untuk masa depanmu. Konsistensi adalah kunci keberhasilan.',
    topWin: 'Kamu telah hadir dan berusaha hari ini.',
    challengeSpotted: 'Konsistensi setiap hari adalah fondasi mencapai target besar.',
    actionTip: 'Tentukan 3 prioritas utamamu untuk besok malam ini.',
    motivationalClose: 'Sampai jumpa besok — terus bergerak maju!',
    characterName: 'Better Planner',
  },
  en: {
    headline: 'Keep up the great work!',
    narrative: 'Every small step you take today is an investment in your future. Consistency is the key to success.',
    topWin: 'You showed up and did the work.',
    challengeSpotted: 'Daily consistency is the foundation for achieving big goals.',
    actionTip: 'Plan your top 3 priorities for tomorrow tonight.',
    motivationalClose: 'See you tomorrow — keep moving forward!',
    characterName: 'Better Planner',
  },
}

function buildUserPrompt(
  metrics: PerformanceMetrics,
  periodType: string,
  userName: string,
  language: EmailLanguage,
  mainQuestMotivation?: string
): string {
  const langInstruction = language === 'id'
    ? 'Tulis semua teks dalam Bahasa Indonesia yang natural dan memotivasi.'
    : 'Write all text in English that is natural and motivating.'

  const motivationContext = mainQuestMotivation
    ? language === 'id'
      ? `\nMotivasi utama user untuk main quest mereka: "${mainQuestMotivation}" — gunakan ini untuk mempersonalisasi pesan.`
      : `\nUser's main quest motivation: "${mainQuestMotivation}" — use this to personalize your message.`
    : ''

  const noActivityContext = metrics.totalSessions === 0
    ? language === 'id'
      ? `\nUser tidak memiliki sesi fokus hari ini. Berikan pesan motivasi yang hangat dan mendorong mereka untuk memulai besok. Jangan membuat mereka merasa bersalah.`
      : `\nUser had no focus sessions today. Give a warm motivational message encouraging them to start tomorrow. Don't make them feel guilty.`
    : ''

  return `
${langInstruction}

Analyze user performance for a ${periodType} period. User's name is ${userName}.
${motivationContext}
${noActivityContext}

Metrics:
${JSON.stringify(metrics, null, 2)}

Your goal is to MOTIVATE and ENCOURAGE the user to stay consistent and keep working toward their goals.

Produce a JSON object with this schema:
{
  "headline": "<short catchy motivating headline>",
  "narrative": "<2-3 sentences explaining their performance with encouragement>",
  "topWin": "<1 sentence on their best achievement or encouragement if no activity>",
  "challengeSpotted": "<1 sentence on what they could improve, framed positively>",
  "actionTip": "<1 specific actionable tip for tomorrow>",
  "motivationalClose": "<short energizing sign-off phrase>"
}
No markdown, just raw JSON.
  `
}

function parseGeminiResponse(raw: string, character: AICharacter, language: EmailLanguage): AIInsight {
  try {
    const rawJson = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(rawJson)
    const fallback = FALLBACK_INSIGHT[language]
    return {
      headline: parsed.headline || fallback.headline,
      narrative: parsed.narrative || fallback.narrative,
      topWin: parsed.topWin || fallback.topWin,
      challengeSpotted: parsed.challengeSpotted || fallback.challengeSpotted,
      actionTip: parsed.actionTip || fallback.actionTip,
      motivationalClose: parsed.motivationalClose || fallback.motivationalClose,
      characterName: CHARACTER_NAMES[character],
    }
  } catch (err) {
    console.error('[aiInsightService] Failed to parse JSON from Gemini:', err, 'Raw text:', raw)
    return { ...FALLBACK_INSIGHT[language], characterName: CHARACTER_NAMES[character] }
  }
}

export async function generateInsight(
  metrics: PerformanceMetrics,
  character: AICharacter,
  userName: string,
  language: EmailLanguage = 'id',
  mainQuestMotivation?: string
): Promise<AIInsight> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: CHARACTER_PROMPTS[character][language],
    })
    const result = await model.generateContent(
      buildUserPrompt(metrics, metrics.periodType, userName, language, mainQuestMotivation)
    )
    return parseGeminiResponse(result.response.text(), character, language)
  } catch (error) {
    console.error('[aiInsightService] Gemini error:', error)
    return { ...FALLBACK_INSIGHT[language], characterName: CHARACTER_NAMES[character] }
  }
}
