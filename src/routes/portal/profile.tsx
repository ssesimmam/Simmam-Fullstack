import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/components/user/ProfilePage'

export const Route = createFileRoute('/portal/profile')({
  head: () => ({
    meta: [
      { title: 'Portal Profile — SIMMAM 2026' },
      {
        name: 'description',
        content: 'Backend-connected user profile and authentication page under the portal section.',
      },
    ],
  }),
  component: ProfilePage,
})