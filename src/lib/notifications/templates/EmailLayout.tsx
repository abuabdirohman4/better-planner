import { Html, Head, Body, Container, Section, Text, Hr, Link } from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
  userId: string
}

export function EmailLayout({ preview, children, userId }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <title>{preview}</title>
      </Head>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif', margin: '0', padding: '0' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Header dengan warna #1496F6 */}
          <Section style={{ backgroundColor: '#1496F6', padding: '24px', textAlign: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Better Planner
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: '24px' }}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />
          <Section style={{ padding: '0 24px 24px 24px', textAlign: 'center' }}>
            <Text style={{ color: '#8898aa', fontSize: '12px', lineHeight: '16px' }}>
              You are receiving this email because you opted in via your Better Planner notification settings.
            </Text>
            <Link href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/settings/notifications?userId=${userId}`} style={{ color: '#1496F6', textDecoration: 'none', fontSize: '14px' }}>
              Unsubscribe or Manage Preferences
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
