import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/profile', replace: true })
  },
  component: () => null,
})