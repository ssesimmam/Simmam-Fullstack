import { createFileRoute, Outlet } from '@tanstack/react-router'

import AdminLayout from '@/components/admin/layout/AdminLayout'

export const Route = createFileRoute('/admin/_layout')({
  component: AdminShell,
})

function AdminShell() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}