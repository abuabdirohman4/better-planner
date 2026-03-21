import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject,
      html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[emailService] Send failed:', message)
    return { success: false, error: message }
  }
}
