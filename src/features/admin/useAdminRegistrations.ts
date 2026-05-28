import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminRegistrations,
  createAdminParticipant,
  updateAdminParticipant,
  deleteAdminRegistration,
  checkInRegistration,
  removeAdminCheckin,
} from '@/api/admin/registrations'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminRegistrationKeys = {
  all: ['admin', 'registrations'] as const,
  list: (params?: { search?: string; event?: string; date?: string }) =>
    [...adminRegistrationKeys.all, 'list', params] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminRegistrations(params?: { search?: string; event?: string; date?: string }) {
  return useQuery({
    queryKey: adminRegistrationKeys.list(params),
    queryFn: () => getAdminRegistrations(params),
    staleTime: 15_000,
    refetchInterval: 15_000,
  })
}

export function useCreateAdminParticipant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminParticipant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRegistrationKeys.all }),
  })
}

export function useUpdateAdminParticipant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateAdminParticipant>[1] }) =>
      updateAdminParticipant(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRegistrationKeys.all }),
  })
}

export function useDeleteAdminRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminRegistration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRegistrationKeys.all }),
  })
}

export function useCheckInRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: checkInRegistration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRegistrationKeys.all }),
  })
}

export function useRemoveAdminCheckin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeAdminCheckin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminRegistrationKeys.all }),
  })
}
