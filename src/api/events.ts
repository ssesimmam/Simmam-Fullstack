import { publicRequest } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventDTO {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  category?: string | null
  main_category?: string | null
  venue?: string | null
  date?: string | null
  time_slot?: string | null
  end_time?: string | null
  registration_open?: boolean
  checkin_enabled?: boolean
  is_floated?: boolean
  is_live_tomorrow?: boolean
  status?: string
  capacity?: number | null
  prize_info?: string | null
  rules?: string[] | null
}

export interface AnnouncementDTO {
  id: string
  title: string
  body?: string | null
  pinned?: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at?: string
}

export interface RuleDTO {
  id: string
  title: string
  body?: string | null
  pinned?: boolean
  created_at?: string
}

export interface HouseDTO {
  id: string
  name: string
  accent: string
  points: number
}

export interface LeaderboardDTO {
  house_id: string
  house_name: string
  total_points?: number
  points?: number
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getEvents(): Promise<EventDTO[]> {
  const payload = await publicRequest<{ data?: EventDTO[] } | EventDTO[]>('/events')
  return Array.isArray(payload) ? payload : (payload.data ?? [])
}

export async function getAnnouncements(): Promise<AnnouncementDTO[]> {
  const payload = await publicRequest<{ data: AnnouncementDTO[] }>('/announcements')
  return payload.data ?? []
}

export async function getRules(): Promise<RuleDTO[]> {
  const payload = await publicRequest<{ data: RuleDTO[] }>('/rules')
  return payload.data ?? []
}

export async function getHouses(): Promise<HouseDTO[]> {
  const payload = await publicRequest<{ data?: HouseDTO[] } | HouseDTO[]>('/houses')
  return Array.isArray(payload) ? payload : (payload.data ?? [])
}

export async function getLeaderboard(): Promise<LeaderboardDTO[]> {
  const payload = await publicRequest<{ data?: LeaderboardDTO[] } | LeaderboardDTO[]>('/leaderboard')
  return Array.isArray(payload) ? payload : (payload.data ?? [])
}

export async function getPublicSettings(): Promise<{ festivalStatus: string; registrationsOpen: boolean }> {
  const payload = await publicRequest<{ settings: { festivalStatus: string; registrationsOpen: boolean } }>('/settings')
  return payload.settings
}
