import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { exportAdminRegistrationsCsv, fetchAdminRegistrations } from '@/lib/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/_layout/registrations')({
  component: RegistrationsPage,
})

function RegistrationsPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  if (!hasPermission('registrations', 'read')) {
    return <AccessDenied />
  }

  const loadRegistrations = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminRegistrations({
        search: search || undefined,
        event: eventFilter || undefined,
        date: dateFilter || undefined,
      })
      setRows(data)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const csv = await exportAdminRegistrationsCsv({
        search: search || undefined,
        event: eventFilter || undefined,
        date: dateFilter || undefined,
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `registrations_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Registrations exported')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to export registrations')
    }
  }

  const uniqueEvents = useMemo(() => {
    const set = new Set(rows.map((row) => row.event_name).filter(Boolean))
    return Array.from(set)
  }, [rows])

  useEffect(() => {
    void loadRegistrations()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registration Management"
        subtitle="Track registrations with search, event filter, and export"
      />

      <div className="bg-[#111] border border-[#333] rounded-lg p-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search registration, participant, event"
            className="pl-10 bg-black border-[#333] text-white"
          />
        </div>

        <Input
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          list="registration-events"
          placeholder="Filter by event"
          className="bg-black border-[#333] text-white"
        />
        <datalist id="registration-events">
          {uniqueEvents.map((eventName) => (
            <option key={eventName} value={eventName} />
          ))}
        </datalist>

        <Input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="bg-black border-[#333] text-white"
        />

        <div className="lg:col-span-4 flex flex-wrap justify-end gap-2">
          <Button className="bg-white text-black hover:bg-gray-200" onClick={loadRegistrations}>
            Search Registration
          </Button>
          <Button variant="outline" className="border-[#333]" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Registrations
          </Button>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-gray-400">
              <tr>
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">Participant Name</th>
                <th className="text-left p-3">Event Name</th>
                <th className="text-left p-3">Registration Date</th>
                <th className="text-left p-3">Registration Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.registration_id} className="border-t border-[#222] text-white/90">
                    <td className="p-3 font-mono text-xs text-gray-400">{row.user_id?.slice(0, 8)}...</td>
                    <td className="p-3">{row.participant_name}</td>
                    <td className="p-3">{row.event_name}</td>
                    <td className="p-3 text-gray-400">{row.registration_date ? new Date(row.registration_date).toLocaleString() : '-'}</td>
                    <td className="p-3 uppercase text-xs tracking-wide text-gray-300">{row.registration_status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
