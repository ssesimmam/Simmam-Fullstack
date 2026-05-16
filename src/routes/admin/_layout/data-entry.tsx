import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData, AdminEvent, type Participant } from '@/lib/store'
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
  Users
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

export const Route = createFileRoute('/admin/_layout/data-entry')({
  component: DataEntryPage,
})

function DataEntryPage() {
  const { user } = useAuth()
  const { events, houses, participants, updateEvent, updateParticipant } = useData()
  const [activeTab, setActiveTab] = useState<'events' | 'participants'>('events')
  const [searchQuery, setSearchQuery] = useState('')

  // Event editing state
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  // Participant editing state
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [expandedPEvents, setExpandedPEvents] = useState<Set<string>>(new Set())
  const [expandedPHouses, setExpandedPHouses] = useState<Set<string>>(new Set())

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

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvent) {
      updateEvent(editingEvent)
      setEditingEvent(null)
      toast.success('Event updated successfully')
    }
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

  const handleUpdateParticipant = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingParticipant) {
      updateParticipant(editingParticipant)
      setEditingParticipant(null)
      toast.success('Participant updated successfully')
    }
  }

  const handleDeleteParticipant = (participant: Participant) => {
    updateParticipant({ ...participant, status: 'waitlisted' as const })
    toast.success(`${participant.name} moved to waitlisted`)
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
      </div>

      {/* Search */}
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
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* EVENTS MANAGEMENT TAB                        */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id)

            return (
              <div key={event.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleEvent(event.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-black transition"
                >
                  <div className="text-left">
                    <div className="text-white font-medium">{event.name}</div>
                    <div className="text-gray-500 text-sm">
                      {event.category} • <span className="capitalize">{event.status}</span> • {event.participantCount} participants
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
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
                    </div>

                    {event.result && (
                      <div className="mb-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Results</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black border border-[#333] rounded-lg p-3">
                            <div className="text-gray-500 text-xs mb-1">Winner</div>
                            <div className="text-white text-sm">{event.result.winnerHouse || '—'}</div>
                          </div>
                          <div className="bg-black border border-[#333] rounded-lg p-3">
                            <div className="text-gray-500 text-xs mb-1">Runner-Up</div>
                            <div className="text-white text-sm">{event.result.runnerUpHouse || '—'}</div>
                          </div>
                          <div className="bg-black border border-[#333] rounded-lg p-3">
                            <div className="text-gray-500 text-xs mb-1">Points</div>
                            <div className="text-white text-sm">{event.result.pointsAwarded || '—'}</div>
                          </div>
                          <div className="bg-black border border-[#333] rounded-lg p-3">
                            <div className="text-gray-500 text-xs mb-1">Day</div>
                            <div className="text-white text-sm">{event.result.resultDay || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
                          onClick={() => setEditingEvent(event)}
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
                            </div>
                            <div className="space-y-4 pt-4 border-t border-gray-700 mt-4">
                              <h4 className="font-semibold text-white">Event Results</h4>
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
                                  <Input 
                                    placeholder="e.g. Agniyas"
                                    value={editingEvent.result?.winnerHouse || ''} 
                                    onChange={(e) => setEditingEvent({...editingEvent, result: {...editingEvent.result, winnerHouse: e.target.value} as any})}
                                    className="bg-gray-800 border-gray-600 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-gray-300">Runner-Up House</Label>
                                  <Input 
                                    placeholder="e.g. Rudras"
                                    value={editingEvent.result?.runnerUpHouse || ''} 
                                    onChange={(e) => setEditingEvent({...editingEvent, result: {...editingEvent.result, runnerUpHouse: e.target.value} as any})}
                                    className="bg-gray-800 border-gray-600 text-white"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Publish Results</span>
                                <Switch
                                  checked={editingEvent.result?.isPublished || false}
                                  onCheckedChange={(val) => setEditingEvent({...editingEvent, result: {...editingEvent.result, isPublished: val} as any})}
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
                                        title="Move to waitlisted"
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
    </div>
  )
}
