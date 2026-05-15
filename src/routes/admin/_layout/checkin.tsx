import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle, Search, Users } from 'lucide-react'
import { toast } from 'sonner'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'

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

  const availableEvents = events.filter((event) => isCheckInAllowed(event.name))

  const handleSearch = () => {
    if (!selectedEvent || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const results = participants.filter(
      (participant) =>
        participant.event === selectedEvent &&
        (participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.email.toLowerCase().includes(searchQuery.toLowerCase())),
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
    setSearchResults((previous) => previous.filter((entry) => entry.id !== participant.id))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Check-In System" subtitle="Search and check-in participants for events" />

      <div className="rounded-lg border border-[#333] bg-[#111] p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Select Event</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                <SelectValue placeholder="Choose event" />
              </SelectTrigger>
              <SelectContent className="border-gray-600 bg-gray-800">
                {availableEvents.map((event) => (
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Name, Reg No, or Email"
                className="border-gray-600 bg-gray-800 pl-10 text-white"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={handleSearch} className="w-full bg-gray-700 text-white hover:bg-gray-600" disabled={!selectedEvent || !searchQuery.trim()}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map((participant) => (
              <div key={participant.id} className="flex flex-col gap-4 rounded-lg bg-gray-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="hidden rounded-lg border border-[#333] bg-black p-2 sm:block">
                    <Users className="h-5 w-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white sm:text-base">{participant.name}</p>
                    <p className="text-sm text-gray-400">{participant.regNo} • {participant.house}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCheckIn(participant)}
                  disabled={participant.checkIn}
                  size="lg"
                  className={`w-full font-bold sm:w-auto ${participant.checkIn ? 'cursor-not-allowed border border-gray-700 bg-gray-800 text-gray-400' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  {participant.checkIn ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
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
        <div className="py-12 text-center">
          <p className="text-gray-400">No events available for check-in</p>
          <p className="mt-2 text-sm text-gray-500">Enable check-in for events in the Events Management page</p>
        </div>
      )}
    </div>
  )
}