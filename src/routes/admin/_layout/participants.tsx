import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import { Users, CheckCircle, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const checkedInCount = participants.filter(p => p.checkIn).length

  const houseCounts = houses.map(house => ({
    name: house.name,
    count: participants.filter(p => p.house === house.name).length
  }))

  const toggleEvent = (eventName: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventName)) {
      newExpanded.delete(eventName)
    } else {
      newExpanded.add(eventName)
    }
    setExpandedEvents(newExpanded)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participants Overview"
        subtitle="Live participant details and check-in status"
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
          {houseCounts.map(house => (
            <div key={house.name} className="bg-black border border-[#333] rounded-lg p-4">
              <div className="text-gray-500 font-medium">{house.name}</div>
              <div className="text-white text-2xl font-bold">{house.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Event-wise Participants</h3>
        {events.map(event => {
          const eventParticipants = participants.filter(p => p.event === event.name)
          const checkedIn = eventParticipants.filter(p => p.checkIn).length
          const isExpanded = expandedEvents.has(event.name)

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
                      {eventParticipants.length} participants • {checkedIn} checked in
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-[#333]">
                  <div className="p-4 space-y-3">
                    {eventParticipants.map(participant => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-black border border-[#333] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#111] rounded-lg">
                            <Users className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{participant.name}</div>
                            <div className="text-gray-500 text-sm">
                              {participant.regNo} • {participant.email} • {participant.house}
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
                        </div>
                      </div>
                    ))}
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