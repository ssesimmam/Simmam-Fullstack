import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminUsers,
  getAdminUserDetails,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '@/api/admin/users'

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (params?: { search?: string; house?: string }) => [...adminUserKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminUserKeys.all, 'detail', id] as const,
}

export function useAdminUsers(params?: { search?: string; house?: string }) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => getAdminUsers(params),
    staleTime: 30_000,
  })
}

export function useAdminUserDetails(userId: string | undefined) {
  return useQuery({
    queryKey: adminUserKeys.detail(userId ?? ''),
    queryFn: () => getAdminUserDetails(userId!),
    enabled: !!userId,
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  })
}
