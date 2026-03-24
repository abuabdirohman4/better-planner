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
    metrics: 'Performa Hari Ini',
    focusTime: 'Waktu Fokus',
    minutes: 'menit',
    tasksCompleted: 'Tugas Selesai',
    completionRate: 'Tingkat Penyelesaian',
    topCompletions: 'Pencapaian Terbaik',
    mainQuestMotivation: 'Motivasi Quest Utama',
    coachSays: 'Coach',
    says: 'berkata',
    topWin: 'Kemenangan Terbaik',
    challenge: 'Tantangan',
    actionTip: 'Tips Aksi',
    noActivity: 'Tidak ada sesi fokus hari ini — besok adalah kesempatanmu!',
  },
  en: {
    tag: 'Daily Summary',
    hi: 'Hi',
    metrics: 'Performance Metrics',
    focusTime: 'Focus Time',
    minutes: 'minutes',
    tasksCompleted: 'Tasks Completed',
    completionRate: 'Completion Rate',
    topCompletions: 'Top Completions',
    mainQuestMotivation: 'Main Quest Motivation',
    coachSays: 'Coach',
    says: 'says',
    topWin: 'Top Win',
    challenge: 'Challenge',
    actionTip: 'Action Tip',
    noActivity: 'No focus sessions today — tomorrow is your chance!',
  },
}

export function DailyEmailTemplate({ payload }: DailyEmailTemplateProps) {
  const { periodLabel, userName, insight, metrics, character, userId, language = 'id' } = payload
  const t = i18n[language]
  const mainQuestMotivation = metrics.mainQuestProgress?.motivation

  return (
    <EmailLayout preview={insight.headline} userId={userId}>
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

      {/* Main Quest Motivation */}
      {mainQuestMotivation && (
        <Section style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '16px', marginBottom: '24px', borderRadius: '0 8px 8px 0' }}>
          <Text style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.mainQuestMotivation}
          </Text>
          <Text style={{ margin: '0', fontSize: '15px', color: '#78350f', fontStyle: 'italic' }}>
            "{mainQuestMotivation}"
          </Text>
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
          {t.coachSays} {insight.characterName} {t.says}:
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
