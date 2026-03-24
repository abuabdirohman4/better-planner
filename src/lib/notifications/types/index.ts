export type AICharacter =
  | 'MOTIVATIONAL_COACH'
  | 'ANALYTICAL_ADVISOR'
  | 'BALANCED_MENTOR'
  | 'FRIENDLY_BUDDY'

export type EmailLanguage = 'id' | 'en'

export interface NotificationSettings {
  enabled: boolean
  frequencies: {
    daily: boolean
    weekly: boolean
    monthly: boolean
    quarterly: boolean
  }
  aiCharacter: AICharacter
  preferredTime: string  // "HH:MM" — saat ini fixed 13:00 WIB
  timezone: string       // "Asia/Jakarta"
  email: string | null   // null = gunakan auth email
  language: EmailLanguage
}

export interface AIInsight {
  headline: string
  narrative: string
  topWin: string
  challengeSpotted: string
  actionTip: string
  motivationalClose: string
  characterName: string
}

import type { PerformanceMetrics } from '../services/performanceAggregation'

export interface EmailPayload {
  userId: string
  email: string
  userName: string
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  periodLabel: string    // e.g. "21 Maret 2026" atau "Minggu 12, 2026"
  metrics: PerformanceMetrics
  insight: AIInsight
  character: AICharacter
  language: EmailLanguage
}
