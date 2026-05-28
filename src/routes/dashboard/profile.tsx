import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/components/user/ProfilePage'

export const Route = createFileRoute('/dashboard/profile')({
  component: ProfilePage,
})
