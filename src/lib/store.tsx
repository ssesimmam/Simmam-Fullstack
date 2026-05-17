import { allEvents as initialEvents, type Event } from './eventsData';
import { houses as initialHouses, type House } from './houses';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Extend Event type for admin features
export interface EventResult {
  winnerHouse: string;
  runnerUpHouse: string;
  pointsAwarded: number;
  resultDay: string;
  isPublished: boolean;
}

export interface AdminEvent extends Event {
  id: string;
  venue?: string;
  time?: string;
  is_floated: boolean;
  is_live_tomorrow: boolean;
  registration_open: boolean;
  checkin_enabled: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  participantCount: number;
  prizeInfo: string;
  result?: EventResult;
}

export interface Participant {
  id: string;
  name: string;
  regNo: string;
  email: string;
  house: string;
  event: string;
  status: 'confirmed' | 'pending' | 'waitlisted';
  checkIn: boolean;
  certificate: boolean;
}

export interface PointTransaction {
  id: string;
  houseName: string;
  points: number;
  reason: string;
  timestamp: string;
  issuedBy: string;
}

interface DataContextType {
  events: AdminEvent[];
  houses: House[];
  participants: Participant[];
  updateEvent: (updatedEvent: AdminEvent) => void;
  addEvent: (newEvent: AdminEvent) => void;
  updateHouse: (updatedHouse: House) => void;
  updateParticipant: (updatedParticipant: Participant) => void;
  addParticipant: (newParticipant: Participant) => void;
  updateHousePoints: (houseName: string, points: number, reason?: string, issuedBy?: string) => void;
  pointsHistory: PointTransaction[];
  findAdminEventByName: (name: string) => AdminEvent | undefined;
  isRegistrationAllowed: (eventName: string) => boolean;
  isCheckInAllowed: (eventName: string) => boolean;
  settings: {
    festivalStatus: 'pre' | 'live' | 'post';
    registrationsOpen: boolean;
    coordinatorAssignments: Record<string, string>;
  };
  updateSettings: (newSettings: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to initialize admin events from static data
const initializeEvents = (): AdminEvent[] => {
  return initialEvents.map((e, index) => ({
    ...e,
    id: `event-${index}`,
    is_floated: true,
    is_live_tomorrow: false,
    registration_open: true,
    checkin_enabled: false,
    status: 'upcoming',
    participantCount: Math.floor(Math.random() * 150) + 20, // Random mock count
    prizeInfo: 'Trophy + Certificate',
    result: undefined
  }));
};

// Mock participants
const generateMockParticipants = (events: AdminEvent[], houses: House[]): Participant[] => {
  const participants: Participant[] = [];
  const firstNames = [
    "Aravind", "Bhavana", "Chandra", "Deepak", "Eshwar", "Farzana", "Gautam", "Hema", "Indira", "Jeevan",
    "Kavya", "Lakshmi", "Manoj", "Nithya", "Omkar", "Priya", "Rajan", "Sneha", "Tarun", "Uma",
    "Vikram", "Wasim", "Yamini", "Zara", "Aditi", "Balaji", "Charulata", "Dinesh", "Esha", "Farhan"
  ];
  const lastNames = [
    "Krishnan", "Reddy", "Sharma", "Iyer", "Nair", "Patel", "Gupta", "Joshi", "Menon", "Pillai",
    "Rao", "Sundaram", "Venkat", "Bhat", "Das", "Kumar", "Singh", "Murugan", "Rajan", "Subramanian"
  ];
  const statuses: Array<'confirmed' | 'pending' | 'waitlisted'> = ['confirmed', 'confirmed', 'confirmed', 'pending', 'waitlisted'];

  // Seed-like counter for deterministic but varied distribution
  let counter = 0;

  // Ensure every event gets participants from multiple houses
  for (const event of events) {
    // Each event gets 2-5 participants per house
    for (const house of houses) {
      const countForThisGroup = 2 + (counter % 4); // 2 to 5
      for (let j = 0; j < countForThisGroup; j++) {
        const fnIndex = counter % firstNames.length;
        const lnIndex = (counter * 7 + j) % lastNames.length;
        const statusIndex = (counter + j) % statuses.length;
        participants.push({
          id: `p-${counter}`,
          name: `${firstNames[fnIndex]} ${lastNames[lnIndex]}`,
          regNo: `2026SIM${1000 + counter}`,
          email: `${firstNames[fnIndex].toLowerCase()}.${lastNames[lnIndex].toLowerCase()}@simats.edu`,
          house: house.name,
          event: event.name,
          status: statuses[statusIndex],
          checkIn: counter % 3 !== 0,
          certificate: false
        });
        counter++;
      }
    }
  }

  return participants;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AdminEvent[]>(() => initializeEvents());
  const [houses, setHouses] = useState<House[]>(() =>
    initialHouses.map((h) => ({
      ...h,
      points2026: h.points2026 ?? h.points2025 ?? 0,
    })),
  );
  const [participants, setParticipants] = useState<Participant[]>(() =>
    generateMockParticipants(initializeEvents(), initialHouses),
  );
  const [settings, setSettings] = useState({
    festivalStatus: 'pre' as const,
    registrationsOpen: true,
    coordinatorAssignments: {} as Record<string, string>,
  });
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>([]);

  useEffect(() => {
    const storedEvents = localStorage.getItem('simmam_events');
    const storedHouses = localStorage.getItem('simmam_houses');
    const storedParticipants = localStorage.getItem('simmam_participants');
    const storedSettings = localStorage.getItem('simmam_settings');
    const storedPointsHistory = localStorage.getItem('simmam_points_history');

    const initialAdminEvents = initializeEvents();
    
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents);
      const reattachedEvents = parsedEvents.map((e: any) => {
        const staticEvent = initialEvents.find(se => se.name === e.name);
        return { 
          ...e, 
          icon: staticEvent?.icon || initialEvents[0].icon // Fallback to first static icon
        };
      });
      setEvents(reattachedEvents);
    } else {
      setEvents(initialAdminEvents);
    }

    if (storedHouses) {
      const parsedHouses = JSON.parse(storedHouses);
      // Migration: If old data has points2025 but not points2026, migrate it
      const migratedHouses = parsedHouses.map((h: any) => ({
        ...h,
        points2026: h.points2026 ?? h.points2025 ?? 0
      }));
      setHouses(migratedHouses);
    } else {
      setHouses(initialHouses);
    }

    if (storedParticipants) setParticipants(JSON.parse(storedParticipants));
    else setParticipants(generateMockParticipants(initialAdminEvents, initialHouses));

    if (storedSettings) setSettings(JSON.parse(storedSettings));
    if (storedPointsHistory) setPointsHistory(JSON.parse(storedPointsHistory));
  }, []);

