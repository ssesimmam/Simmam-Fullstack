import { createFileRoute } from '@tanstack/react-router'
import { Calendar, CheckCircle, Shield, Trophy, Users } from 'lucide-react'

import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'

export const Route = createFileRoute('/admin/_layout/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { user } = useAuth()
  const { events, participants, houses } = useData()

  const totalParticipants = participants.length
  const checkedInCount = participants.filter((participant) => participant.checkIn).length
  const liveEvents = events.filter((event) => event.status === 'ongoing').length

  const houseCounts = houses
    .map((house) => ({
      name: house.name,
      count: participants.filter((participant) => participant.house === house.name).length,
      points: house.points2026,
    }))
    .sort((left, right) => right.points - left.points)

  const floatedEvents = events.filter((event) => event.is_floated)
  const registrationOpenEvents = events.filter((event) => event.registration_open)
  const checkInEnabledEvents = events.filter((event) => event.checkin_enabled)

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle={`Welcome back, ${user?.name || 'Admin'}`} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CheckCircle className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{checkedInCount}</p>
              <p className="text-sm text-gray-500">Checked In</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-[#333] bg-black p-3">
              <Calendar className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{liveEvents}</p>
              <p className="text-sm text-gray-500">Live Events</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-[#333] bg-black p-3">
              <Shield className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{houses.length}</p>
              <p className="text-sm text-gray-500">Houses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Event Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Floated Events</span>
              <span className="font-medium text-white">{floatedEvents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Registration Open</span>
              <span className="font-medium text-white">{registrationOpenEvents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Check-In Enabled</span>
              <span className="font-medium text-white">{checkInEnabledEvents.length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Leaderboard</h3>
          <div className="space-y-3">
            {houseCounts.slice(0, 3).map((house, index) => (
              <div key={house.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className={`h-4 w-4 ${index === 0 ? 'text-white' : 'text-gray-600'}`} />
                  <span className="text-gray-400">{house.name}</span>
                </div>
                <span className="font-medium text-white">{(house.points || 0).toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#333] bg-[#111] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">House-wise Participants</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {houseCounts.map((house) => (
            <div key={house.name} className="rounded-lg border border-[#333] bg-black p-4">
              <div className="font-medium text-gray-500">{house.name}</div>
              <div className="text-xl font-bold text-white">{house.count}</div>
              <div className="text-xs text-gray-600">{(house.points || 0).toLocaleString()} points</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}