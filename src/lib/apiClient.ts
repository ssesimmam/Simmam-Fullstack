export type ApiEvent = {
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
}

export type ApiRegistration = {
  registration_id: string
  event_id: string
  event_name: string
  category: string
  date: string
  time_slot: string
  end_time: string
  venue: string
  ticket_code: string
  status: string
  registered_at: string
  checked_in?: boolean
}

export type ApiAnnouncement = {
  id: string
  title: string
  body?: string | null
  pinned?: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at?: string
  updated_at?: string
}

export type ApiRule = {
  id: string
  title: string
  body?: string | null
  pinned?: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at?: string
  updated_at?: string
}

export type CreateRegistrationPayload = {
  email: string
  name: string
  register_number: string
  house: string
  event_id?: string
  event_name?: string
}

import supabase from '@/lib/supabase'

const apiBase = (() => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (!raw) return '/api'
  return `${raw.replace(/\/$/, '')}/api`
})()

async function getUserAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return {}

    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase()

  // Simple in-flight deduplication for GET requests to avoid duplicate concurrent
  // requests for the same resource. This reduces request storms from multiple
  // components calling the same API at once.
  if (!(globalThis as any).__inflightApiRequests) (globalThis as any).__inflightApiRequests = new Map<string, Promise<any>>()
  const inflight: Map<string, Promise<any>> = (globalThis as any).__inflightApiRequests
  const key = `${method}:${path}`
  if (method === 'GET' && inflight.has(key)) {
    return inflight.get(key) as Promise<T>
  }

  const attemptFetch = async (): Promise<T> => {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(await getUserAuthHeaders()),
        ...(init?.headers || {}),
      },
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = payload?.error || payload?.message || `Request failed (${response.status})`
      throw new Error(message)
    }

    return payload as T
  }

  const doRequest = async (): Promise<T> => {
    // Retry on network errors (fetch throws) with small exponential backoff.
    const maxRetries = 2
    let attempt = 0
    while (true) {
      try {
        return await attemptFetch()
      } catch (err: any) {
        const isNetworkError = err instanceof TypeError
        if (!isNetworkError || attempt >= maxRetries) throw err
        attempt += 1
        const backoff = 200 * Math.pow(2, attempt) // 400ms, 800ms
        await new Promise((r) => setTimeout(r, backoff))
      }
    }
  }

  const promise = doRequest()
  if (method === 'GET') inflight.set(key, promise)
  try {
    const result = await promise
    return result
  } finally {
    if (method === 'GET') inflight.delete(key)
  }
}

export async function fetchEvents(): Promise<ApiEvent[]> {
  const payload = await request<{ data?: ApiEvent[] } | ApiEvent[]>('/events')
  if (Array.isArray(payload)) return payload
  return payload.data || []
}

export async function fetchHouses(): Promise<Array<{ id: string; name: string; accent: string; points: number }>> {
  const payload = await request<{ data?: Array<{ id: string; name: string; accent: string; points: number }> } | Array<{ id: string; name: string; accent: string; points: number }>>('/houses')
  if (Array.isArray(payload)) return payload
  return payload.data || []
}

export async function fetchLeaderboard(): Promise<Array<{ house_id: string; house_name: string; total_points?: number; points?: number }>> {
  const payload = await request<{ data?: Array<{ house_id: string; house_name: string; total_points?: number; points?: number }> } | Array<{ house_id: string; house_name: string; total_points?: number; points?: number }>>('/leaderboard')
  if (Array.isArray(payload)) return payload
  return payload.data || []
}

export async function createRegistration(payload: CreateRegistrationPayload): Promise<{ registration_id: string; ticket_code: string }> {
  const result = await request<{ registration?: { id?: string; ticket_code?: string }; registration_id?: string; ticket_code?: string }>('/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (result.registration) {
    return {
      registration_id: result.registration.id || '',
      ticket_code: result.registration.ticket_code || '',
    }
  }

  return {
    registration_id: result.registration_id || '',
    ticket_code: result.ticket_code || '',
  }
}

export async function fetchUserRegistrations(email: string): Promise<ApiRegistration[]> {
  const encoded = encodeURIComponent(email.trim().toLowerCase())
  const payload = await request<{ registrations: ApiRegistration[] }>(`/users/${encoded}/registrations`)
  return payload.registrations || []
}

export async function fetchAnnouncements(): Promise<ApiAnnouncement[]> {
  const payload = await request<{ data: ApiAnnouncement[] }>('/announcements')
  return payload.data || []
}

export async function fetchRules(): Promise<ApiRule[]> {
  const payload = await request<{ data: ApiRule[] }>('/rules')
  return payload.data || []
}

export async function fetchUserProfileByEmail(email: string): Promise<{
  user: {
    email: string
    name: string
    mobile_number?: string
    register_number?: string
    house?: string
    picture_url?: string
  } | null
}> {
  const encoded = encodeURIComponent(email.trim().toLowerCase())
  return request<{ user: {
    email: string
    name: string
    mobile_number?: string
    register_number?: string
    house?: string
    picture_url?: string
  } | null }>(`/users/${encoded}/registrations`)
}

export async function upsertUserProfile(payload: {
  email: string
  name: string
  mobile_number?: string
  register_number?: string
  house?: string
  picture_url?: string
}): Promise<void> {
  await request('/users/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
