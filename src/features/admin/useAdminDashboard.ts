import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminLeaderboard,
  getAdminHouses,
  getAdminDashboardSummary,
  getAttendanceReport,
  adjustLeaderboardPoints,
} from '@/api/admin/leaderboard'
import { getAdminSettings, saveAdminSettings } from '@/api/admin/settings'
import type { AdminSettings } from '@/api/admin/settings'

export const adminDashboardKeys = {
  summary: ['admin', 'dashboard', 'summary'] as const,
  leaderboard: ['admin', 'leaderboard'] as const,
  houses: ['admin', 'houses'] as const,
  attendance: ['admin', 'attendance'] as const,
  settings: ['admin', 'settings'] as const,
}

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: adminDashboardKeys.summary,
    queryFn: getAdminDashboardSummary,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useAdminLeaderboard() {
  return useQuery({
    queryKey: adminDashboardKeys.leaderboard,
    queryFn: getAdminLeaderboard,
    staleTime: 15_000,
    refetchInterval: 15_000,
  })
}

export function useAdminHouses() {
  return useQuery({
    queryKey: adminDashboardKeys.houses,
    queryFn: getAdminHouses,
    staleTime: 60_000,
  })
}

export function useAttendanceReport() {
  return useQuery({
    queryKey: adminDashboardKeys.attendance,
    queryFn: getAttendanceReport,
    staleTime: 60_000,
  })
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminDashboardKeys.settings,
    queryFn: getAdminSettings,
    staleTime: 60_000,
  })
}

export function useAdjustLeaderboardPoints() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ houseId, points, reason }: { houseId: string; points: number; reason?: string }) =>
      adjustLeaderboardPoints(houseId, points, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminDashboardKeys.leaderboard }),
  })
}

export function useSaveAdminSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: AdminSettings) => saveAdminSettings(settings),
    onSuccess: (newSettings) => {
      queryClient.setQueryData(adminDashboardKeys.settings, newSettings)
    },
  })
}
