import { render } from '@react-email/components'
import * as React from 'react'
import type { EmailPayload } from '../types'
import { DailyEmailTemplate } from './DailyEmailTemplate'
import { WeeklyEmailTemplate } from './WeeklyEmailTemplate'
import { MonthlyEmailTemplate } from './MonthlyEmailTemplate'
import { QuarterlyEmailTemplate } from './QuarterlyEmailTemplate'

export async function renderEmailTemplate(payload: EmailPayload): Promise<string> {
  const templateMap = {
    daily: DailyEmailTemplate,
    weekly: WeeklyEmailTemplate,
    monthly: MonthlyEmailTemplate,
    quarterly: QuarterlyEmailTemplate,
  }
  
  const TemplateProps = { payload }
  const Template = templateMap[payload.periodType]
  
  // Need to await render since react-email render can return Promise depending on version
  return await render(React.createElement(Template, TemplateProps))
}
