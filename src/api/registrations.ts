import { publicRequest } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfileDTO {
  email: string
  name: string
  mobile_number?: string
  register_number?: string
  house?: string
  department?: string
  picture_url?: string
}

export interface RegistrationDTO {
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

export interface CreateRegistrationPayload {
  email: string
  name: string
  register_number: string
  house: string
  department?: string
  event_id?: string
  event_name?: string
  turnstile_token?: string
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getUserProfile(email: string): Promise<UserProfileDTO | null> {
  try {
    const encoded = encodeURIComponent(email.trim().toLowerCase())
    const payload = await publicRequest<{ user: UserProfileDTO | null }>(`/users/${encoded}/registrations`)
    return payload.user || null
  } catch (err: any) {
    if (err.status === 404) return null
    throw err
  }
}

export async function getRegistrations(email: string): Promise<RegistrationDTO[]> {
  const encoded = encodeURIComponent(email.trim().toLowerCase())
  const payload = await publicRequest<{ registrations: RegistrationDTO[] }>(`/users/${encoded}/registrations`)
  return payload.registrations ?? []
}

export async function createRegistration(payload: CreateRegistrationPayload): Promise<{ registration_id: string; ticket_code: string }> {
  const result = await publicRequest<{
    registration?: { id?: string; ticket_code?: string }
    registration_id?: string
    ticket_code?: string
  }>('/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (result.registration) {
    return {
      registration_id: result.registration.id ?? '',
      ticket_code: result.registration.ticket_code ?? '',
    }
  }
  return {
    registration_id: result.registration_id ?? '',
    ticket_code: result.ticket_code ?? '',
  }
}

export async function upsertUserProfile(payload: {
  email: string
  name: string
  mobile_number?: string
  register_number?: string
  house?: string
  department?: string
  picture_url?: string
}): Promise<void> {
  console.log('Saving user payload:', payload);
  await publicRequest('/users/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
