import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import {
  Search,
  CheckCircle,
  Users
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/_layout/checkin')({
  component: CheckInPage,
})

function CheckInPage() {
  const { hasPermission } = useAuth()
  const { events, participants, updateParticipant, isCheckInAllowed } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  if (!hasPermission('checkin', 'read')) {
    return <AccessDenied />
  }

  const availableEvents = events.filter(e => isCheckInAllowed(e.name))

  const handleSearch = () => {
    if (!selectedEvent || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const results = participants.filter(p =>
      p.event === selectedEvent &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setSearchResults(results)
  }

  const handleCheckIn = (participant: any) => {
    if (participant.checkIn) {
      toast.error('Participant already checked in')
      return
    }

    updateParticipant({ ...participant, checkIn: true })
    toast.success(`${participant.name} checked in successfully`)
    setSearchResults(prev => prev.filter(p => p.id !== participant.id))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check-In System"
        subtitle="Search and check-in participants for events"
      />

      <div className="bg-[#111] border border-[#333] rounded-lg p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Select Event</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Choose event" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {availableEvents.map(event => (
                  <SelectItem key={event.id} value={event.name}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Search Participant</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Name, Reg No, or Email"
                className="pl-10 bg-gray-800 border-gray-600 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full bg-gray-700 text-white hover:bg-gray-600"
              disabled={!selectedEvent || !searchQuery.trim()}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-[#111] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map(participant => (
              <div key={participant.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800 rounded-lg gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-black border border-[#333] rounded-lg hidden sm:block">
                    <Users className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg sm:text-base">{participant.name}</p>
                    <p className="text-gray-400 text-sm">{participant.regNo} • {participant.house}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCheckIn(participant)}
                  disabled={participant.checkIn}
                  size="lg"
                  className={`w-full sm:w-auto font-bold ${
                    participant.checkIn
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700'
                      : 'bg-white hover:bg-gray-200 text-black'
                  }`}
                >
                  {participant.checkIn ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Checked In
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {availableEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No events available for check-in</p>
          <p className="text-gray-500 text-sm mt-2">Enable check-in for events in the Events Management page</p>
        </div>
      )}
    </div>
  )
}