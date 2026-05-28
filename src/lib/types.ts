export type { EventDTO as AdminEvent } from '@/api/events'
export type { AdminRegistrationDTO as Participant } from '@/api/admin/registrations'
export type { AdminSettings } from '@/api/admin/settings'

export interface EventResult {
  winnerHouse: string
  runnerUpHouse: string
  pointsAwarded: number
  resultDay: string
}

export const mapRemoteEventToAdminEvent = (remote: any, local: any) => remote
export const resolvePersistedEventId = async (event: any) => event.id || 'event-1'
