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

/** Fetches the public event list. Caches for 5 minutes. */
export function useEvents() {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: getEvents,
    staleTime: 300_000,
  })
}

/** Fetches public announcements. Caches for 5 minutes. */
export function useAnnouncements() {
  return useQuery({
    queryKey: eventKeys.announcements(),
    queryFn: getAnnouncements,
    staleTime: 300_000,
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

/** Fetches the leaderboard. Caches for 5 minutes. */
export function useLeaderboard() {
  return useQuery({
    queryKey: eventKeys.leaderboard(),
    queryFn: getLeaderboard,
    staleTime: 300_000,
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
