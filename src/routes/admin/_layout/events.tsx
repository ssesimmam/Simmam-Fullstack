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
  MapPin
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/_layout/events')({
  component: EventsPage,
})

function EventsPage() {
  const { user, hasPermission } = useAuth()
  const isDev = user?.role === 'developer_admin'
  const { events, updateEvent } = useData()
  const [searchQuery, setSearchQuery] = useState('')

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

            {isDev && (event.venue || event.time) && (
              <div className="mt-4 pt-3 border-t border-[#333] space-y-1.5">
                {event.venue && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{event.venue}</span>
                  </div>
                )}
                {event.time && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{event.time}</span>
                  </div>
                )}
              </div>
            )}

            <div className={`${isDev && (event.venue || event.time) ? 'mt-3' : 'mt-4'} pt-4 border-t border-[#333] flex items-center justify-between text-sm text-gray-500`}>
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