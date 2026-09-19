import { QueryClient } from '@tanstack/react-query'

export function createPortalQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  })

  // Identity and module access are shared across the portal. Reuse them during
  // navigation; revalidate on a stale mount, tab return, or network reconnect.
  // Keep this on the query key so every consumer uses the same freshness policy.
  for (const key of ['business-session', 'entitlements']) {
    client.setQueryDefaults([key], {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchInterval: false,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    })
  }

  return client
}
