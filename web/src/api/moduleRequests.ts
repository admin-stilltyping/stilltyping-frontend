import apiClient from './client'
import type { Entitlements } from '@nivaso/types'

export type FeatureRequestStatus = 'pending' | 'approved' | 'denied'

export interface FeatureRequest {
  id: string
  feature: string
  reason: string | null
  status: FeatureRequestStatus
  notes: string | null
  created_at: string
}

export interface CreateFeatureRequestPayload {
  feature: string
  reason?: string
}

// Business-scoped self-service endpoints for requesting module/integration
// access or a plan upgrade. Note the path uses `/admin/businesses/...`
// (matching businessesApi in ./businesses.ts), not a bare `/admin/{slug}/...`
// prefix like most other admin routes in this app.
export const moduleRequestsApi = {
  getEntitlements: (slug: string) =>
    apiClient.get<Entitlements>(`/admin/businesses/${slug}/entitlements`).then((r) => r.data),

  listFeatureRequests: (slug: string) =>
    apiClient
      .get<FeatureRequest[]>(`/admin/businesses/${slug}/feature-requests`)
      .then((r) => r.data),

  createFeatureRequest: (slug: string, payload: CreateFeatureRequestPayload) =>
    apiClient
      .post<FeatureRequest>(`/admin/businesses/${slug}/feature-requests`, payload)
      .then((r) => r.data),
}
