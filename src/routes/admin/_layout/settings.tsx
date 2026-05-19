import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import WebHealthMonitor from '@/components/admin/WebHealthMonitor'

export const Route = createFileRoute('/admin/_layout/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { hasPermission, user } = useAuth()

  if (!hasPermission('settings', 'read')) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="System Settings"
        subtitle="Developer admin utilities and web health monitoring"
      />

      {user?.role === 'developer_admin' && (
        <WebHealthMonitor />
      )}
    </div>
  )
}
