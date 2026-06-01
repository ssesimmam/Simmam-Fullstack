import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Download, Edit3, Search, Trash2 } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import {
  deleteAdminRegistration,
  exportAdminRegistrationsCsv,
  fetchAdminRegistrations,
  updateAdminParticipant,
  type AdminRegistrationRow,
} from '@/lib/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatIstDateTime } from '@/lib/dateTime'

type RegistrationForm = {
  participant_name: string
  email: string
  reg_no: string
  house: string
  event_name: string
  registration_status: string
}

const emptyForm: RegistrationForm = {
  participant_name: '',
  email: '',
  reg_no: '',
  house: '',
  event_name: '',
  registration_status: 'confirmed',
}

export const Route = createFileRoute('/wch1925/_layout/registrations')({
  component: RegistrationsPage,
})

function RegistrationsPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [rows, setRows] = useState<AdminRegistrationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<AdminRegistrationRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<RegistrationForm>(emptyForm)

  const canUpdate = hasPermission('registrations', 'update')
  const canDelete = hasPermission('registrations', 'delete')

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

  const openEditDialog = (row: AdminRegistrationRow) => {
    setEditingRow(row)
    setForm({
      participant_name: row.participant_name || '',
      email: row.email || '',
      reg_no: row.reg_no || '',
      house: row.house || '',
      event_name: row.event_name || '',
      registration_status: row.registration_status || 'confirmed',
    })
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingRow(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!editingRow) return

    if (!form.participant_name.trim()) {
      toast.error('Participant name is required')
      return
    }

    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!form.event_name.trim()) {
      toast.error('Event name is required')
      return
    }

    if (!canUpdate) {
      toast.error('You do not have permission to edit registrations')
      return
    }

    setIsSaving(true)
    try {
      await updateAdminParticipant(editingRow.registration_id, {
        name: form.participant_name.trim(),
        email: form.email.trim(),
        register_number: form.reg_no.trim() || undefined,
        house: form.house.trim() || undefined,
        event_name: form.event_name.trim(),
        status: form.registration_status,
      })
      toast.success('Registration updated')
      closeEditor()
      await loadRegistrations()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update registration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (row: AdminRegistrationRow) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete registrations')
      return
    }

    if (!window.confirm(`Delete registration for ${row.participant_name}?`)) {
      return
    }

    setIsDeletingId(row.registration_id)
    try {
      await deleteAdminRegistration(row.registration_id)
      toast.success('Registration deleted')
      await loadRegistrations()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete registration')
    } finally {
      setIsDeletingId(null)
    }
  }

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
                <th className="text-left p-3">Register No</th>
                <th className="text-left p-3">Participant Name</th>
                <th className="text-left p-3">Event Name</th>
                <th className="text-left p-3">Registration Date</th>
                <th className="text-left p-3">Registration Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-gray-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.registration_id} className="border-t border-[#222] text-white/90">
                    <td className="p-3 font-mono text-xs text-gray-400">{row.reg_no || '-'}</td>
                    <td className="p-3">{row.participant_name}</td>
                    <td className="p-3">{row.event_name}</td>
                    <td className="p-3 text-gray-400">{row.registration_date ? formatIstDateTime(row.registration_date) : '-'}</td>
                    <td className="p-3 uppercase text-xs tracking-wide text-gray-300">{row.registration_status}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-[#333] bg-black text-white hover:bg-[#1a1a1a]"
                          onClick={() => openEditDialog(row)}
                          disabled={!canUpdate}
                        >
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-red-900/60 bg-black text-red-300 hover:bg-red-950/40 hover:text-red-200"
                          onClick={() => void handleDelete(row)}
                          disabled={!canDelete || isDeletingId === row.registration_id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeletingId === row.registration_id ? 'Deleting...' : 'Delete'}
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

      <Dialog open={editorOpen} onOpenChange={(open) => (open ? setEditorOpen(true) : closeEditor())}>
        <DialogContent className="max-w-2xl border-[#333] bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="registration-participant">Participant Name</Label>
              <Input
                id="registration-participant"
                value={form.participant_name}
                onChange={(event) => setForm((current) => ({ ...current, participant_name: event.target.value }))}
                className="bg-black border-[#333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-email">Email</Label>
              <Input
                id="registration-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="bg-black border-[#333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-number">Register No</Label>
              <Input
                id="registration-number"
                value={form.reg_no}
                onChange={(event) => setForm((current) => ({ ...current, reg_no: event.target.value }))}
                className="bg-black border-[#333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-house">House</Label>
              <Input
                id="registration-house"
                value={form.house}
                onChange={(event) => setForm((current) => ({ ...current, house: event.target.value }))}
                className="bg-black border-[#333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-event">Event</Label>
              <Select
                value={form.event_name}
                onValueChange={(value) => setForm((current) => ({ ...current, event_name: value }))}
              >
                <SelectTrigger id="registration-event" className="bg-black border-[#333] text-white">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueEvents.map((eventName) => (
                    <SelectItem key={eventName} value={eventName}>
                      {eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-status">Status</Label>
              <Select
                value={form.registration_status}
                onValueChange={(value) => setForm((current) => ({ ...current, registration_status: value }))}
              >
                <SelectTrigger id="registration-status" className="bg-black border-[#333] text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-[#333] bg-black text-white hover:bg-[#1a1a1a]" onClick={closeEditor}>
                Cancel
              </Button>
              <Button className="bg-white text-black hover:bg-gray-200" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
