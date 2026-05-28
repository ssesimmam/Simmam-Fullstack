import { createFileRoute, redirect } from '@tanstack/react-router'

// Permanent redirect: /register → /events/register
// Preserves backward compatibility with any existing links or bookmarks.
export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    throw redirect({ to: '/events/register', replace: true })
  },
  component: () => null,
})
