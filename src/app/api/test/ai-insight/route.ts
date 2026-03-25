import { generateInsight } from '@/lib/notifications/services/aiInsightService'
import type { PerformanceMetrics } from '@/lib/notifications/services/performanceAggregation'

export async function GET(request: Request) {
  const dummyMetrics: PerformanceMetrics = {
    periodType: 'daily',
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    totalFocusMinutes: 120, // 2 hours
    totalBreakMinutes: 15,
    totalSessions: 4,
    tasksCompleted: 3,
    tasksTotal: 5,
    completionRate: 60,
    taskBreakdown: {
      mainQuest: { completed: 1, total: 2, focusMinutes: 60 },
      sideQuest: { completed: 1, total: 2, focusMinutes: 30 },
      workQuest: { completed: 1, total: 1, focusMinutes: 30 },
      dailyQuest: { completed: 0, total: 0, focusMinutes: 0 },
    },
    topCompletedTasks: [],
    needsAttention: [],
    otherQuestsCompleted: 2,
    otherQuestsTotal: 3,
    previousFocusMinutes: 100,
    previousCompletionRate: 50,
    committedQuests: [],
  }

  try {
    const insight = await generateInsight(dummyMetrics, 'MOTIVATIONAL_COACH', 'Test User')
    return Response.json({ success: true, insight })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
