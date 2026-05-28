import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvents, getHouses, getLeaderboard, getPublicSettings } from '@/api/events'
import {
  fetchAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  fetchAdminRegistrations,
  checkInRegistration,
  removeAdminCheckin,
  fetchAdminHouses,
  fetchAdminLeaderboard,
  adjustAdminLeaderboardPoints,
  getAdminSettings,
  saveAdminSettings,
} from '@/lib/adminApi'

// Events
export const useAdminEvents = () => {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['adminEvents'],
    queryFn: async () => {
      try {
        console.log('[useAdminEvents] Attempting fetchAdminEvents')
        const data = await fetchAdminEvents()
        console.log('[useAdminEvents] Success', data)
        return data
      } catch (err: any) {
        console.error('[useAdminEvents] Failed, status:', err?.status, err)
        if (err?.status === 401 || err?.status === 403) {
          console.log('[useAdminEvents] Falling back to public getEvents')
          const fallbackData = await getEvents()
          console.log('[useAdminEvents] Fallback success', fallbackData)
          return fallbackData as any[]
        }
        throw err
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation({
    mutationFn: createAdminEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminEvents'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminEvent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminEvents'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminEvents'] }),
  })

  return {
    events: (query.data as any[]) || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createEvent: createMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
  }
}

// Registrations / Participants
export const useAdminParticipants = () => {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['adminParticipants'],
    queryFn: async () => {
      try {
        return await fetchAdminRegistrations()
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          return []
        }
        throw err
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const checkinMutation = useMutation({
    mutationFn: checkInRegistration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminParticipants'] }),
  })

  const removeCheckinMutation = useMutation({
    mutationFn: removeAdminCheckin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminParticipants'] }),
  })

  return {
    participants: (query.data as any[]) || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    checkIn: checkinMutation.mutateAsync,
    removeCheckin: removeCheckinMutation.mutateAsync,
  }
}

// Leaderboard & Houses
export const useAdminLeaderboard = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['adminLeaderboard'],
    queryFn: async () => {
      try {
        const [houses, leaderboard] = await Promise.all([
          fetchAdminHouses(),
          fetchAdminLeaderboard()
        ])
        return { houses, leaderboard }
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          const [houses, leaderboard] = await Promise.all([
            getHouses(),
            getLeaderboard()
          ])
          return { houses, leaderboard }
        }
        throw err
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const adjustPointsMutation = useMutation({
    mutationFn: ({ houseId, points, reason }: { houseId: string, points: number, reason?: string }) => 
      adjustAdminLeaderboardPoints(houseId, points, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminLeaderboard'] }),
  })

  return {
    data: query.data as any,
    isLoading: query.isLoading,
    refetch: query.refetch,
    adjustPoints: adjustPointsMutation.mutateAsync,
  }
}

// Settings
export const useAdminSettings = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      try {
        return await getAdminSettings()
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          return (await getPublicSettings()) as any
        }
        throw err
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const updateMutation = useMutation({
    mutationFn: saveAdminSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminSettings'] }),
  })

  return {
    settings: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateSettings: updateMutation.mutateAsync,
  }
}
