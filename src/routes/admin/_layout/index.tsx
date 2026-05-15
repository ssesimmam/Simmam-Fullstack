import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import PageHeader from '@/components/admin/shared/PageHeader'
import { Calendar, Users, CheckCircle, Trophy, Shield } from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { user } = useAuth()
  const { events, participants, houses } = useData()

  const totalParticipants = participants.length
  const checkedInCount = participants.filter(p => p.checkIn).length
  const liveEvents = events.filter(e => e.status === 'ongoing').length

  const houseCounts = houses.map(house => ({
    name: house.name,
    count: participants.filter(p => p.house === house.name).length,
    points: house.points2026
  })).sort((a, b) => b.points - a.points)

  const floatedEvents = events.filter(e => e.is_floated)
  const registrationOpenEvents = events.filter(e => e.registration_open)
  const checkInEnabledEvents = events.filter(e => e.checkin_enabled)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Admin'}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CheckCircle className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{checkedInCount}</p>
              <p className="text-gray-500 text-sm">Checked In</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-lg border border-[#333]">
              <Calendar className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{liveEvents}</p>
              <p className="text-gray-500 text-sm">Live Events</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-lg border border-[#333]">
              <Shield className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{houses.length}</p>
              <p className="text-gray-500 text-sm">Houses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Event Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Floated Events</span>
              <span className="text-white font-medium">{floatedEvents.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Registration Open</span>
              <span className="text-white font-medium">{registrationOpenEvents.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Check-In Enabled</span>
              <span className="text-white font-medium">{checkInEnabledEvents.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Leaderboard</h3>
          <div className="space-y-3">
            {houseCounts.slice(0, 3).map((house, index) => (
              <div key={house.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className={`w-4 h-4 ${index === 0 ? 'text-white' : 'text-gray-600'}`} />
                  <span className="text-gray-400">{house.name}</span>
                </div>
                <span className="text-white font-medium">{(house.points || 0).toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">House-wise Participants</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {houseCounts.map(house => (
            <div key={house.name} className="bg-black border border-[#333] rounded-lg p-4">
              <div className="text-gray-500 font-medium">{house.name}</div>
              <div className="text-white text-xl font-bold">{house.count}</div>
              <div className="text-gray-600 text-xs">{(house.points || 0).toLocaleString()} points</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}