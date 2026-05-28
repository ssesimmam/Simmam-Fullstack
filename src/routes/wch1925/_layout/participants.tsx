import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import { fetchAdminRegistrations, type AdminRegistrationRow } from '@/lib/adminApi'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { Users, CheckCircle, Calendar, ChevronDown, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/wch1925/_layout/participants')({
  component: ParticipantsPage,
})

function ParticipantsPage() {
  const { hasPermission } = useAuth()
  const { houses, events } = useData()
  const [registrations, setRegistrations] = useState<AdminRegistrationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [expandedHouses, setExpandedHouses] = useState<Set<string>>(new Set())

  const canRead = hasPermission('participants', 'read')

  // All hooks must run before any conditional return
  useEffect(() => {
    if (!canRead) return
    setLoading(true)
    void fetchAdminRegistrations()
      .then((data) => {
        setRegistrations(data)
      })
      .catch(() => {
        setRegistrations([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [canRead])

  if (!canRead) {
    return <AccessDenied />
  }

  const apiParticipants = registrations.map((row) => ({
    id: row.registration_id,
    name: row.participant_name,
    regNo: row.reg_no || '',
    email: row.email,
    house: row.house || 'Unknown',
    event: row.event_name,
    status: (row.registration_status as 'confirmed' | 'pending' | 'waitlisted') || 'confirmed',
    checkIn: !!row.checked_in,
    certificate: false,
  }))

  const effectiveParticipants = apiParticipants
  const totalParticipants = effectiveParticipants.length
  const checkedInCount = effectiveParticipants.filter(p => p.checkIn).length

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
        {loading ? (
          <p className="text-gray-500 text-sm">Loading participants...</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {houses.map(house => {
              const count = effectiveParticipants.filter(p => p.house === house.name).length
              return (
                <div key={house.name} className="bg-black border border-[#333] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: house.accent || 'gray' }}
                    />
                    <div className="text-gray-500 font-medium">{house.name}</div>
                  </div>
                  <div className="text-white text-2xl font-bold">{count}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Event-wise Participants</h3>
        {events.map(event => {
          const eventParticipants = effectiveParticipants.filter(p => p.event === event.name)
          const checkedIn = eventParticipants.filter(p => p.checkIn).length
          const isEventExpanded = expandedEvents.has(event.name)

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
                                style={{ backgroundColor: group.houseAccent || 'gray' }}
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