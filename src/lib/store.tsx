import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { allEvents as initialEvents, type Event } from './eventsData'
import { houses as initialHouses, type House } from './houses'

export interface AdminEvent extends Event {
  id: string
  is_floated: boolean
  registration_open: boolean
  checkin_enabled: boolean
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  participantCount: number
  prizeInfo: string
}

export interface Participant {
  id: string
  name: string
  regNo: string
  email: string
  house: string
  event: string
  status: 'confirmed' | 'pending' | 'waitlisted'
  checkIn: boolean
  certificate: boolean
}

export interface PointTransaction {
  id: string
  houseName: string
  points: number
  reason: string
  timestamp: string
  issuedBy: string
}

interface DataContextType {
  events: AdminEvent[]
  houses: House[]
  participants: Participant[]
  updateEvent: (updatedEvent: AdminEvent) => void
  updateHouse: (updatedHouse: House) => void
  updateParticipant: (updatedParticipant: Participant) => void
  updateHousePoints: (houseName: string, points: number, reason?: string, issuedBy?: string) => void
  pointsHistory: PointTransaction[]
  findAdminEventByName: (name: string) => AdminEvent | undefined
  isRegistrationAllowed: (eventName: string) => boolean
  isCheckInAllowed: (eventName: string) => boolean
  settings: {
    festivalStatus: 'pre' | 'live' | 'post'
    registrationsOpen: boolean
    coordinatorAssignments: Record<string, string>
  }
  updateSettings: (newSettings: any) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const initializeEvents = (): AdminEvent[] => {
  return initialEvents.map((event, index) => ({
    ...event,
    id: `event-${index}`,
    is_floated: true,
    registration_open: true,
    checkin_enabled: false,
    status: 'upcoming',
    participantCount: Math.floor(Math.random() * 150) + 20,
    prizeInfo: 'Trophy + Certificate',
  }))
}

const generateMockParticipants = (events: AdminEvent[], houses: House[]): Participant[] => {
  const participants: Participant[] = []
  const names = ['Aravind', 'Bhavana', 'Chandra', 'Deepak', 'Eshwar', 'Farzana', 'Gautam', 'Hema', 'Indira', 'Jeevan']

  for (let index = 0; index < 50; index += 1) {
    const event = events[Math.floor(Math.random() * events.length)]
    const house = houses[Math.floor(Math.random() * houses.length)]

    participants.push({
      id: `p-${index}`,
      name: `${names[index % names.length]} ${String.fromCharCode(65 + (index % 26))}`,
      regNo: `2026SIM${1000 + index}`,
      email: `${names[index % names.length].toLowerCase()}@example.com`,
      house: house.name,
      event: event.name,
      status: 'confirmed',
      checkIn: Math.random() > 0.5,
      certificate: false,
    })
  }

  return participants
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [settings, setSettings] = useState({
    festivalStatus: 'pre' as const,
    registrationsOpen: true,
    coordinatorAssignments: {} as Record<string, string>,
  })
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedEvents = localStorage.getItem('simmam_events')
    const storedHouses = localStorage.getItem('simmam_houses')
    const storedParticipants = localStorage.getItem('simmam_participants')
    const storedSettings = localStorage.getItem('simmam_settings')
    const storedPointsHistory = localStorage.getItem('simmam_points_history')

    const initialAdminEvents = initializeEvents()

    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents)
      const reattachedEvents = parsedEvents.map((event: any) => {
        const staticEvent = initialEvents.find((stored) => stored.name === event.name)

        return {
          ...event,
          icon: staticEvent?.icon || initialEvents[0].icon,
        }
      })

      setEvents(reattachedEvents)
    } else {
      setEvents(initialAdminEvents)
    }

    if (storedHouses) {
      const parsedHouses = JSON.parse(storedHouses)
      const migratedHouses = parsedHouses.map((house: any) => ({
        ...house,
        points2026: house.points2026 ?? house.points2025 ?? 0,
      }))

      setHouses(migratedHouses)
    } else {
      setHouses(initialHouses)
    }

    if (storedParticipants) {
      setParticipants(JSON.parse(storedParticipants))
    } else {
      setParticipants(generateMockParticipants(initialAdminEvents, initialHouses))
    }

    if (storedSettings) setSettings(JSON.parse(storedSettings))
    if (storedPointsHistory) setPointsHistory(JSON.parse(storedPointsHistory))
  }, [])

  const updateEvent = (updatedEvent: AdminEvent) => {
    const nextEvents = events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    setEvents(nextEvents)
    localStorage.setItem('simmam_events', JSON.stringify(nextEvents))
  }

  const updateHouse = (updatedHouse: House) => {
    const nextHouses = houses.map((house) => (house.name === updatedHouse.name ? updatedHouse : house))
    setHouses(nextHouses)
    localStorage.setItem('simmam_houses', JSON.stringify(nextHouses))
  }

  const updateParticipant = (updatedParticipant: Participant) => {
    const nextParticipants = participants.map((participant) =>
      participant.id === updatedParticipant.id ? updatedParticipant : participant,
    )
    setParticipants(nextParticipants)
    localStorage.setItem('simmam_participants', JSON.stringify(nextParticipants))
  }

  const updateHousePoints = (houseName: string, points: number, reason?: string, issuedBy: string = 'Admin') => {
    const nextHouses = houses.map((house) => {
      if (house.name === houseName) {
        return {
          ...house,
          points2026: Number(house.points2026 ?? 0) + Number(points),
        }
      }

      return house
    })

    setHouses(nextHouses)
    localStorage.setItem('simmam_houses', JSON.stringify(nextHouses))

    if (reason || points < 0) {
      const newTransaction: PointTransaction = {
        id: `tx-${Date.now()}`,
        houseName,
        points,
        reason: reason || 'Point adjustment',
        timestamp: new Date().toISOString(),
        issuedBy,
      }

      const nextHistory = [newTransaction, ...pointsHistory]
      setPointsHistory(nextHistory)
      localStorage.setItem('simmam_points_history', JSON.stringify(nextHistory))
    }
  }

  const updateSettings = (newSettings: any) => {
    setSettings(newSettings)
    localStorage.setItem('simmam_settings', JSON.stringify(newSettings))
  }

  const findAdminEventByName = (name: string): AdminEvent | undefined => {
    return events.find((event) => event.name === name)
  }

  const isRegistrationAllowed = (eventName: string): boolean => {
    const event = findAdminEventByName(eventName)
    return event ? event.is_floated && event.registration_open : false
  }

  const isCheckInAllowed = (eventName: string): boolean => {
    const event = findAdminEventByName(eventName)
    return event ? event.checkin_enabled : false
  }

  return (
    <DataContext.Provider
      value={{
        events,
        houses,
        participants,
        updateEvent,
        updateHouse,
        updateParticipant,
        updateHousePoints,
        pointsHistory,
        findAdminEventByName,
        isRegistrationAllowed,
        isCheckInAllowed,
        settings,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }

  return context
}