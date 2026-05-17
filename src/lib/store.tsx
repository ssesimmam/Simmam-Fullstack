import { allEvents as initialEvents, type Event } from './eventsData';
import { houses as initialHouses, type House } from './houses';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchLeaderboard } from './apiClient';
import { fetchAdminEvents, fetchAdminHouses, fetchAdminRegistrations, fetchAdminSettings, type AdminSettings } from './adminApi';

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
  deleteEvent: (eventId: string) => void;
  updateHouse: (updatedHouse: House) => void;
  updateParticipant: (updatedParticipant: Participant) => void;
  addParticipant: (newParticipant: Participant) => void;
  updateHousePoints: (houseName: string, points: number, reason?: string, issuedBy?: string) => void;
  pointsHistory: PointTransaction[];
  findAdminEventByName: (name: string) => AdminEvent | undefined;
  isRegistrationAllowed: (eventName: string) => boolean;
  isCheckInAllowed: (eventName: string) => boolean;
  settings: AdminSettings;
  updateSettings: (newSettings: any) => void;
  refreshData: () => Promise<void>; // New refresh function
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

const mapEventStatus = (status?: string): AdminEvent['status'] => {
  if (status === 'live' || status === 'ongoing') return 'ongoing';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'upcoming';
};

const mapRemoteEventsToAdminEvents = (remoteEvents: Awaited<ReturnType<typeof fetchAdminEvents>>): AdminEvent[] => {
  const fallback = initialEvents[0];
  return remoteEvents.map((remoteEvent, index) => {
    const staticEvent = initialEvents.find((event) => event.name.toLowerCase() === remoteEvent.name.toLowerCase());
    const base = staticEvent || fallback;

    return {
      ...base,
      id: remoteEvent.id,
      name: remoteEvent.name,
      category: remoteEvent.category || base.category,
      mainCategory: (remoteEvent.main_category as any) || base.mainCategory,
      venue: remoteEvent.venue || (base as any).venue,
      time: remoteEvent.time_slot || undefined,
      is_floated: remoteEvent.is_floated ?? true,
      is_live_tomorrow: false,
      registration_open: remoteEvent.registration_open ?? true,
      checkin_enabled: remoteEvent.checkin_enabled ?? false,
      status: mapEventStatus(remoteEvent.status),
      participantCount: 0,
      prizeInfo: remoteEvent.prize_info || 'Trophy + Certificate',
      result: undefined,
      icon: base.icon,
      rules: base.rules,
      description: remoteEvent.description || base.description,
      order: base.order ?? index + 1,
    };
  });
};

// Participants are populated from the admin API; remove built-in mock generation.

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AdminEvent[]>(() => initializeEvents());
  const [houses, setHouses] = useState<House[]>(() =>
    initialHouses.map((h) => ({
      ...h,
      points2026: h.points2026 ?? h.points2025 ?? 0,
    })),
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    festivalStatus: 'pre',
    registrationsOpen: true,
    coordinatorAssignments: {},
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
    else setParticipants([]);

    if (storedSettings) setSettings(JSON.parse(storedSettings));
    if (storedPointsHistory) setPointsHistory(JSON.parse(storedPointsHistory));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [remoteEvents, remoteHouses, remoteLeaderboard, remoteSettings, remoteRegistrations] = await Promise.all([
        fetchAdminEvents(),
        fetchAdminHouses(),
        fetchLeaderboard(),
        fetchAdminSettings(),
        fetchAdminRegistrations(),
      ])

      if (remoteEvents.length > 0) {
        const mappedEvents = mapRemoteEventsToAdminEvents(remoteEvents);
        setEvents(mappedEvents);
        localStorage.setItem('simmam_events', JSON.stringify(mappedEvents));
      }

      if (remoteHouses.length > 0) {
        const leaderboardPointsByName = new Map(
          remoteLeaderboard.map((item) => [item.house_name.toLowerCase(), Number(item.total_points ?? item.points ?? 0)]),
        );

        const mappedHouses = initialHouses.map((house) => {
          const remoteHouse = remoteHouses.find((candidate) => candidate.name.toLowerCase() === house.name.toLowerCase());
          const points2026 = leaderboardPointsByName.get(house.name.toLowerCase()) ?? Number(remoteHouse?.points ?? house.points2026 ?? 0);

          return {
            ...house,
            accent: remoteHouse?.accent || house.accent,
            points2026,
          };
        });

        setHouses(mappedHouses);
        localStorage.setItem('simmam_houses', JSON.stringify(mappedHouses));
      }

      if (Array.isArray(remoteRegistrations)) {
        const mappedParticipants = remoteRegistrations.map((row) => ({
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
        setParticipants(mappedParticipants)
        localStorage.setItem('simmam_participants', JSON.stringify(mappedParticipants))
      }

      if (remoteSettings) {
        setSettings(remoteSettings);
        localStorage.setItem('simmam_settings', JSON.stringify(remoteSettings));
      }
    } catch (err) {
      console.error('Failed to refresh data from API:', err);
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const refreshInterval = window.setInterval(() => {
      void refreshData();
    }, 15000);

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        void refreshData();
      }
    };

    window.addEventListener('focus', handleVisibilityRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', handleVisibilityRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [refreshData]);

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

  const deleteEvent = (eventId: string) => {
    const updatedEvents = events.filter((event) => event.id !== eventId);
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
      deleteEvent,
      updateHouse,
      updateParticipant,
      addParticipant,
      updateHousePoints,
      pointsHistory,
      findAdminEventByName,
      isRegistrationAllowed,
      isCheckInAllowed,
      settings,
      updateSettings,
      refreshData
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
