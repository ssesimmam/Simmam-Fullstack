import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData, AdminEvent, type Participant, mapRemoteEventToAdminEvent, resolvePersistedEventId } from '@/lib/store'
import { createAdminEvent, updateAdminEvent, createAdminParticipant, updateAdminParticipant, deleteAdminRegistration, checkInRegistration, removeAdminCheckin } from '@/lib/adminApi'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import { 
  Search, 
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Users,
  Plus,
  Radio,
  Trophy,
  Medal
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { formatIstDayLabel } from '@/lib/dateTime'

export const Route = createFileRoute('/wch1925/_layout/data-entry')({
  component: DataEntryPage,
})

function DataEntryPage() {
  const { user } = useAuth()
  const { events, houses, participants, updateEvent, addEvent, updateParticipant, addParticipant, refreshData } = useData()
  const [activeTab, setActiveTab] = useState<'events' | 'participants' | 'live'>('events')
  const [searchQuery, setSearchQuery] = useState('')

  // Live page participation state
  const [liveSelectedEvent, setLiveSelectedEvent] = useState<string>('')
  const [liveParticipantToAdd, setLiveParticipantToAdd] = useState<string>('')

  // Event editing state
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null)
  const [eventDateError, setEventDateError] = useState<string>('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  // Participant editing state
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [expandedPEvents, setExpandedPEvents] = useState<Set<string>>(new Set())
  const [expandedPHouses, setExpandedPHouses] = useState<Set<string>>(new Set())

  // Add new state
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventCategory, setNewEventCategory] = useState('')
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10))

  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [newPName, setNewPName] = useState('')
  const [newPRegNo, setNewPRegNo] = useState('')
  const [newPEmail, setNewPEmail] = useState('')
  const [newPHouse, setNewPHouse] = useState('')
  const [newPEvent, setNewPEvent] = useState('')

  // Dev admin only
  if (user?.role !== 'developer_admin') {
    return <AccessDenied />
  }

  // ── Event helpers ──
  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) newExpanded.delete(eventId)
    else newExpanded.add(eventId)
    setExpandedEvents(newExpanded)
  }

  const getOrCreateEvent = async (event: AdminEvent): Promise<string> => {
    const liveEventId = await resolvePersistedEventId(event)
    if (!liveEventId.startsWith('event-')) return liveEventId

    const created = await createAdminEvent({
      name: event.name,
      description: event.description || 'No description provided.',
      category: event.category || 'Technical',
      main_category: event.mainCategory || 'Tech',
      date: (event as any).date || new Date().toISOString().split('T')[0],
      time_slot: event.time || '10:00 AM to 11:00 AM',
      venue: event.venue || 'Main Campus',
      capacity: event.participantCount || 0,
    })
    return created.id
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return

    if (!editingEvent.date) {
      setEventDateError('Event Date is required')
      return
    }

    const payload = {
      name: editingEvent.name,
      category: editingEvent.category,
      description: editingEvent.description,
      date: editingEvent.date,
      time_slot: editingEvent.time,
      venue: editingEvent.venue,
      capacity: editingEvent.participantCount,
      registration_open: editingEvent.registration_open,
      checkin_enabled: editingEvent.checkin_enabled,
      is_floated: editingEvent.is_floated,
      status: editingEvent.status,
    }

    try {
      const liveEventId = await getOrCreateEvent(editingEvent)
      const updated = await updateAdminEvent(liveEventId, payload)
      updateEvent(mapRemoteEventToAdminEvent(updated as any, editingEvent))
      setEditingEvent(null)
      void refreshData()
      toast.success('Event updated successfully')
    } catch (error: any) {
      setEditingEvent(null)
      toast.error(error?.message || 'Failed to update event')
    }
  }

  const applyLiveToggle = async (event: AdminEvent, nextLiveState: boolean) => {
    // Optimistic UI update
    updateEvent({
      ...event,
      is_live_tomorrow: nextLiveState,
      is_floated: nextLiveState ? true : event.is_floated,
      registration_open: nextLiveState ? true : event.registration_open,
    })

    try {
      const liveEventId = await getOrCreateEvent(event)

      const updated = await updateAdminEvent(liveEventId, {
        is_live_tomorrow: nextLiveState,
        is_floated: nextLiveState ? true : event.is_floated,
        registration_open: nextLiveState ? true : event.registration_open,
      })

      updateEvent({
        ...mapRemoteEventToAdminEvent(updated as any, event),
        is_live_tomorrow: nextLiveState,
        is_floated: nextLiveState ? true : event.is_floated,
        registration_open: nextLiveState ? true : event.registration_open,
      })
      void refreshData()
    } catch (err) {
      updateEvent(event)
      toast.error('Failed to toggle live state')
    }
  }

  const applyFloatToggle = async (event: AdminEvent, nextFloatState: boolean) => {
    updateEvent({
      ...event,
      is_floated: nextFloatState,
    })

    try {
      const liveEventId = await getOrCreateEvent(event)
      const updated = await updateAdminEvent(liveEventId, {
        is_floated: nextFloatState,
      })

      updateEvent({
        ...mapRemoteEventToAdminEvent(updated as any, event),
        is_floated: nextFloatState,
      })
      void refreshData()
    } catch (err) {
      updateEvent(event)
      toast.error('Failed to toggle float state')
    }
  }

  const applyRegistrationToggle = async (event: AdminEvent, nextRegistrationState: boolean) => {
    updateEvent({
      ...event,
      registration_open: nextRegistrationState,
    })

    try {
      const liveEventId = await getOrCreateEvent(event)
      const updated = await updateAdminEvent(liveEventId, {
        registration_open: nextRegistrationState,
      })

      updateEvent({
        ...mapRemoteEventToAdminEvent(updated as any, event),
        registration_open: nextRegistrationState,
      })
      void refreshData()
    } catch (err) {
      updateEvent(event)
      toast.error('Failed to toggle registration state')
    }
  }

  const handleAddEvent = async () => {
    if (!newEventName.trim() || !newEventCategory.trim() || !newEventDate) {
      toast.error('Event name, category and date are required')
      return
    }

    const newEvent: AdminEvent = {
      id: `event-${Date.now()}`,
      name: newEventName.trim(),
      category: newEventCategory.trim(),
      date: newEventDate,
      icon: events[0]?.icon || (() => null),
      mainCategory: 'Non-Tech',
      rules: [],
      is_floated: true,
      is_live_tomorrow: false,
      registration_open: true,
      checkin_enabled: false,
      status: 'upcoming',
      participantCount: 0,
      prizeInfo: 'Trophy + Certificate',
      result: undefined,
    }

    try {
      const created = await createAdminEvent({
        name: newEvent.name,
        description: newEvent.description || '',
        category: newEvent.category,
        main_category: newEvent.mainCategory,
        date: newEvent.date || new Date().toISOString().slice(0, 10),
        time_slot: newEvent.time || '00:00',
        venue: newEvent.venue || 'TBD',
        capacity: 0,
      })

      addEvent(mapRemoteEventToAdminEvent(created as any, {
        ...newEvent,
        id: created.id,
        is_floated: created.is_floated ?? newEvent.is_floated,
        registration_open: created.registration_open ?? newEvent.registration_open,
        checkin_enabled: created.checkin_enabled ?? newEvent.checkin_enabled,
        status: created.status === 'live' ? 'ongoing' : created.status || newEvent.status,
        venue: created.venue || newEvent.venue,
        time: created.time_slot || newEvent.time,
      } as AdminEvent))

      void refreshData()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create event')
      return
    }

    setNewEventName('')
    setNewEventCategory('')
    setShowAddEvent(false)
    toast.success(`Event "${newEvent.name}" created`)
  }

  // ── Participant helpers ──
  const filteredParticipantEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const togglePEvent = (eventName: string) => {
    const newExpanded = new Set(expandedPEvents)
    if (newExpanded.has(eventName)) newExpanded.delete(eventName)
    else newExpanded.add(eventName)
    setExpandedPEvents(newExpanded)
  }

  const togglePHouse = (key: string) => {
    const newExpanded = new Set(expandedPHouses)
    if (newExpanded.has(key)) newExpanded.delete(key)
    else newExpanded.add(key)
    setExpandedPHouses(newExpanded)
  }

  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParticipant) return

    try {
      const result = await updateAdminParticipant(editingParticipant.id, {
        status: editingParticipant.status,
        event_name: editingParticipant.event,
        email: editingParticipant.email,
        name: editingParticipant.name,
        register_number: editingParticipant.regNo,
        house: editingParticipant.house,
      })

      const wasCheckedIn = !!result.checked_in
      if (editingParticipant.checkIn !== wasCheckedIn) {
        if (editingParticipant.checkIn) {
          await checkInRegistration(editingParticipant.id)
        } else {
          await removeAdminCheckin(editingParticipant.id).catch(() => undefined)
        }
      }

      // Map API response back to Participant shape
      const mapped: Participant = {
        id: result.registration_id,
        name: result.participant_name,
        regNo: result.reg_no || '',
        email: result.email || editingParticipant.email,
        house: result.house || editingParticipant.house,
        event: result.event_name,
        status: (result.registration_status as any) || editingParticipant.status,
        checkIn: editingParticipant.checkIn,
        certificate: false,
      }

      updateParticipant(mapped)
      setEditingParticipant(null)
      void refreshData()
      toast.success('Participant updated successfully')
    } catch (error: any) {
      setEditingParticipant(null)
      toast.error(error?.message || 'Failed to update participant')
    }
  }

  const handleDeleteParticipant = async (participant: Participant) => {
    try {
      await deleteAdminRegistration(participant.id)
      void refreshData()
      toast.success(`${participant.name} deleted successfully`)
    } catch (error: any) {
      toast.error(error?.message || `Failed to delete ${participant.name}`)
    }
  }

  const handleAddParticipant = async () => {
    if (!newPName.trim() || !newPRegNo.trim() || !newPHouse || !newPEvent) {
      toast.error('Name, Reg No, House, and Event are required')
      return
    }

    if (!newPEmail.trim()) {
      toast.error('Email is required to persist participants to the backend')
      return
    }

    const newP: Participant = {
      id: `p-${Date.now()}`,
      name: newPName.trim(),
      regNo: newPRegNo.trim(),
      email: newPEmail.trim(),
      house: newPHouse,
      event: newPEvent,
      status: 'confirmed',
      checkIn: false,
      certificate: false,
    }

    try {
      const eventObj = findAdminEventByName(newP.event)
      if (eventObj) {
        await getOrCreateEvent(eventObj)
      }

      const created = await createAdminParticipant({
        email: newP.email,
        name: newP.name,
        register_number: newP.regNo,
        house: newP.house,
        event_name: newP.event,
      })

      addParticipant({
        ...newP,
        id: created.registration_id,
        event: created.event_name,
        status: created.registration_status as any,
        checkIn: !!created.checked_in,
      })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add participant')
      return
    }

    setNewPName('')
    setNewPRegNo('')
    setNewPEmail('')
    setNewPHouse('')
    setNewPEvent('')
    setShowAddParticipant(false)
    toast.success(`Participant "${newP.name}" added`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Entry"
        subtitle="Manual data editing — developer admin only"
      />

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab('events'); setSearchQuery('') }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'events'
              ? 'bg-white text-black'
              : 'bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:bg-black'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Events Management
        </button>
        <button
          onClick={() => { setActiveTab('participants'); setSearchQuery('') }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'participants'
              ? 'bg-white text-black'
              : 'bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:bg-black'
          }`}
        >
          <Users className="w-4 h-4" />
          Participant Management
        </button>
        <button
          onClick={() => { setActiveTab('live'); setSearchQuery('') }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'live'
              ? 'bg-white text-black'
              : 'bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:bg-black'
          }`}
        >
          <Radio className="w-4 h-4" />
          Live Page
        </button>
      </div>

      {/* Search — hidden on Live tab */}
      {activeTab !== 'live' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={activeTab === 'events' ? 'Search events...' : 'Search events for participants...'}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => activeTab === 'events' ? setShowAddEvent(true) : setShowAddParticipant(true)}
            className="bg-white text-black font-semibold hover:bg-gray-200 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'events' ? 'Event' : 'Participant'}
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* EVENTS MANAGEMENT TAB                        */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {/* Add Event Form */}
          {showAddEvent && (
            <div className="bg-[#111] border border-[#333] rounded-lg p-4 space-y-4">
              <h4 className="text-white font-medium text-sm">New Event</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Event Name</Label>
                  <Input
                    placeholder="e.g. Cricket"
                    className="bg-black border-[#333] text-white"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Category</Label>
                  <Input
                    placeholder="e.g. Sports"
                    className="bg-black border-[#333] text-white"
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Event Date</Label>
                  <Input
                    type="date"
                    className="bg-black border-[#333] text-white"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setShowAddEvent(false)}>Cancel</Button>
                <Button className="bg-white text-black font-semibold hover:bg-gray-200" onClick={handleAddEvent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </div>
          )}

          {filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id)

            return (
              <div key={event.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleEvent(event.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-black transition"
                >
                  <div className="flex items-center justify-between gap-4 flex-1 text-left">
                    <div>
                      <div className="text-white font-medium">{event.name}</div>
                      <div className="text-gray-500 text-sm">
                        {event.category} • <span className="capitalize">{event.status}</span> • {event.participantCount} participants
                      </div>
                    </div>
                    <div className="hidden md:block text-right text-xs text-gray-500">
                      <div>
                        {event.date ? formatIstDayLabel(event.date, { day: 'numeric', month: 'short' }) : 'Date TBA'}
                      </div>
                      <div>{event.time || 'Time TBA'}</div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-[#333] p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-black border border-[#333] rounded-lg p-3">
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Event Name</div>
                        <div className="text-white text-sm">{event.name}</div>
                      </div>
                      <div className="bg-black border border-[#333] rounded-lg p-3">
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Category</div>
                        <div className="text-white text-sm">{event.category}</div>
                      </div>
                      <div className="bg-black border border-[#333] rounded-lg p-3">
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Status</div>
                        <div className="text-white text-sm capitalize">{event.status}</div>
                      </div>
                      <div className="bg-black border border-[#333] rounded-lg p-3">
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Participants</div>
                        <div className="text-white text-sm">{event.participantCount}</div>
                      </div>
                      <div className="bg-black border border-[#333] rounded-lg p-3">
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Venue</div>
                        <div className="text-white text-sm">{event.venue || '—'}</div>
                      </div>
                      <div className="bg-black border border-[#333] rounded-lg p-3">
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Time</div>
                        <div className="text-white text-sm">{event.time || '—'}</div>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
                          onClick={() => {
                            setEditingEvent(event)
                            setEventDateError('')
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          Edit Event
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Edit Event: {event.name}</DialogTitle>
                        </DialogHeader>
                        {editingEvent && (
                          <form onSubmit={handleUpdateEvent} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-300">Event Name</Label>
                                <Input 
                                  value={editingEvent.name} 
                                  onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-300">Category</Label>
                                <Input 
                                  value={editingEvent.category} 
                                  onChange={(e) => setEditingEvent({...editingEvent, category: e.target.value})}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-300">Status</Label>
                                <Select 
                                  value={editingEvent.status} 
                                  onValueChange={(val: any) => setEditingEvent({...editingEvent, status: val})}
                                >
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="ongoing">Ongoing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-300">Participant Count</Label>
                                <Input 
                                  type="number"
                                  value={editingEvent.participantCount} 
                                  onChange={(e) => setEditingEvent({...editingEvent, participantCount: parseInt(e.target.value)})}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-300">Venue</Label>
                                <Input 
                                  placeholder="e.g. Main Auditorium"
                                  value={editingEvent.venue || ''} 
                                  onChange={(e) => setEditingEvent({...editingEvent, venue: e.target.value})}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-300">Event Date</Label>
                                <Input
                                  type="date"
                                  value={editingEvent.date || ''}
                                  onChange={(e) => {
                                    setEventDateError('')
                                    setEditingEvent({...editingEvent, date: e.target.value})
                                  }}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                                {eventDateError ? <p className="text-red-400 text-xs mt-1">{eventDateError}</p> : null}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-300">Time</Label>
                                <Input 
                                  placeholder="e.g. 10:00 AM - 12:00 PM"
                                  value={editingEvent.time || ''} 
                                  onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="bg-white text-black font-semibold hover:bg-gray-200 mt-4">
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* PARTICIPANT MANAGEMENT TAB                   */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'participants' && (
        <div className="space-y-3">
          {/* Add Participant Form */}
          {showAddParticipant && (
            <div className="bg-[#111] border border-[#333] rounded-lg p-4 space-y-4">
              <h4 className="text-white font-medium text-sm">New Participant</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Full Name</Label>
                  <Input placeholder="e.g. Aravind Kumar" className="bg-black border-[#333] text-white" value={newPName} onChange={(e) => setNewPName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Reg No</Label>
                  <Input placeholder="e.g. 2026SIM1234" className="bg-black border-[#333] text-white" value={newPRegNo} onChange={(e) => setNewPRegNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Email</Label>
                  <Input placeholder="e.g. name@simats.edu" className="bg-black border-[#333] text-white" value={newPEmail} onChange={(e) => setNewPEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">House</Label>
                  <Select value={newPHouse} onValueChange={setNewPHouse}>
                    <SelectTrigger className="bg-black border-[#333] text-white"><SelectValue placeholder="Select house..." /></SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#333]">
                      {houses.map(h => <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Event</Label>
                  <Select value={newPEvent} onValueChange={setNewPEvent}>
                    <SelectTrigger className="bg-black border-[#333] text-white"><SelectValue placeholder="Select event..." /></SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#333] max-h-[200px]">
                      {events.map(ev => <SelectItem key={ev.id} value={ev.name}>{ev.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setShowAddParticipant(false)}>Cancel</Button>
                <Button className="bg-white text-black font-semibold hover:bg-gray-200" onClick={handleAddParticipant}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Participant
                </Button>
              </div>
            </div>
          )}
          {filteredParticipantEvents.map(event => {
            const eventParticipants = participants.filter(p => p.event === event.name)
            const isEventExpanded = expandedPEvents.has(event.name)

            // Group by house
            const houseGroups = houses
              .map(house => ({
                houseName: house.name,
                houseAccent: house.accent,
                members: eventParticipants.filter(p => p.house === house.name),
              }))
              .filter(group => group.members.length > 0)

            return (
              <div key={event.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePEvent(event.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-black transition"
                >
                  <div className="text-left">
                    <div className="text-white font-medium">{event.name}</div>
                    <div className="text-gray-500 text-sm">
                      {eventParticipants.length} participant{eventParticipants.length !== 1 ? 's' : ''} • {houseGroups.length} house{houseGroups.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {isEventExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {isEventExpanded && (
                  <div className="border-t border-[#333]">
                    <div className="p-4 space-y-3">
                      {houseGroups.map(group => {
                        const houseKey = `${event.name}::${group.houseName}`
                        const isHouseExpanded = expandedPHouses.has(houseKey)

                        return (
                          <div key={houseKey} className="bg-black border border-[#333] rounded-lg overflow-hidden">
                            <button
                              onClick={() => togglePHouse(houseKey)}
                              className="w-full flex items-center justify-between p-3 hover:bg-[#111] transition"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: group.houseAccent }}
                                />
                                <span className="text-white font-medium">{group.houseName}</span>
                                <span className="text-gray-500 text-sm">
                                  {group.members.length} participant{group.members.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {isHouseExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>

                            {isHouseExpanded && (
                              <div className="border-t border-[#333] p-3 space-y-2">
                                {group.members.map(participant => (
                                  <div key={participant.id} className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-black rounded-lg">
                                        <Users className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <div>
                                        <div className="text-white font-medium">{participant.name}</div>
                                        <div className="text-gray-500 text-sm">
                                          {participant.regNo} • {participant.email} • <span className="capitalize">{participant.status}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <button
                                            className="p-1.5 text-gray-500 hover:text-white transition"
                                            onClick={() => setEditingParticipant(participant)}
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-gray-900 border-gray-700 text-white">
                                          <DialogHeader>
                                            <DialogTitle>Edit: {participant.name}</DialogTitle>
                                          </DialogHeader>
                                          {editingParticipant && (
                                            <form onSubmit={handleUpdateParticipant} className="space-y-4">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label className="text-gray-300">Name</Label>
                                                  <Input
                                                    value={editingParticipant.name}
                                                    onChange={(e) => setEditingParticipant({...editingParticipant, name: e.target.value})}
                                                    className="bg-gray-800 border-gray-600 text-white"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-gray-300">Reg No</Label>
                                                  <Input
                                                    value={editingParticipant.regNo}
                                                    onChange={(e) => setEditingParticipant({...editingParticipant, regNo: e.target.value})}
                                                    className="bg-gray-800 border-gray-600 text-white"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-gray-300">Email</Label>
                                                  <Input
                                                    value={editingParticipant.email}
                                                    onChange={(e) => setEditingParticipant({...editingParticipant, email: e.target.value})}
                                                    className="bg-gray-800 border-gray-600 text-white"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-gray-300">House</Label>
                                                  <Select
                                                    value={editingParticipant.house}
                                                    onValueChange={(val) => setEditingParticipant({...editingParticipant, house: val})}
                                                  >
                                                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-gray-800 border-gray-600">
                                                      {houses.map(h => (
                                                        <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-gray-300">Event</Label>
                                                  <Select
                                                    value={editingParticipant.event}
                                                    onValueChange={(val) => setEditingParticipant({...editingParticipant, event: val})}
                                                  >
                                                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-gray-800 border-gray-600">
                                                      {events.map(ev => (
                                                        <SelectItem key={ev.id} value={ev.name}>{ev.name}</SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-gray-300">Status</Label>
                                                  <Select
                                                    value={editingParticipant.status}
                                                    onValueChange={(val: any) => setEditingParticipant({...editingParticipant, status: val})}
                                                  >
                                                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-gray-800 border-gray-600">
                                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                                      <SelectItem value="pending">Pending</SelectItem>
                                                      <SelectItem value="waitlisted">Waitlisted</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-between pt-2">
                                                <span className="text-sm text-gray-300">Checked In</span>
                                                <Switch
                                                  checked={editingParticipant.checkIn}
                                                  onCheckedChange={(val) => setEditingParticipant({...editingParticipant, checkIn: val})}
                                                />
                                              </div>
                                              <DialogFooter>
                                                <Button type="submit" className="bg-white text-black font-semibold hover:bg-gray-200 mt-4">
                                                  Save Changes
                                                </Button>
                                              </DialogFooter>
                                            </form>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                      <button
                                        className="p-1.5 text-gray-500 hover:text-red-400 transition"
                                        onClick={() => handleDeleteParticipant(participant)}
                                        title="Delete registration"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {eventParticipants.length === 0 && (
                        <div className="text-center py-4 text-gray-600">
                          No participants registered
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* LIVE PAGE MANAGEMENT TAB                     */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'live' && (
        <div className="space-y-8">

          {/* Tomorrow's Events Toggle */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[#333] pb-3">
              <CalendarDays className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-semibold">Tomorrow's Floated Events</h3>
                <p className="text-xs text-gray-500">Toggle which events appear in the "Tomorrow's Events" section on the /live page</p>
              </div>
            </div>

            <div className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-[#111] border border-[#333] rounded-lg hover:bg-black transition">
                  <div>
                    <div className="text-white font-medium text-sm">{event.name}</div>
                    <div className="text-gray-500 text-xs">{event.category} • <span className="capitalize">{event.status}</span></div>
                    <div className="mt-1 text-xs text-gray-500">
                      {event.date ? formatIstDayLabel(event.date, { day: 'numeric', month: 'short' }) : 'Date TBA'} • {event.time || 'Time TBA'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`text-xs font-medium transition ${event.is_floated ? 'text-[#D4AF37]' : 'text-gray-600'}`}
                      onClick={() => void applyFloatToggle(event, !event.is_floated)}
                    >
                      {event.is_floated ? 'FLOATED' : 'FLOAT OFF'}
                    </button>
                    <Switch
                      checked={event.is_live_tomorrow}
                      onCheckedChange={(val) => void applyLiveToggle(event, val)}
                    />
                    <button
                      type="button"
                      className={`text-xs font-medium transition ${event.registration_open ? 'text-green-400' : 'text-red-400'}`}
                      onClick={() => void applyRegistrationToggle(event, !event.registration_open)}
                    >
                      {event.registration_open ? 'REG OPEN' : 'REG CLOSED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Results Editor */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[#333] pb-3">
              <Trophy className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-semibold">Event Results</h3>
                <p className="text-xs text-gray-500">Set winner, runner-up, and publish results to the /live page</p>
              </div>
            </div>

            <div className="space-y-3">
              {events.map(event => {
                const hasResult = event.result && (event.result.winnerHouse || event.result.runnerUpHouse)

                return (
                  <div key={event.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-white font-medium text-sm">{event.name}</div>
                          <div className="text-gray-500 text-xs">{event.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasResult && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.result?.isPublished ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-500 border border-[#333]'}`}>
                            {event.result?.isPublished ? 'Published' : 'Draft'}
                          </span>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#222] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition"
                              onClick={() => setEditingEvent(event)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              {hasResult ? 'Edit Result' : 'Set Result'}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700 text-white">
                            <DialogHeader>
                              <DialogTitle>Result: {event.name}</DialogTitle>
                            </DialogHeader>
                            {editingEvent && (
                              <form onSubmit={handleUpdateEvent} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-gray-300">Result Day</Label>
                                    <Input 
                                      placeholder="e.g. DAY 1"
                                      value={editingEvent.result?.resultDay || ''} 
                                      onChange={(e) => setEditingEvent({...editingEvent, result: {...editingEvent.result, resultDay: e.target.value} as any})}
                                      className="bg-gray-800 border-gray-600 text-white"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-300">Points Awarded</Label>
                                    <Input 
                                      type="number"
                                      placeholder="e.g. 100"
                                      value={editingEvent.result?.pointsAwarded || ''} 
                                      onChange={(e) => setEditingEvent({...editingEvent, result: {...editingEvent.result, pointsAwarded: parseInt(e.target.value)} as any})}
                                      className="bg-gray-800 border-gray-600 text-white"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-300">Winner House</Label>
                                    <Select
                                      value={editingEvent.result?.winnerHouse || ''}
                                      onValueChange={(val) => setEditingEvent({...editingEvent, result: {...editingEvent.result, winnerHouse: val} as any})}
                                    >
                                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                        <SelectValue placeholder="Select winner..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-800 border-gray-600">
                                        {houses.map(h => (
                                          <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-300">Runner-Up House</Label>
                                    <Select
                                      value={editingEvent.result?.runnerUpHouse || ''}
                                      onValueChange={(val) => setEditingEvent({...editingEvent, result: {...editingEvent.result, runnerUpHouse: val} as any})}
                                    >
                                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                        <SelectValue placeholder="Select runner-up..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-800 border-gray-600">
                                        {houses.map(h => (
                                          <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                                  <span className="text-sm text-gray-300">Publish to Live Page</span>
                                  <Switch
                                    checked={editingEvent.result?.isPublished || false}
                                    onCheckedChange={(val) => setEditingEvent({...editingEvent, result: {...editingEvent.result, isPublished: val} as any})}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="submit" className="bg-white text-black font-semibold hover:bg-gray-200 mt-4">
                                    Save Result
                                  </Button>
                                </DialogFooter>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Inline result preview */}
                    {hasResult && (
                      <div className="border-t border-[#222] px-4 py-3 bg-black/30 flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-gray-400">Winner:</span>
                          <span className="text-white font-medium">{event.result?.winnerHouse}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Medal className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-400">Runner-Up:</span>
                          <span className="text-white font-medium">{event.result?.runnerUpHouse}</span>
                        </div>
                        {event.result?.resultDay && (
                          <span className="text-gray-500">{event.result.resultDay}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Participation Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[#333] pb-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-semibold">Participation</h3>
                <p className="text-xs text-gray-500">View and assign participants to live events</p>
              </div>
            </div>

            {/* Event Selector Dropdown */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Select Event</Label>
              <Select value={liveSelectedEvent} onValueChange={(val) => { setLiveSelectedEvent(val); setLiveParticipantToAdd('') }}>
                <SelectTrigger className="bg-[#111] border-[#333] text-white">
                  <SelectValue placeholder="Choose an event to view participants..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#333] max-h-[280px]">
                  {events.filter(e => e.is_floated).map(ev => (
                    <SelectItem key={ev.id} value={ev.name}>{ev.name} — {ev.category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participants for Selected Event */}
            {liveSelectedEvent && (() => {
              const eventParticipants = participants.filter(p => p.event === liveSelectedEvent)
              // Participants not already in this event (for assignment dropdown)
              const assignableParticipants = participants.filter(
                p => p.event !== liveSelectedEvent
              )
              // Unique names for the dropdown (deduplicate by name+regNo)
              const seen = new Set<string>()
              const uniqueAssignable = assignableParticipants.filter(p => {
                const key = `${p.name}::${p.regNo}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
              })

              // Group by house
              const houseGroups = houses
                .map(house => ({
                  houseName: house.name,
                  houseAccent: house.accent,
                  members: eventParticipants.filter(p => p.house === house.name),
                }))
                .filter(group => group.members.length > 0)

              return (
                <div className="space-y-4">
                  {/* Assign Participant Dropdown */}
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 space-y-2 w-full">
                      <Label className="text-gray-400 text-xs">Assign Existing Participant</Label>
                      <Select value={liveParticipantToAdd} onValueChange={setLiveParticipantToAdd}>
                        <SelectTrigger className="bg-[#111] border-[#333] text-white">
                          <SelectValue placeholder="Select a participant to assign..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] max-h-[220px]">
                          {uniqueAssignable.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {p.regNo} ({p.house})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      disabled={!liveParticipantToAdd}
                      className="bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
                          onClick={async () => {
                        const source = participants.find(p => p.id === liveParticipantToAdd)
                        if (!source) return

                        try {
                          const updated = await updateAdminParticipant(source.id, { event_name: liveSelectedEvent, status: 'confirmed' })

                          const mapped: Participant = {
                            id: updated.registration_id,
                            name: updated.participant_name,
                            regNo: updated.reg_no || source.regNo,
                            email: updated.email || source.email,
                            house: updated.house || source.house,
                            event: updated.event_name,
                            status: (updated.registration_status as any) || 'confirmed',
                            checkIn: !!updated.checked_in,
                            certificate: false,
                          }

                          addParticipant(mapped)
                          setLiveParticipantToAdd('')
                          toast.success(`${source.name} assigned to ${liveSelectedEvent}`)
                        } catch (error: any) {
                          toast.error(error?.message || 'Failed to assign participant')
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assign
                    </Button>
                  </div>

                  {/* Participant List */}
                  <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-[#333] flex items-center justify-between">
                      <div className="text-white font-medium text-sm">{liveSelectedEvent}</div>
                      <span className="text-gray-500 text-xs">
                        {eventParticipants.length} participant{eventParticipants.length !== 1 ? 's' : ''} • {houseGroups.length} house{houseGroups.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {houseGroups.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {houseGroups.map(group => (
                          <div key={group.houseName} className="bg-black border border-[#333] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.houseAccent }}
                              />
                              <span className="text-white font-medium text-sm">{group.houseName}</span>
                              <span className="text-gray-500 text-xs">
                                {group.members.length} participant{group.members.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {group.members.map(p => (
                                <div key={p.id} className="flex items-center justify-between py-1.5 px-2 bg-[#111] rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-white">{p.name}</span>
                                    <span className="text-gray-600 text-xs">{p.regNo}</span>
                                  </div>
                                  <span className={`text-xs capitalize ${p.status === 'confirmed' ? 'text-green-400' : p.status === 'pending' ? 'text-yellow-400' : 'text-gray-500'}`}>
                                    {p.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        No participants assigned to this event yet
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
