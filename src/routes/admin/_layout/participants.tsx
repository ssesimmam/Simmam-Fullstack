import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, CheckCircle, ChevronDown, ChevronRight, Users } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'

export const Route = createFileRoute('/admin/_layout/participants')({
  component: ParticipantsPage,
})

function ParticipantsPage() {
  const { hasPermission } = useAuth()
  const { participants, houses, events } = useData()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  if (!hasPermission('participants', 'read')) {
    return <AccessDenied />
  }

  const totalParticipants = participants.length
  const checkedInCount = participants.filter((participant) => participant.checkIn).length

  const houseCounts = houses.map((house) => ({
    name: house.name,
    count: participants.filter((participant) => participant.house === house.name).length,
  }))

  const toggleEvent = (eventName: string) => {
    const nextExpanded = new Set(expandedEvents)
    if (nextExpanded.has(eventName)) {
      nextExpanded.delete(eventName)
    } else {
      nextExpanded.add(eventName)
    }

    setExpandedEvents(nextExpanded)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Participants Overview" subtitle="Live participant details and check-in status" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-[#333] bg-black p-3">
              <Users className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalParticipants}</p>
              <p className="text-sm text-gray-500">Total Participants</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-[#333] bg-black p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{checkedInCount}</p>
              <p className="text-sm text-gray-500">Checked In</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#333] bg-[#111] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">House-wise Counts</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {houseCounts.map((house) => (
            <div key={house.name} className="rounded-lg border border-[#333] bg-black p-4">
              <div className="font-medium text-gray-500">{house.name}</div>
              <div className="text-2xl font-bold text-white">{house.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Event-wise Participants</h3>
        {events.map((event) => {
          const eventParticipants = participants.filter((participant) => participant.event === event.name)
          const checkedIn = eventParticipants.filter((participant) => participant.checkIn).length
          const isExpanded = expandedEvents.has(event.name)

          return (
            <div key={event.id} className="overflow-hidden rounded-lg border border-[#333] bg-[#111]">
              <button onClick={() => toggleEvent(event.name)} className="flex w-full items-center justify-between p-4 transition hover:bg-black">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg border border-[#333] bg-black p-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">{event.name}</div>
                    <div className="text-sm text-gray-500">{eventParticipants.length} participants • {checkedIn} checked in</div>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="border-t border-[#333]">
                  <div className="space-y-3 p-4">
                    {eventParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between rounded-lg border border-[#333] bg-black p-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-[#111] p-2">
                            <Users className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{participant.name}</div>
                            <div className="text-sm text-gray-500">{participant.regNo} • {participant.email} • {participant.house}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.checkIn ? (
                            <div className="flex items-center gap-2 text-white">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Checked In</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">Not checked in</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {eventParticipants.length === 0 && <div className="py-4 text-center text-gray-600">No participants registered</div>}
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