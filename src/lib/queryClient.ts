import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 minute — data is fresh for 1 min
      gcTime: 5 * 60_000,         // 5 minutes — keep in cache for 5 min after unmount
      retry: 1,                   // retry once on failure
      refetchOnWindowFocus: true, // refresh on tab focus
      refetchOnReconnect: true,   // refresh on network reconnect
    },
    mutations: {
      retry: 0, // never retry mutations automatically
    },
  },
})
