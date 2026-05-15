import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Clock, Edit, Search, Users } from 'lucide-react'
import { toast } from 'sonner'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth'
import { useData, type AdminEvent } from '@/lib/store'

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

  const filteredEvents = events.filter(
    (event) => event.name.toLowerCase().includes(searchQuery.toLowerCase()) || event.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleToggleFloat = (event: AdminEvent) => {
    updateEvent({ ...event, is_floated: !event.is_floated })
    toast.success(`Event ${event.name} is now ${!event.is_floated ? 'floated' : 'hidden from public'}`)
  }

  const handleToggleRegistration = (event: AdminEvent) => {
    updateEvent({ ...event, registration_open: !event.registration_open })
    toast.success(`Registration for ${event.name} is now ${!event.registration_open ? 'open' : 'closed'}`)
  }

  const handleToggleCheckIn = (event: AdminEvent) => {
    updateEvent({ ...event, checkin_enabled: !event.checkin_enabled })
    toast.success(`${event.name} check-in is now ${!event.checkin_enabled ? 'enabled' : 'disabled'}`)
  }

  const handleUpdateEvent = (formEvent: React.FormEvent) => {
    formEvent.preventDefault()
    if (editingEvent) {
      updateEvent(editingEvent)
      setEditingEvent(null)
      toast.success('Event updated successfully')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Events Management" subtitle="Control event visibility, registration, and check-in" />

      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search events..."
            className="border-gray-600 bg-gray-800 pl-10 text-white"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div key={event.id} className="rounded-lg border border-[#333] bg-[#111] p-4">
            <div className="mb-4 flex items-start justify-between">
              <div className="text-sm uppercase tracking-wide text-gray-400">{event.category}</div>
              {hasPermission('events', 'update') && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="p-1 text-gray-400 hover:text-white"
                      onClick={() => setEditingEvent(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="border-gray-700 bg-gray-900 text-white">
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
                              onChange={(eventChange) => setEditingEvent({ ...editingEvent, name: eventChange.target.value })}
                              className="border-gray-600 bg-gray-800 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Category</Label>
                            <Input
                              value={editingEvent.category}
                              onChange={(eventChange) => setEditingEvent({ ...editingEvent, category: eventChange.target.value })}
                              className="border-gray-600 bg-gray-800 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Status</Label>
                            <Select value={editingEvent.status} onValueChange={(value: any) => setEditingEvent({ ...editingEvent, status: value })}>
                              <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-gray-600 bg-gray-800">
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
                              onChange={(eventChange) => setEditingEvent({ ...editingEvent, participantCount: parseInt(eventChange.target.value) })}
                              className="border-gray-600 bg-gray-800 text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Prize Info</Label>
                          <Input
                            value={editingEvent.prizeInfo}
                            onChange={(eventChange) => setEditingEvent({ ...editingEvent, prizeInfo: eventChange.target.value })}
                            className="border-gray-600 bg-gray-800 text-white"
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-gray-700 text-white hover:bg-gray-600">
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <h3 className="mb-2 text-lg font-semibold text-white">{event.name}</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Float Event</span>
                <Switch checked={event.is_floated} onCheckedChange={() => handleToggleFloat(event)} disabled={!hasPermission('events', 'update')} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Open Registration</span>
                <Switch checked={event.registration_open} onCheckedChange={() => handleToggleRegistration(event)} disabled={!hasPermission('events', 'update')} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Enable Check-In</span>
                <Switch checked={event.checkin_enabled} onCheckedChange={() => handleToggleCheckIn(event)} disabled={!hasPermission('events', 'update')} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#333] pt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{event.participantCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="capitalize">{event.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}