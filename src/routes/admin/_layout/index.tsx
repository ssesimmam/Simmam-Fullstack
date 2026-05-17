import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, ClipboardList, Users, UserRoundPlus } from 'lucide-react'

import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { fetchAdminDashboardSummary, type AdminDashboardSummary } from '@/lib/adminApi'

export const Route = createFileRoute('/admin/_layout/')({
  component: AdminDashboard,
})

function DashboardCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: any
}) {
  return (
    <div className="bg-[#111] border border-[#333] rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-wider uppercase text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-black rounded-lg border border-[#333]">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const showOverview = user?.role === 'developer_admin' || user?.role === 'core_team'

  useEffect(() => {
    void fetchAdminDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [])

  if (!showOverview) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" subtitle={`Welcome back, ${user?.name || 'Admin'}`} />
        <div className="bg-[#111] border border-[#333] rounded-lg p-6 text-gray-400 text-sm">
          Dashboard system overview is available only for Core Team and Developer Admin profiles.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle={`Welcome back, ${user?.name || 'Admin'}`} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total Users" value={loading ? '...' : summary?.totals.users || 0} icon={Users} />
        <DashboardCard label="Total Events" value={loading ? '...' : summary?.totals.events || 0} icon={Calendar} />
        <DashboardCard label="Total Registrations" value={loading ? '...' : summary?.totals.registrations || 0} icon={ClipboardList} />
        <DashboardCard label="Total Attendance" value={loading ? '...' : summary?.totals.attendance || 0} icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {(summary?.upcomingEvents || []).slice(0, 8).map((event) => (
              <div key={event.id} className="bg-black border border-[#333] rounded-lg p-3">
                <div className="text-white font-medium">{event.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {event.date} • {event.time_slot || 'TBA'} • {event.venue || 'Venue TBA'}
                </div>
              </div>
            ))}
            {!loading && (summary?.upcomingEvents || []).length === 0 && (
              <p className="text-sm text-gray-500">No upcoming events found.</p>
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {(summary?.recentRegistrations || []).slice(0, 10).map((item) => (
              <div key={item.id} className="bg-black border border-[#333] rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-medium">{item.participant_name || 'Unknown User'}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.event_name} • {item.registration_date ? new Date(item.registration_date).toLocaleString() : '-'}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400">{item.registration_status}</span>
              </div>
            ))}
            {!loading && (summary?.recentRegistrations || []).length === 0 && (
              <p className="text-sm text-gray-500">No registrations yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg p-6">
        <div className="flex items-center gap-2 text-white mb-3">
          <UserRoundPlus className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold">Complete Admin Flow</h3>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Admin Login → Dashboard Access → Manage Users → Create/Edit Events → Monitor Registrations → Verify Attendance → Publish Results → Generate Reports → Update Settings → Logout.
        </p>
      </div>
    </div>
  )
}
