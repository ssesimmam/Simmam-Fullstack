import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Edit, Plus, Search, Trash2, XCircle, CheckCircle2 } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { useData, type AdminEvent, mapRemoteEventToAdminEvent, resolvePersistedEventId } from '@/lib/store'
import { createAdminEvent, deleteAdminEvent, updateAdminEvent } from '@/lib/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/events')({
  component: EventsPage,
})

type EventForm = {
  name: string
  description: string
  category: string
  date: string
  time: string
  venue: string
  maxParticipants: string
  registrationDeadline: string
  rules: string
}

const emptyForm: EventForm = {
  name: '',
  description: '',
  category: '',
  date: '',
  time: '',
  venue: '',
  maxParticipants: '',
  registrationDeadline: '',
  rules: '',
}

function EventsPage() {
  const { hasPermission, user } = useAuth()
  const { events, addEvent, updateEvent, deleteEvent, refreshData } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)

  if (!hasPermission('events', 'read')) {
    return <AccessDenied />
  }

  const canManage = user?.role === 'developer_admin'

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return events
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.mainCategory.toLowerCase().includes(query),
    )
  }, [events, searchQuery])

  const persistEventPatch = async (event: AdminEvent, patch: Record<string, unknown>) => {
    const liveEventId = await resolvePersistedEventId(event)
    const updated = await updateAdminEvent(liveEventId, patch)
    const mapped = mapRemoteEventToAdminEvent(updated as any, event)
    updateEvent(mapped)
    void refreshData()
    return mapped
  }

  const syncFormFromEvent = (event: AdminEvent) => {
    setForm({
      name: event.name,
      description: event.description || '',
      category: event.category || '',
      date: (event as any).date || '',
      time: event.time || '',
      venue: event.venue || '',
      maxParticipants: event.participantCount ? String(event.participantCount) : '',
      registrationDeadline: '',
      rules: (event.rules || []).join('\n'),
    })
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'Event Name is required'
    if (!form.description.trim()) return 'Event Description is required'
    if (!form.category.trim()) return 'Event Category is required'
    if (!form.date) return 'Event Date is required'
    if (!form.time.trim()) return 'Event Time is required'
    if (!form.venue.trim()) return 'Event Venue is required'
    if (!form.maxParticipants.trim()) return 'Maximum Participants is required'
    if (!form.rules.trim()) return 'Event Rules are required'
    return null
  }

  const handleCreate = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const created = await createAdminEvent({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        main_category: form.category.trim(),
        date: form.date,
        time_slot: form.time.trim(),
        venue: form.venue.trim(),
        capacity: Number(form.maxParticipants),
      })

      addEvent(mapRemoteEventToAdminEvent(created as any, {
        ...emptyForm,
        id: created.id,
        name: created.name,
        description: created.description || '',
        category: created.category || form.category.trim(),
        mainCategory: created.main_category || form.category.trim(),
        venue: created.venue || form.venue.trim(),
        time: created.time_slot || form.time.trim(),
        date: created.date || form.date,
        icon: events[0]?.icon,
        rules: events[0]?.rules || [],
        is_floated: created.is_floated ?? true,
        is_live_tomorrow: false,
        registration_open: created.registration_open ?? true,
        checkin_enabled: created.checkin_enabled ?? false,
        status: created.status === 'live' ? 'ongoing' : created.status || 'upcoming',
        participantCount: created.capacity ?? Number(form.maxParticipants),
        prizeInfo: created.prize_info || 'Trophy + Certificate',
        result: undefined,
      } as AdminEvent))

      void refreshData()
      setShowCreate(false)
      setForm(emptyForm)
      toast.success('Event created')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create event')
    }
  }

  const handleUpdate = async () => {
    if (!editingEvent) return

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const updated = await persistEventPatch(editingEvent, {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        main_category: form.category.trim(),
        date: form.date,
        time_slot: form.time.trim(),
        venue: form.venue.trim(),
        capacity: Number(form.maxParticipants),
      })

      setEditingEvent(null)
      setForm(emptyForm)
      toast.success('Event updated')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update event')
    }
  }

  const handleDelete = async (event: AdminEvent) => {
    if (!window.confirm(`Delete event: ${event.name}?`)) return

    try {
      await deleteAdminEvent(await resolvePersistedEventId(event))
      await refreshData()
      toast.success('Event deleted')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete event')
    }
  }

  const handleToggleRegistration = async (event: AdminEvent) => {
    try {
      await persistEventPatch(event, { registration_open: !event.registration_open })
      toast.success(`Registration ${event.registration_open ? 'closed' : 'opened'} for ${event.name}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to toggle registration')
    }
  }

  const handleToggleFloat = async (event: AdminEvent) => {
    try {
      await persistEventPatch(event, { is_floated: !event.is_floated })
      toast.success(`${event.is_floated ? 'Removed from' : 'Added to'} floated events for ${event.name}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to toggle floated state')
    }
  }

  const handleToggleLiveTomorrow = async (event: AdminEvent, nextLiveState?: boolean) => {
    try {
      const enabled = nextLiveState ?? !event.is_live_tomorrow
      await persistEventPatch(event, {
        is_live_tomorrow: enabled,
        is_floated: enabled ? true : event.is_floated,
        registration_open: enabled ? true : event.registration_open,
      })
      toast.success(`${enabled ? 'Marked live tomorrow' : 'Removed from live tomorrow'} for ${event.name}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to toggle live status')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Management"
        subtitle="Create and manage all events with full admin controls"
      />

      <div className="bg-[#111] border border-[#333] rounded-lg p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search events"
            className="pl-10 bg-black border-[#333] text-white"
          />
        </div>

        {canManage && (
          <Button
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => {
              setForm(emptyForm)
              setShowCreate(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-gray-400">
              <tr>
                <th className="text-left p-3">Event Name</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Date / Time</th>
                <th className="text-left p-3">Venue</th>
                <th className="text-left p-3">Max Participants</th>
                <th className="text-left p-3">Registration</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-t border-[#222] text-white/90">
                  <td className="p-3">
                    <p>{event.name}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-72">{event.description || '-'}</p>
                  </td>
                  <td className="p-3">{event.category}</td>
                  <td className="p-3 text-gray-300">{(event as any).date || '-'} • {event.time || '-'}</td>
                  <td className="p-3 text-gray-300">{event.venue || '-'}</td>
                  <td className="p-3">{event.participantCount}</td>
                  <td className="p-3">
                    <span className={`text-xs uppercase tracking-wide ${event.registration_open ? 'text-green-400' : 'text-red-400'}`}>
                      {event.registration_open ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className={event.is_floated ? 'border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10' : 'border-gray-500/40 text-gray-400 hover:bg-gray-500/10'}
                            onClick={() => void handleToggleFloat(event)}
                          >
                            {event.is_floated ? 'Floated' : 'Float Off'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className={event.is_live_tomorrow ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10' : 'border-gray-500/40 text-gray-400 hover:bg-gray-500/10'}
                            onClick={() => void handleToggleLiveTomorrow(event)}
                          >
                            {event.is_live_tomorrow ? 'LIVE Tomorrow' : 'Mark LIVE'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className={event.registration_open ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}
                            onClick={() => void handleToggleRegistration(event)}
                          >
                            {event.registration_open ? (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Close Registration
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Open Registration
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDelete(event)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Event
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111] border-[#333] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <EventFormFields form={form} setForm={setForm} />
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-white text-black hover:bg-gray-200"
              onPointerDown={() => { /* noop for pointer down */ }}
              onClick={() => {
                // Create clicked (debug log removed)
                toast('Creating...')
                void handleCreate()
              }}
            >
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="bg-[#111] border-[#333] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventFormFields form={form} setForm={setForm} />
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-white text-black hover:bg-gray-200"
              onPointerDown={() => { /* noop for pointer down */ }}
              onClick={() => {
                // Save clicked (debug log removed)
                toast('Saving...')
                void handleUpdate()
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EventFormFields({
  form,
  setForm,
}: {
  form: EventForm
  setForm: (next: EventForm) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2 md:col-span-2">
        <Label>Event Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-black border-[#333]" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Event Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="bg-black border-[#333]"
        />
      </div>

      <div className="space-y-2">
        <Label>Event Category</Label>
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-black border-[#333]" />
      </div>

      <div className="space-y-2">
        <Label>Event Date</Label>
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-black border-[#333]" />
      </div>

      <div className="space-y-2">
        <Label>Event Time</Label>
        <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="bg-black border-[#333]" placeholder="10:00" />
      </div>

      <div className="space-y-2">
        <Label>Event Venue</Label>
        <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="bg-black border-[#333]" />
      </div>

      <div className="space-y-2">
        <Label>Maximum Participants</Label>
        <Input
          type="number"
          value={form.maxParticipants}
          onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
          className="bg-black border-[#333]"
        />
      </div>

      <div className="space-y-2">
        <Label>Registration Deadline</Label>
        <Input
          type="date"
          value={form.registrationDeadline}
          onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
          className="bg-black border-[#333]"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Event Rules (one per line)</Label>
        <Textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="bg-black border-[#333]" />
      </div>
    </div>
  )
}
