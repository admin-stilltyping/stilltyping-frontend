import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics'
import type { DateRange } from '@/types/analytics'

export function useAnalyticsOverview(slug: string, range: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'overview', slug, range],
    queryFn: () => analyticsApi.overview(slug, range),
    enabled: !!slug,
    // Dashboard should feel live without hammering the backend.
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
