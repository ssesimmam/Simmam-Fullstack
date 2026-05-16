import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData, type Participant } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import { Users, CheckCircle, Calendar, ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react'
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

export const Route = createFileRoute('/admin/_layout/participants')({
  component: ParticipantsPage,
})

function ParticipantsPage() {
  const { hasPermission } = useAuth()
  const { participants, houses, events, updateParticipant } = useData()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [expandedHouses, setExpandedHouses] = useState<Set<string>>(new Set())
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)

  if (!hasPermission('participants', 'read')) {
    return <AccessDenied />
  }

  const canEdit = hasPermission('participants', 'update')

  const totalParticipants = participants.length
  const checkedInCount = participants.filter(p => p.checkIn).length

  const toggleEvent = (eventName: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventName)) {
      newExpanded.delete(eventName)
    } else {
      newExpanded.add(eventName)
    }
    setExpandedEvents(newExpanded)
  }

  const toggleHouse = (key: string) => {
    const newExpanded = new Set(expandedHouses)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedHouses(newExpanded)
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
        title="Participants Overview"
        subtitle="Event-wise participant details grouped by house"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-lg border border-[#333]">
              <Users className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalParticipants}</p>
              <p className="text-gray-500 text-sm">Total Participants</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-lg border border-[#333]">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{checkedInCount}</p>
              <p className="text-gray-500 text-sm">Checked In</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">House-wise Counts</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map(house => {
            const count = participants.filter(p => p.house === house.name).length
            return (
              <div key={house.name} className="bg-black border border-[#333] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: house.accent }}
                  />
                  <div className="text-gray-500 font-medium">{house.name}</div>
                </div>
                <div className="text-white text-2xl font-bold">{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Event-wise Participants</h3>
        {events.map(event => {
          const eventParticipants = participants.filter(p => p.event === event.name)
          const checkedIn = eventParticipants.filter(p => p.checkIn).length
          const isEventExpanded = expandedEvents.has(event.name)

          // Group participants by house within this event
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
                onClick={() => toggleEvent(event.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-black transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-black border border-[#333] rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">{event.name}</div>
                    <div className="text-gray-500 text-sm">
                      {eventParticipants.length} participant{eventParticipants.length !== 1 ? 's' : ''} • {checkedIn} checked in • {houseGroups.length} house{houseGroups.length !== 1 ? 's' : ''}
                    </div>
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
                      const isHouseExpanded = expandedHouses.has(houseKey)
                      const houseCheckedIn = group.members.filter(p => p.checkIn).length

                      return (
                        <div key={houseKey} className="bg-black border border-[#333] rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleHouse(houseKey)}
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
                                {houseCheckedIn > 0 && ` • ${houseCheckedIn} checked in`}
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
                                        {participant.regNo} • {participant.email}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {participant.checkIn ? (
                                      <div className="flex items-center gap-2 text-white">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm">Checked In</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-600 text-sm">Not checked in</span>
                                    )}

                                    {canEdit && (
                                      <div className="flex items-center gap-1 ml-2">
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
                                              <DialogTitle>Edit Participant: {participant.name}</DialogTitle>
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
                                    )}
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
    </div>
  )
}