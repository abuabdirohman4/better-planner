import { Metadata } from 'next'
import { ProfileForm } from './ProfileForm'

export const metadata: Metadata = {
  title: 'Profile Settings | Better Planner',
  description: 'Manage your display name and timer sound preferences.',
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your display name and timer sounds.
        </p>
      </div>
      <ProfileForm />
    </div>
  )
}
