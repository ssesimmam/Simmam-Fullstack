import { adminRequest } from '../client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminEventDTO {
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

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAdminEvents(): Promise<AdminEventDTO[]> {
  const result = await adminRequest<{ data: AdminEventDTO[] }>('/events')
  return result.data ?? []
}

export async function createAdminEvent(payload: {
  name: string
  description: string
  category: string
  main_category?: string
  date: string
  time_slot: string
  end_time?: string
  venue: string
  capacity?: number
}): Promise<AdminEventDTO> {
  const result = await adminRequest<{ data: AdminEventDTO }>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function updateAdminEvent(eventId: string, payload: Record<string, unknown>): Promise<AdminEventDTO> {
  const result = await adminRequest<{ data: AdminEventDTO }>(`/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function deleteAdminEvent(eventId: string): Promise<void> {
  await adminRequest(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })
}

export async function closeAdminEventRegistration(eventId: string): Promise<void> {
  await adminRequest(`/events/${encodeURIComponent(eventId)}/close-registration`, { method: 'POST' })
}