  const updateEvent = (updatedEvent: AdminEvent) => {
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(newEvents);
    localStorage.setItem('simmam_events', JSON.stringify(newEvents));
  };

  const addEvent = (newEvent: AdminEvent) => {
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('simmam_events', JSON.stringify(updatedEvents));
  };

  const updateHouse = (updatedHouse: House) => {
    const newHouses = houses.map(h => h.name === updatedHouse.name ? updatedHouse : h);
    setHouses(newHouses);
    localStorage.setItem('simmam_houses', JSON.stringify(newHouses));
  };

  const updateParticipant = (updatedParticipant: Participant) => {
    const newParticipants = participants.map(p => p.id === updatedParticipant.id ? updatedParticipant : p);
    setParticipants(newParticipants);
    localStorage.setItem('simmam_participants', JSON.stringify(newParticipants));
  };

  const addParticipant = (newParticipant: Participant) => {
    const updatedParticipants = [...participants, newParticipant];
    setParticipants(updatedParticipants);
    localStorage.setItem('simmam_participants', JSON.stringify(updatedParticipants));
  };

  const updateHousePoints = (houseName: string, points: number, reason?: string, issuedBy: string = 'Admin') => {
    const newHouses = houses.map(h => {
      if (h.name === houseName) {
        return { 
          ...h, 
          points2026: Number(h.points2026 ?? 0) + Number(points) 
        };
      }
      return h;
    });
    setHouses(newHouses);
    localStorage.setItem('simmam_houses', JSON.stringify(newHouses));

    if (reason || points < 0) {
      const newTransaction: PointTransaction = {
        id: `tx-${Date.now()}`,
        houseName,
        points,
        reason: reason || 'Point adjustment',
        timestamp: new Date().toISOString(),
        issuedBy
      };
      const newHistory = [newTransaction, ...pointsHistory];
      setPointsHistory(newHistory);
      localStorage.setItem('simmam_points_history', JSON.stringify(newHistory));
    }
  };

  const updateSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('simmam_settings', JSON.stringify(newSettings));
  };

  const findAdminEventByName = (name: string): AdminEvent | undefined => {
    return events.find(e => e.name === name);
  };

  const isRegistrationAllowed = (eventName: string): boolean => {
    const event = findAdminEventByName(eventName);
    return event ? event.is_floated && event.registration_open : false;
  };

  const isCheckInAllowed = (eventName: string): boolean => {
    const event = findAdminEventByName(eventName);
    return event ? event.checkin_enabled : false;
  };

  return (
    <DataContext.Provider value={{ 
      events, 
      houses, 
      participants, 
      updateEvent, 
      addEvent,
      updateHouse, 
      updateParticipant, 
      addParticipant,
      updateHousePoints,
      pointsHistory,
      findAdminEventByName,
      isRegistrationAllowed,
      isCheckInAllowed,
      settings,
      updateSettings
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
