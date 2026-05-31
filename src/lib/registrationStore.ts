/**
 * Registration Store — migrated to React Query backend-driven architecture.
 *
 * User profile is now stored in sessionStorage only as a lightweight cache.
 * Registrations are fetched from the backend via useRegistrations() hook.
 *
 * This module provides compatibility exports for components that haven't been
 * migrated to the React Query hooks yet.
 */

import { upsertUserProfile } from '@/api/registrations'

export type UserProfile = {
  email: string
  name: string
  mobileNumber?: string
  picture: string
  registerNumber: string
  department: string
  house: string
}

export type Registration = {
  eventId: string
  eventName: string
  date: string
  timeSlot: string
  endTime: string
  venue: string
  category: string
  registeredAt: string
  ticketCode: string
  checkedIn?: boolean
}

export type CheckedInEntry = {
  eventName: string
  event: string
  house: string
  checkIn: boolean
}

const USER_KEY = 'simmam_user'

function canUpsertUser(user: UserProfile): boolean {
  return !!user.email.trim() && !!user.name.trim() && !!user.mobileNumber?.trim() && !!user.registerNumber.trim() && !!user.department.trim() && !!user.house.trim()
}

// ─── User Profile (session cache) ─────────────────────────────────────────────

export function getUser(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveUser(user: UserProfile): Promise<void> {
  if (canUpsertUser(user)) {
    try {
      await upsertUserProfile({
        email: user.email,
        name: user.name,
        mobile_number: user.mobileNumber,
        register_number: user.registerNumber,
        department: user.department,
        house: user.house,
        picture_url: user.picture,
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[registrationStore] profile sync skipped:', error)
      }
    }
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[registrationStore] profile cached locally until signup is complete')
  }

  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser(): void {
  sessionStorage.removeItem(USER_KEY)
}

export function clearAllUserData(email: string): void {
  sessionStorage.removeItem(USER_KEY)
  const regKey = `simmam_regs_${email.toLowerCase()}`
  localStorage.removeItem(regKey)
}

// ─── Registrations (legacy compatibility — use useRegistrations() hook instead) ──

/** @deprecated Use useRegistrations() hook instead */
export function getUserRegistrations(email: string): Registration[] {
  try {
    const raw = localStorage.getItem(`simmam_regs_${email}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Sync from backend — returns registrations and also writes to local cache */
export async function syncUserRegistrations(email: string): Promise<Registration[]> {
  const { getRegistrations } = await import('@/api/registrations')
  const rows = await getRegistrations(email)
  const mapped: Registration[] = rows.map((r) => ({
    eventId: r.event_id,
    eventName: r.event_name,
    date: r.date,
    timeSlot: r.time_slot,
    endTime: r.end_time,
    venue: r.venue,
    category: r.category,
    registeredAt: r.registered_at,
    ticketCode: r.ticket_code,
    checkedIn: !!r.checked_in,
  }))
  localStorage.setItem(`simmam_regs_${email}`, JSON.stringify(mapped))
  return mapped
}

export function isRegisteredForEvent(email: string, eventId: string | undefined, eventName: string): boolean {
  const regs = getUserRegistrations(email)
  return regs.some((r) => (!!eventId && r.eventId === eventId) || r.eventName.toLowerCase() === eventName.toLowerCase())
}

export async function registerForEvent(
  email: string,
  event: Omit<Registration, 'registeredAt' | 'ticketCode'> & { backendEventId?: string },
  turnstileToken?: string,
): Promise<{ success: boolean; alreadyRegistered: boolean }> {
  const regs = getUserRegistrations(email)
  if (regs.some((r) => r.eventId === event.eventId || r.eventName.toLowerCase() === event.eventName.toLowerCase())) {
    return { success: false, alreadyRegistered: true }
  }

  const user = getUser()
  if (!user) throw new Error('user_session_missing')

  const { createRegistration } = await import('@/api/registrations')
  const response = await createRegistration({
    email: user.email,
    name: user.name,
    register_number: user.registerNumber,
    house: user.house,
    event_id: event.backendEventId,
    event_name: event.eventName,
    turnstile_token: turnstileToken,
  })

  const newReg: Registration = {
    ...event,
    registeredAt: new Date().toISOString(),
    ticketCode: response.ticket_code || `SMM-${Date.now().toString(36).toUpperCase()}`,
  }
  localStorage.setItem(`simmam_regs_${email}`, JSON.stringify([...regs, newReg]))
  await syncUserRegistrations(email)
  return { success: true, alreadyRegistered: false }
}

export function getCheckedInEvents(email: string, participants: CheckedInEntry[]): CheckedInEntry[] {
  return participants.filter((p) => (p as any).email?.toLowerCase() === email.toLowerCase() && p.checkIn === true)
}
