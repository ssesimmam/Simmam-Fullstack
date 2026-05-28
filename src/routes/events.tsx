import { createFileRoute, Outlet } from '@tanstack/react-router'

// Parent route for all /events/* routes.
// Renders children via Outlet — no UI wrapper needed here.
export const Route = createFileRoute('/events')({
  component: () => <Outlet />,
})
