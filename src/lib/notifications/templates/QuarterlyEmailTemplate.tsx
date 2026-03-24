import { Text, Section, Heading } from '@react-email/components'
import * as React from 'react'
import type { EmailPayload } from '../types'
import { EmailLayout } from './EmailLayout'

interface QuarterlyEmailTemplateProps {
  payload: EmailPayload
}

const i18n = {
  id: {
    tag: 'Rekap Kuartalan',
    hi: 'Hei',
    metrics: 'Performa Kuartal Ini',
    focusTime: 'Waktu Fokus',
    minutes: 'menit',
    tasksCompleted: 'Tugas Selesai',
    completionRate: 'Tingkat Penyelesaian',
    mainQuest: 'Quest Utama',
    tasks: 'tugas selesai dari',
    coachSays: 'Coach',
    says: 'berkata',
    topWin: 'Sorotan',
    challenge: 'Area yang Perlu Diperbaiki',
    actionTip: 'Aksi untuk Kuartal Depan',
    noActivity: 'Tidak ada sesi fokus kuartal ini — kuartal depan adalah kesempatanmu!',
  },
  en: {
    tag: 'Quarterly Summary',
    hi: 'Hi',
    metrics: 'Quarterly Performance',
    focusTime: 'Total Focus Time',
    minutes: 'minutes',
    tasksCompleted: 'Tasks Completed',
    completionRate: 'Completion Rate',
    mainQuest: 'Main Quest',
    tasks: 'tasks completed of',
    coachSays: 'Coach',
    says: 'says',
    topWin: 'Highlight',
    challenge: 'Area to Improve',
    actionTip: 'Action for Next Quarter',
    noActivity: 'No focus sessions this quarter — next quarter is your chance!',
  },
}

export function QuarterlyEmailTemplate({ payload }: QuarterlyEmailTemplateProps) {
  const { periodLabel, userName, insight, metrics, userId, language = 'id' } = payload
  const t = i18n[language]

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

      {metrics.mainQuestProgress && (
        <Section style={{ marginBottom: '24px' }}>
          <Heading style={{ fontSize: '18px', color: '#32325d', marginTop: '0', marginBottom: '12px' }}>
            {t.mainQuest}: {metrics.mainQuestProgress.questName}
          </Heading>
          <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
            {metrics.mainQuestProgress.completedCount} {t.tasks} {metrics.mainQuestProgress.totalTasks} ({metrics.mainQuestProgress.progressPercentage}%)
          </Text>
        </Section>
      )}

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
