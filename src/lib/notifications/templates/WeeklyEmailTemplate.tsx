import { Text, Section, Heading, Container } from '@react-email/components'
import * as React from 'react'
import type { EmailPayload } from '../types'
import { EmailLayout } from './EmailLayout'

interface WeeklyEmailTemplateProps {
  payload: EmailPayload
}

export function WeeklyEmailTemplate({ payload }: WeeklyEmailTemplateProps) {
  const { periodLabel, userName, insight, metrics, character, userId } = payload

  return (
    <EmailLayout preview={insight.headline} userId={userId}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '14px', color: '#8898aa', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
          Weekly Summary · {periodLabel}
        </Text>
        <Heading style={{ fontSize: '24px', color: '#32325d', marginTop: '8px', marginBottom: '16px' }}>
          {insight.headline}
        </Heading>
        <Text style={{ fontSize: '16px', color: '#525f7f', lineHeight: '24px' }}>
          Hi {userName}, {insight.narrative}
        </Text>
      </Section>

      <Section style={{ backgroundColor: '#f6f9fc', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <Heading style={{ fontSize: '18px', color: '#32325d', marginTop: '0', marginBottom: '16px' }}>
          Weekly Performance
        </Heading>
        <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>Total Focus Time:</strong> {metrics.totalFocusMinutes} minutes
        </Text>
        <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>Tasks Completed:</strong> {metrics.tasksCompleted} / {metrics.tasksTotal}
        </Text>
        <Text style={{ margin: '0', fontSize: '16px', color: '#525f7f' }}>
          <strong>Completion Rate:</strong> {metrics.completionRate}%
        </Text>
      </Section>

      {metrics.mainQuestProgress && (
        <Section style={{ marginBottom: '24px' }}>
          <Heading style={{ fontSize: '18px', color: '#32325d', marginTop: '0', marginBottom: '12px' }}>
            Main Quest: {metrics.mainQuestProgress.questName}
          </Heading>
          <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
            {metrics.mainQuestProgress.completedCount} of {metrics.mainQuestProgress.totalTasks} tasks completed ({metrics.mainQuestProgress.progressPercentage}%)
          </Text>
        </Section>
      )}

      <Section style={{ borderLeft: '4px solid #1496F6', paddingLeft: '16px', marginBottom: '24px' }}>
        <Heading style={{ fontSize: '16px', color: '#32325d', marginTop: '0', marginBottom: '8px' }}>
          {insight.characterName} says:
        </Heading>
        <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>Highlight:</strong> {insight.topWin}
        </Text>
        <Text style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>Area to Improve:</strong> {insight.challengeSpotted}
        </Text>
        <Text style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#525f7f' }}>
          <strong>Action for Next Week:</strong> {insight.actionTip}
        </Text>
        <Text style={{ margin: '0', fontSize: '16px', color: '#1496F6', fontWeight: 'bold' }}>
          {insight.motivationalClose}
        </Text>
      </Section>
    </EmailLayout>
  )
}
