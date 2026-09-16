import apiClient from './client'
import type { DashboardOverview, DateRange } from '@/types/analytics'
import { buildMockOverview } from './analytics.mock'

export const analyticsApi = {
  /**
   * Tenant dashboard rollup for a date range.
   *
   * Calls the real aggregation endpoint; until that ships on the backend it
   * 404s and we fall back to seeded sample data so the dashboard is fully
   * alive. When the endpoint lands, delete the `.catch` and the mock import.
   */
  overview: (slug: string, range: DateRange): Promise<DashboardOverview> =>
    apiClient
      .get<DashboardOverview>(`/admin/${slug}/analytics/overview`, {
        params: { range },
      })
      .then((r) => r.data)
      .catch(() => buildMockOverview(slug, range)),
}
