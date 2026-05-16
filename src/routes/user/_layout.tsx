import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'

export const Route = createFileRoute('/user/_layout')({
  component: UserLayoutRoute,
})

function UserLayoutRoute() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28">
        <Outlet />
      </main>
    </div>
  )
}
