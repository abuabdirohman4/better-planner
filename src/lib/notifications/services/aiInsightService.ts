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
  mainQuestMotivation?: string,
  inactiveStreak?: number
): string {
  const isId = language === 'id'

  const langInstruction = isId
    ? 'Tulis semua teks dalam Bahasa Indonesia yang natural, jujur, dan bermakna.'
    : 'Write all text in English that is natural, honest, and meaningful.'

  const motivationContext = mainQuestMotivation
    ? isId
      ? `\nAlasan utama user mengejar tujuan mereka: "${mainQuestMotivation}" — jadikan ini landasan pesanmu, bukan sekadar disebut.`
      : `\nUser's core reason for pursuing their goal: "${mainQuestMotivation}" — anchor your message to this reason, don't just quote it.`
    : ''

  // Build task context for days WITH activity
  let taskContext = ''
  if (metrics.totalSessions > 0) {
    const completedNames = metrics.topCompletedTasks?.map(t => `"${t.title}" (${t.questName})`).join(', ')
    const activeNames = metrics.mainQuestProgress?.activeTasks?.slice(0, 3).map(t => `"${t.title}"`).join(', ')
    const stuckNames = metrics.needsAttention?.slice(0, 2).map(t => `"${t.title}" (${t.daysInProgress} hari macet)`).join(', ')

    taskContext = isId
      ? `\nTugas yang diselesaikan hari ini: ${completedNames || 'tidak ada'}.
Tugas yang masih berjalan: ${activeNames || 'tidak ada'}.
Tugas yang perlu perhatian: ${stuckNames || 'tidak ada'}.
Sebutkan nama tugas/quest spesifik dalam pesanmu agar terasa personal dan relevan.`
      : `\nTasks completed today: ${completedNames || 'none'}.
Active tasks in progress: ${activeNames || 'none'}.
Tasks needing attention: ${stuckNames || 'none'}.
Reference specific task/quest names in your message to make it feel personal and relevant.`
  }

  // Build inactive streak context
  let inactivityContext = ''
  if (metrics.totalSessions === 0) {
    if (inactiveStreak && inactiveStreak > 1) {
      inactivityContext = isId
        ? `\nUser sudah ${inactiveStreak} hari berturut-turut tidak membuka sesi fokus. Sampaikan dengan jujur bahwa ini berdampak pada momentum mereka menuju tujuan. Gunakan nada yang peduli tapi tegas — bukan menghakimi, tapi juga bukan basa-basi. Tunjukkan konsekuensi nyata dari tidak konsisten terhadap tujuan mereka.`
        : `\nUser has had ${inactiveStreak} consecutive days with zero focus sessions. Be honest that this is affecting their momentum toward their goal. Use a caring but firm tone — not judgmental, but not empty reassurance either. Show the real consequence of inconsistency on their goal.`
    } else {
      inactivityContext = isId
        ? `\nUser tidak memiliki sesi fokus kemarin. Tunjukkan secara konkret apa yang hilang dari hari ini — dan apa yang bisa mereka mulai besok. Jangan terlalu lembut, tapi tetap suportif.`
        : `\nUser had no focus sessions yesterday. Concretely show what was missed today — and what they can start tomorrow. Don't be too soft, but stay supportive.`
    }
  }

  return `
${langInstruction}

Analyze this ${periodType} performance report. User: ${userName}.
${motivationContext}
${taskContext}
${inactivityContext}

Raw metrics data:
${JSON.stringify({
  totalFocusMinutes: metrics.totalFocusMinutes,
  totalSessions: metrics.totalSessions,
  tasksCompleted: metrics.tasksCompleted,
  tasksTotal: metrics.tasksTotal,
  completionRate: Math.round(metrics.completionRate),
  mainQuestProgress: metrics.mainQuestProgress ? {
    questName: metrics.mainQuestProgress.questName,
    completedCount: metrics.mainQuestProgress.completedCount,
    totalTasks: metrics.mainQuestProgress.totalTasks,
    progressPercentage: metrics.mainQuestProgress.progressPercentage,
    currentMilestone: metrics.mainQuestProgress.currentMilestone,
  } : null,
  taskBreakdown: metrics.taskBreakdown,
  previousFocusMinutes: metrics.previousFocusMinutes,
  previousCompletionRate: metrics.previousCompletionRate,
}, null, 2)}

Output a JSON object — no markdown, just raw JSON:
{
  "headline": "Judul pendek yang menangkap situasi hari ini dengan tepat (bukan generik)",
  "narrative": "2-3 kalimat yang jujur dan spesifik tentang performa mereka — sebutkan angka, nama quest, atau tugas nyata",
  "topWin": "1 kalimat pencapaian terbaik yang spesifik (atau dampak nyata jika tidak ada aktivitas)",
  "challengeSpotted": "1 kalimat tantangan konkret yang perlu diatasi — jujur, bukan basa-basi",
  "actionTip": "1 tips aksi yang sangat spesifik dan bisa langsung dilakukan besok",
  "motivationalClose": "1 kalimat penutup yang personal dan berenergi"
}
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
  mainQuestMotivation?: string,
  inactiveStreak?: number
): Promise<AIInsight> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: CHARACTER_PROMPTS[character][language],
    })
    const result = await model.generateContent(
      buildUserPrompt(metrics, metrics.periodType, userName, language, mainQuestMotivation, inactiveStreak)
    )
    return parseGeminiResponse(result.response.text(), character, language)
  } catch (error) {
    console.error('[aiInsightService] Gemini error:', error)
    return { ...FALLBACK_INSIGHT[language], characterName: CHARACTER_NAMES[character] }
  }
}
