import { renderEmailTemplate } from '@/lib/notifications/templates'
import type { EmailPayload } from '@/lib/notifications/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'quarterly' || 'daily'

  const dummyPayload: EmailPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    userName: 'Test User',
    periodType: period,
    periodLabel: '21 Maret 2026',
    character: 'MOTIVATIONAL_COACH',
    insight: {
      headline: 'Keep up the great work!',
      narrative: 'You made progress today. Every step counts toward your goals.',
      topWin: 'You showed up and did the work.',
      challengeSpotted: 'Consistency is the key to long-term success.',
      actionTip: 'Plan your top 3 priorities for tomorrow.',
      motivationalClose: 'See you tomorrow!',
      characterName: 'Coach Alex',
    },
    metrics: {
      periodType: period,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      totalFocusMinutes: 120,
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
      topCompletedTasks: [
        {
          id: 'task-1',
          title: 'Implement Notification Settings',
          questName: 'Setup Notification System',
          type: 'MAIN_QUEST',
          status: 'DONE',
          focusMinutes: 60,
        }
      ],
      needsAttention: [],
      otherQuestsCompleted: 2,
      otherQuestsTotal: 3,
      previousFocusMinutes: 100,
      previousCompletionRate: 50,
      mainQuestProgress: {
        questName: 'Setup Notification System',
        questId: 'quest-1',
        totalTasks: 10,
        completedCount: 5,
        progressPercentage: 50,
        activeTasks: [],
        completedTaskDetails: [],
        blockedOrStuckTasks: []
      }
    }
  }

  try {
    const html = await renderEmailTemplate(dummyPayload)
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Error rendering template: ${message}`, { status: 500 })
  }
}
