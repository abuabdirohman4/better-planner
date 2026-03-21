import { Metadata } from 'next'
import { SettingsForm } from './SettingsForm'

export const metadata: Metadata = {
  title: 'Notification Settings | Better Planner',
  description: 'Manage your email notification settings and AI character.',
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive updates and performance reports.
        </p>
      </div>
      <SettingsForm />
    </div>
  )
}
