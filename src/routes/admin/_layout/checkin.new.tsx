import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CheckCircle, Search } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { checkInRegistration, fetchAdminRegistrations, fetchAttendanceReport } from '@/lib/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/_layout/checkin/new')({
  component: CheckInPage,
})

function CheckInPage() {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [attendanceReport, setAttendanceReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  if (!hasPermission('checkin', 'read')) {
    return <AccessDenied />
  }

  const loadReport = async () => {
    try {
      const report = await fetchAttendanceReport()
      setAttendanceReport(report)
    } catch {
      setAttendanceReport([])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedEvent.trim()) {
      setRows([])
      return
    }

    setLoading(true)
    try {
      const registrations = await fetchAdminRegistrations({
        search: searchQuery || undefined,
        event: selectedEvent || undefined,
      })
      setRows(registrations)
      await loadReport()
    } catch (error: any) {
      toast.error(error?.message || 'Search failed')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const eventSuggestions = useMemo(() => {
    const set = new Set(rows.map((row) => row.event_name).filter(Boolean))
    return Array.from(set)
  }, [rows])

  const handleMarkAttendance = async (registrationId: string) => {
    if (!hasPermission('checkin', 'create')) {
      toast.error('You do not have permission to mark attendance')
      return
    }

    try {
      await checkInRegistration(registrationId)
      toast.success('Attendance marked successfully')
      setRows((prev) => prev.filter((row) => row.registration_id !== registrationId))
      await loadReport()
    } catch (error: any) {
      toast.error(error?.message || 'Unable to mark attendance')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance / Check-In"
        subtitle="Search participants, mark attendance, and monitor attendance reports"
      />

      <div className="bg-[#111] border border-[#333] rounded-lg p-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search participant by name or email"
            className="pl-10 bg-black border-[#333] text-white"
          />
        </div>

        <Input
          value={selectedEvent}
          onChange={(event) => setSelectedEvent(event.target.value)}
          list="checkin-events"
          placeholder="Filter by event"
          className="bg-black border-[#333] text-white"
        />
        <datalist id="checkin-events">
          {eventSuggestions.map((eventName) => (
            <option key={eventName} value={eventName} />
          ))}
        </datalist>

        <Button className="bg-white text-black hover:bg-gray-200" onClick={handleSearch}>
          Search Participant
        </Button>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#333] text-sm text-gray-400">Search Results</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-gray-400">
              <tr>
                <th className="text-left p-3">Check-In ID</th>
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">Participant Name</th>
                <th className="text-left p-3">Event Name</th>
                <th className="text-left p-3">Attendance Status</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-gray-500">Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-gray-500">No matching participants found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.registration_id} className="border-t border-[#222] text-white/90">
                    <td className="p-3 font-mono text-xs text-gray-400">CHK-{row.registration_id.slice(0, 8)}</td>
                    <td className="p-3 font-mono text-xs text-gray-400">{row.user_id.slice(0, 8)}...</td>
                    <td className="p-3">{row.participant_name}</td>
                    <td className="p-3">{row.event_name}</td>
                    <td className="p-3">
                      <span className="text-amber-400 text-xs uppercase tracking-wide">Pending</span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end">
                        <Button
                          className="bg-white text-black hover:bg-gray-200"
                          size="sm"
                          onClick={() => handleMarkAttendance(row.registration_id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Attendance
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Attendance Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="text-left p-2">Event Name</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Total Registrations</th>
                <th className="text-left p-2">Checked In</th>
                <th className="text-left p-2">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {attendanceReport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-gray-500">Run a search to refresh attendance report.</td>
                </tr>
              ) : (
                attendanceReport.map((item) => (
                  <tr key={`${item.event_name}-${item.event_date}`} className="border-t border-[#222] text-white/90">
                    <td className="p-2">{item.event_name}</td>
                    <td className="p-2">{item.event_date || '-'}</td>
                    <td className="p-2">{item.total}</td>
                    <td className="p-2">{item.checked_in}</td>
                    <td className="p-2">{item.attendance_rate}%</td>
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
