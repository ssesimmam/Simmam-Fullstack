import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData, AdminEvent } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import { 
  Search, 
  Users, 
  Clock,
  Edit
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

export const Route = createFileRoute('/admin/_layout/events')({
  component: EventsPage,
})

function EventsPage() {
  const { hasPermission } = useAuth()
  const { events, updateEvent } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null)

  if (!hasPermission('events', 'read')) {
    return <AccessDenied />
  }

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleFloat = (event: AdminEvent) => {
    updateEvent({ ...event, is_floated: !event.is_floated })
    toast.success(`Event ${event.name} is now ${!event.is_floated ? 'floated' : 'hidden from public'}`)
  }

  const handleToggleRegistration = (event: AdminEvent) => {
    updateEvent({ ...event, registration_open: !event.registration_open })
    toast.success(
      `Registration for ${event.name} is now ${!event.registration_open ? 'open' : 'closed'}`
    )
  }

  const handleToggleCheckIn = (event: AdminEvent) => {
    updateEvent({ ...event, checkin_enabled: !event.checkin_enabled })
    toast.success(
      `${event.name} check-in is now ${!event.checkin_enabled ? 'enabled' : 'disabled'}`
    )
  }

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvent) {
      updateEvent(editingEvent)
      setEditingEvent(null)
      toast.success('Event updated successfully')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events Management"
        subtitle="Control event visibility, registration, and check-in"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            className="pl-10 bg-gray-800 border-gray-600 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div 
            key={event.id}
            className="bg-[#111] border border-[#333] rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm text-gray-400 uppercase tracking-wide">{event.category}</div>
              {hasPermission('events', 'update') && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button 
                      className="p-1 text-gray-400 hover:text-white"
                      onClick={() => setEditingEvent(event)}
                    >
                      <Edit className="w-4 h-4" />
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
              )}
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{event.name}</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Float Event</span>
                <Switch
                  checked={event.is_floated}
                  onCheckedChange={() => handleToggleFloat(event)}
                  disabled={!hasPermission('events', 'update')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Open Registration</span>
                <Switch
                  checked={event.registration_open}
                  onCheckedChange={() => handleToggleRegistration(event)}
                  disabled={!hasPermission('events', 'update')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Enable Check-In</span>
                <Switch
                  checked={event.checkin_enabled}
                  onCheckedChange={() => handleToggleCheckIn(event)}
                  disabled={!hasPermission('events', 'update')}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#333] flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{event.participantCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="capitalize">{event.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}