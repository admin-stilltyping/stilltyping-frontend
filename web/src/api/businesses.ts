import apiClient from './client'
import type { Business, BusinessRecord, UpdateBusinessPayload } from '@nivaso/types'

function asBusiness(record: BusinessRecord): Business {
  return { ...record, id: record._id, settings: {} }
}

export const businessesApi = {
  list: () =>
    apiClient.get<BusinessRecord[]>('/admin/businesses').then((r) => r.data.map(asBusiness)),
  get: (slug: string) =>
    apiClient
      .get<BusinessRecord>(`/admin/businesses/${encodeURIComponent(slug)}`)
      .then((r) => asBusiness(r.data)),
  update: (slug: string, payload: UpdateBusinessPayload) =>
    apiClient
      .patch<Business>(`/admin/businesses/${encodeURIComponent(slug)}`, payload)
      .then((r) => r.data),
  isLocked: () => true,
  lockedSlug: () => undefined,
}
