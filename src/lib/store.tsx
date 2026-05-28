import { useAdminEvents, useAdminParticipants, useAdminLeaderboard, useAdminSettings } from '../hooks/useAdminQueries'

export interface AdminEvent extends Record<string, any> {}
export interface Participant extends Record<string, any> {}
export interface AdminSettings extends Record<string, any> {}
export interface PointTransaction extends Record<string, any> {}

export interface EventResult {
  winnerHouse: string
  runnerUpHouse: string
  pointsAwarded: number
  resultDay: string
}

export const mapRemoteEventToAdminEvent = (remote: any, local: any) => remote
export const resolvePersistedEventId = async (event: any) => event.id || 'event-1'

export function useData() {
  const { events, createEvent, updateEvent, deleteEvent, refetch: refetchEvents } = useAdminEvents()
  const { participants, refetch: refetchParticipants } = useAdminParticipants()
  const { data: leaderboardData, adjustPoints } = useAdminLeaderboard()
  const { settings, updateSettings, refetch: refetchSettings } = useAdminSettings()

  return {
    events: events as AdminEvent[],
    houses: (leaderboardData?.houses || []).map((h: any) => {
      const leaderScore = leaderboardData?.leaderboard?.find((l: any) => l.house_id === h.id || l.house_name === h.name);
      return {
        ...h,
        points: leaderScore?.total_points || leaderScore?.points || h.points || 0
      }
    }) as import('./houses').House[],
    participants: participants as Participant[],
    pointsHistory: [] as PointTransaction[],
    settings: settings || { festivalStatus: 'pre', registrationsOpen: true, coordinatorAssignments: {} },
    maintenanceError: null,
    
    addEvent: createEvent,
    updateEvent: updateEvent as any,
    deleteEvent: deleteEvent,
    
    updateHouse: (...args: any[]) => {},
    updateParticipant: (...args: any[]) => {},
    addParticipant: (...args: any[]) => {},
    updateHousePoints: ((houseId: string, points: number, reason?: string) => adjustPoints({ houseId, points, reason })) as any,
    
    findAdminEventByName: (...args: any[]) => events.find((e: any) => e.name === args[0]),
    isRegistrationAllowed: (...args: any[]) => true,
    isCheckInAllowed: (...args: any[]) => true,
    updateSettings: updateSettings as any,
    
    refreshData: async (...args: any[]) => {
      await Promise.all([
        refetchEvents(),
        refetchParticipants(),
        refetchSettings(),
      ])
    },
    clearMaintenanceError: () => {},
  }
}
