import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth, canAccessAdminPath, getStoredAdminUser, getDefaultAdminPath } from '@/lib/auth'
import AdminLayout from '@/components/admin/layout/AdminLayout'

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: ({ location }) => {
    const storedUser = getStoredAdminUser()

    if (!storedUser) {
      throw redirect({
        to: '/admin/login',
        search: { redirectTo: location.pathname },
        replace: true,
      })
    }

    if (!canAccessAdminPath(storedUser, location.pathname)) {
      throw redirect({
        to: getDefaultAdminPath(storedUser),
        replace: true,
      })
    }
  },
  component: AdminLayoutRoute,
})

function AdminLayoutRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}