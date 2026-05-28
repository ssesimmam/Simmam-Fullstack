import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  closeAdminEventRegistration,
} from '@/api/admin/events'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminEventKeys = {
  all: ['admin', 'events'] as const,
  list: () => [...adminEventKeys.all, 'list'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminEvents() {
  return useQuery({
    queryKey: adminEventKeys.list(),
    queryFn: getAdminEvents,
    staleTime: 15_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
}

export function useCreateAdminEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEventKeys.all }),
  })
}

export function useUpdateAdminEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateAdminEvent(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEventKeys.all }),
  })
}

export function useDeleteAdminEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEventKeys.all }),
  })
}

export function useCloseAdminEventRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: closeAdminEventRegistration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEventKeys.all }),
  })
}
