/**
 * COMPATIBILITY SHIM — src/lib/apiClient.ts
 *
 * The API layer has been migrated to src/api/*.
 * This file re-exports from the new modules for backward compatibility with
 * any existing components that import from this path.
 *
 * Migrate call sites to import directly from src/api/* when possible.
 */

export { ApiError, isMaintenanceError } from '@/api/client'
export type { EventDTO as ApiEvent } from '@/api/events'
export type { RegistrationDTO as ApiRegistration } from '@/api/registrations'
export { getEvents as fetchEvents } from '@/api/events'
export { getRegistrations as fetchUserRegistrations } from '@/api/registrations'
export { createRegistration } from '@/api/registrations'
export { upsertUserProfile } from '@/api/registrations'
export { getUserProfile as fetchUserProfileByEmail } from '@/api/registrations'
export { getAnnouncements as fetchAnnouncements } from '@/api/events'
export { getRules as fetchRules } from '@/api/events'
export { getLeaderboard as fetchLeaderboard } from '@/api/events'
export { getHouses as fetchHouses } from '@/api/events'
