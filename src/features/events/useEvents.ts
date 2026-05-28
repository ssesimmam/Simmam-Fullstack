import { useQuery } from '@tanstack/react-query'
import { getEvents, getAnnouncements, getRules, getLeaderboard, getHouses, getPublicSettings } from '@/api/events'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const eventKeys = {
  all: ['events'] as const,
  list: () => [...eventKeys.all, 'list'] as const,
  announcements: () => [...eventKeys.all, 'announcements'] as const,
  rules: () => [...eventKeys.all, 'rules'] as const,
  leaderboard: () => ['leaderboard'] as const,
  houses: () => ['houses'] as const,
  settings: () => ['settings', 'public'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetches the public event list. Refetches every 30s and on window focus. */
export function useEvents() {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: getEvents,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

/** Fetches public announcements. Refetches every 60s. */
export function useAnnouncements() {
  return useQuery({
    queryKey: eventKeys.announcements(),
    queryFn: getAnnouncements,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

/** Fetches public rules. */
export function useRules() {
  return useQuery({
    queryKey: eventKeys.rules(),
    queryFn: getRules,
    staleTime: 5 * 60_000,
  })
}

/** Fetches the leaderboard. */
export function useLeaderboard() {
  return useQuery({
    queryKey: eventKeys.leaderboard(),
    queryFn: getLeaderboard,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

/** Fetches houses. */
export function useHouses() {
  return useQuery({
    queryKey: eventKeys.houses(),
    queryFn: getHouses,
    staleTime: 5 * 60_000,
  })
}

/** Fetches public festival settings. */
export function usePublicSettings() {
  return useQuery({
    queryKey: eventKeys.settings(),
    queryFn: getPublicSettings,
    staleTime: 60_000,
  })
}
