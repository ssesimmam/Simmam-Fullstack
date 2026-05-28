import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRegistrations,
  createRegistration,
  upsertUserProfile,
  type CreateRegistrationPayload,
} from '@/api/registrations'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const registrationKeys = {
  all: ['registrations'] as const,
  byEmail: (email: string) => [...registrationKeys.all, email] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches a user's registrations from the backend.
 * Backend is the single source of truth — no localStorage involved.
 */
export function useRegistrations(email: string | undefined | null) {
  return useQuery({
    queryKey: registrationKeys.byEmail(email ?? ''),
    queryFn: () => getRegistrations(email!),
    enabled: !!email,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

/** Registers the current user for an event with optimistic update and cache invalidation. */
export function useRegisterForEvent(email: string | undefined | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRegistrationPayload) => createRegistration(payload),
    onSuccess: () => {
      if (email) {
        void queryClient.invalidateQueries({ queryKey: registrationKeys.byEmail(email) })
      }
    },
  })
}

/** Upserts the user profile — fire and forget, no cache management needed. */
export function useUpsertUserProfile() {
  return useMutation({
    mutationFn: upsertUserProfile,
  })
}
