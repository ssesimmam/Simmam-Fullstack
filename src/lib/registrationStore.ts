export type UserProfile = {
  email: string
  name: string
  picture: string
  registerNumber: string
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
}

const USER_KEY = 'simmam_user'

export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveUser(user: UserProfile): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser(): void {
  sessionStorage.removeItem(USER_KEY)
}

export function getUserRegistrations(email: string): Registration[] {
  if (typeof window === 'undefined') return []

  const key = `simmam_regs_${email}`

  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUserRegistrations(email: string, registrations: Registration[]): void {
  const key = `simmam_regs_${email}`
  localStorage.setItem(key, JSON.stringify(registrations))
}

export function isRegistered(email: string, eventId: string): boolean {
  const registrations = getUserRegistrations(email)
  return registrations.some((registration) => registration.eventId === eventId)
}

export function registerForEvent(
  email: string,
  event: Omit<Registration, 'registeredAt' | 'ticketCode'>,
): { success: boolean; alreadyRegistered: boolean } {
  const registrations = getUserRegistrations(email)

  if (registrations.some((registration) => registration.eventId === event.eventId)) {
    return { success: false, alreadyRegistered: true }
  }

  const ticketCode = generateTicketCode(email, event.eventId)
  const newRegistration: Registration = {
    ...event,
    registeredAt: new Date().toISOString(),
    ticketCode,
  }

  saveUserRegistrations(email, [...registrations, newRegistration])
  return { success: true, alreadyRegistered: false }
}

export function unregisterFromEvent(email: string, eventId: string): void {
  const registrations = getUserRegistrations(email)
  saveUserRegistrations(
    email,
    registrations.filter((registration) => registration.eventId !== eventId),
  )
}

function generateTicketCode(email: string, eventId: string): string {
  const hash = simpleHash(`${email}-${eventId}-${Date.now()}`)
  return `SMM-${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`
}

function simpleHash(value: string): string {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash.toString(36).padStart(8, '0')
}