import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Search } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import {
  checkInRegistration,
  removeAdminCheckin,
  fetchAdminRegistrations,
  fetchAttendanceReport,
} from '@/lib/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/checkin')({
  component: CheckInPage,
})

function CheckInPage() {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [attendanceReport, setAttendanceReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const canRead = hasPermission('checkin', 'read')

  // All hooks must run before any conditional returns (React Rules of Hooks)
  const eventSuggestions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.event_name).filter(Boolean)))
  }, [rows])

  const loadReport = async () => {
    try {
      const report = await fetchAttendanceReport()
      setAttendanceReport(report)
    } catch {
      setAttendanceReport([])
    }
  }

  const loadData = async (search?: string, event?: string) => {
    setLoading(true)
    try {
      const registrations = await fetchAdminRegistrations({
        search: search || undefined,
        event: event || undefined,
      })
      setRows(registrations)
      await loadReport()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load data')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canRead) return
    void loadData()
  }, [canRead])

  const handleSearch = () => {
    void loadData(searchQuery, selectedEvent)
  }

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
      if (error?.message?.includes('already_checked_in')) {
        toast.error('This registration has already been checked in')
      } else {
        toast.error(error?.message || 'Unable to mark attendance')
      }
    }
  }

  const handleRemoveAttendance = async (registrationId: string) => {
    if (!hasPermission('checkin', 'delete')) {
      toast.error('You do not have permission to edit attendance')
      return
    }

    try {
      await removeAdminCheckin(registrationId)
      toast.success('Attendance removed successfully')
      await loadData(searchQuery, selectedEvent)
    } catch (error: any) {
      toast.error(error?.message || 'Unable to remove attendance')
    }
  }

  if (!canRead) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance / Check-In"
        subtitle="Mark participant attendance. Check In to confirm OD eligibility."
      />

      {/* Search bar */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by participant name or email..."
            className="pl-10 bg-black border-[#333] text-white"
          />
        </div>
        <Input
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          list="checkin-events"
          placeholder="Filter by event..."
          className="bg-black border-[#333] text-white sm:w-56"
        />
        <datalist id="checkin-events">
          {eventSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Button className="bg-white text-black hover:bg-gray-200 shrink-0" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" /> Search
        </Button>
      </div>

      {/* Participant list */}
      <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
          <span className="text-sm text-gray-400">Participants</span>
          <span className="text-xs text-gray-600">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="divide-y divide-[#222]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-white/10 rounded" />
                  <div className="h-3 w-28 bg-white/6 rounded" />
                </div>
                <div className="h-9 w-24 bg-white/8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-500 text-sm">
            No participants found.
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {rows.map((row) => (
              <div
                key={row.registration_id}
                className="flex items-center justify-between px-4 py-4 hover:bg-black/30 transition"
              >
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{row.participant_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{row.event_name}</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    <span className="font-mono text-gray-300">{row.reg_no || '-'}</span>
                    <span className="mx-2 text-gray-600">•</span>
                    <span>{row.house || '-'}</span>
                  </p>
                </div>

                <div className="shrink-0 ml-4">
                  {row.checked_in ? (
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-700/40 text-green-400 text-xs font-bold uppercase tracking-wide"
                      onClick={() => handleRemoveAttendance(row.registration_id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Checked In - Remove
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 bg-white hover:bg-gray-200 text-black text-xs font-bold rounded-lg transition"
                      onClick={() => handleMarkAttendance(row.registration_id)}
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Report */}
      {attendanceReport.length > 0 && (
        <div className="bg-[#111] border border-[#333] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Attendance Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Checked In</th>
                  <th className="text-left p-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {attendanceReport.map((item) => (
                  <tr key={`${item.event_name}-${item.event_date}`} className="border-t border-[#222] text-white/90">
                    <td className="p-2">{item.event_name}</td>
                    <td className="p-2 text-gray-400">{item.event_date || '-'}</td>
                    <td className="p-2">{item.total}</td>
                    <td className="p-2 text-green-400">{item.checked_in}</td>
                    <td className="p-2 text-[#D4AF37]">{item.attendance_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
