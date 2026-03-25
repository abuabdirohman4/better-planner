import { Text, Section, Heading } from '@react-email/components'
import * as React from 'react'
import type { EmailPayload } from '../types'
import { EmailLayout } from './EmailLayout'

interface DailyEmailTemplateProps {
  payload: EmailPayload
}

const i18n = {
  id: {
    tag: 'Rekap Harian',
    hi: 'Hei',
    metrics: 'Rekap Kemarin',
    focusTime: 'Waktu Fokus',
    minutes: 'menit',
    tasksCompleted: 'Tugas Selesai',
    completionRate: 'Tingkat Penyelesaian',
    topCompletions: 'Pencapaian Terbaik',
    committedQuests: 'Main Quest Kuartal Ini',
    motivation: 'Motivasi',
    progress: 'Progress',
    tasks: 'tugas',
    says: 'berkata',
    topWin: 'Kemenangan Terbaik',
    challenge: 'Tantangan',
    actionTip: 'Tips Aksi',
    noActivity: 'Tidak ada sesi fokus kemarin — hari ini adalah kesempatanmu!',
  },
  en: {
    tag: 'Daily Summary',
    hi: 'Hi',
    metrics: "Yesterday's Recap",
    focusTime: 'Focus Time',
    minutes: 'minutes',
    tasksCompleted: 'Tasks Completed',
    completionRate: 'Completion Rate',
    topCompletions: 'Top Completions',
    committedQuests: 'Main Quests This Quarter',
    motivation: 'Motivation',
    progress: 'Progress',
    tasks: 'tasks',
    says: 'says',
    topWin: 'Top Win',
    challenge: 'Challenge',
    actionTip: 'Action Tip',
    noActivity: 'No focus sessions yesterday — today is your chance!',
  },
}

export function DailyEmailTemplate({ payload }: DailyEmailTemplateProps) {
  const { periodLabel, userName, insight, metrics, userId, language = 'id' } = payload
  const t = i18n[language]
  const committedQuests = metrics.committedQuests ?? []

  return (
    <EmailLayout preview={insight.headline} userId={userId}>
      {/* Header */}
      <Section style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '14px', color: '#8898aa', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
          {t.tag} · {periodLabel}
        </Text>
        <Heading style={{ fontSize: '24px', color: '#32325d', marginTop: '8px', marginBottom: '16px' }}>
          {insight.headline}
        </Heading>
        <Text style={{ fontSize: '16px', color: '#525f7f', lineHeight: '24px' }}>
          {t.hi} {userName}, {insight.narrative}
        </Text>
      </Section>

      {/* Committed Quests — always shown */}
      {committedQuests.length > 0 && (
        <Section style={{ marginBottom: '24px' }}>
          <Heading style={{ fontSize: '18px', color: '#32325d', marginTop: '0', marginBottom: '12px' }}>
            {t.committedQuests}
          </Heading>
          {committedQuests.map((quest) => (
            <Section key={quest.questId} style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
              <Text style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold', color: '#78350f' }}>
                {quest.questName}
              </Text>
              {quest.motivation && (
                <Text style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#92400e', fontStyle: 'italic' }}>
                  "{quest.motivation}"
                </Text>
              )}
              {/* Progress bar */}
              <Text style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#78350f' }}>
                {t.progress}: {quest.completedTasks}/{quest.totalTasks} {t.tasks} ({quest.progressPercentage}%)
              </Text>
              <Section style={{ backgroundColor: '#fef3c7', borderRadius: '4px', height: '8px', marginTop: '4px', overflow: 'hidden' }}>
                <Section style={{ backgroundColor: '#f59e0b', borderRadius: '4px', height: '8px', width: `${quest.progressPercentage}%` }} />
              </Section>
            </Section>
          ))}
        </Section>
      )}

      {/* Performance Metrics */}
      <Section style={{ backgroundColor: '#f6f9fc', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <Heading style={{ fontSize: '18px', color: '#32325d', marginTop: '0', marginBottom: '16px' }}>
          {t.metrics}
        </Heading>
        {metrics.totalSessions === 0 ? (
          <Text style={{ margin: '0', fontSize: '16px', color: '#8898aa', fontStyle: 'italic' }}>
            {t.noActivity}
          </Text>
        ) : (
          <>
            <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
              <strong>{t.focusTime}:</strong> {metrics.totalFocusMinutes} {t.minutes}
            </Text>
            <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
              <strong>{t.tasksCompleted}:</strong> {metrics.tasksCompleted} / {metrics.tasksTotal}
            </Text>
            <Text style={{ margin: '0', fontSize: '16px', color: '#525f7f' }}>
              <strong>{t.completionRate}:</strong> {Math.round(metrics.completionRate)}%
            </Text>
          </>
        )}
      </Section>

      {/* Top Completions */}
      {(metrics.topCompletedTasks?.length ?? 0) > 0 && (
        <Section style={{ marginBottom: '24px' }}>
          <Heading style={{ fontSize: '18px', color: '#32325d', marginTop: '0', marginBottom: '12px' }}>
            {t.topCompletions}
          </Heading>
          {metrics.topCompletedTasks.map((task) => (
            <Text key={task.id} style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
              ✓ {task.title} ({task.questName})
            </Text>
          ))}
        </Section>
      )}

      {/* Coach Insight */}
      <Section style={{ borderLeft: '4px solid #1496F6', paddingLeft: '16px', marginBottom: '24px' }}>
        <Heading style={{ fontSize: '16px', color: '#32325d', marginTop: '0', marginBottom: '8px' }}>
          {insight.characterName} {t.says}:
        </Heading>
        <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>{t.topWin}:</strong> {insight.topWin}
        </Text>
        <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>{t.challenge}:</strong> {insight.challengeSpotted}
        </Text>
        <Text style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>{t.actionTip}:</strong> {insight.actionTip}
        </Text>
        <Text style={{ margin: '0', fontSize: '16px', color: '#1496F6', fontWeight: 'bold' }}>
          {insight.motivationalClose}
        </Text>
      </Section>
    </EmailLayout>
  )
}
