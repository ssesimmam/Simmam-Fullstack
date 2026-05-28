import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({
        to: '/events',
      })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="flex-1 w-full flex flex-col">
      <Outlet />
    </div>
  )
}
