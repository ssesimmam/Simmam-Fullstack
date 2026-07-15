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
      return []
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
      return []
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
      return { houses: [], leaderboard: [] }
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
      return { houseOfTheDay: null, festivalStatus: 'pre', registrationsOpen: true, coordinatorAssignments: {} }
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
