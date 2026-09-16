import apiClient from './client'
import type { Page } from '@/features/crm/types'
import type {
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  ListServicesParams,
} from '@/types/service'

export const servicesApi = {
  list: (slug: string, params?: ListServicesParams) =>
    apiClient.get<Page<Service>>(`/admin/${slug}/services`, { params }).then((r) => r.data),

  get: (slug: string, serviceId: string) =>
    apiClient.get<Service>(`/admin/${slug}/services/${serviceId}`).then((r) => r.data),

  create: (slug: string, payload: CreateServicePayload) =>
    apiClient.post<Service>(`/admin/${slug}/services`, payload).then((r) => r.data),

  update: (slug: string, serviceId: string, payload: UpdateServicePayload) =>
    apiClient.patch<Service>(`/admin/${slug}/services/${serviceId}`, payload).then((r) => r.data),

  archive: (slug: string, serviceId: string) =>
    apiClient.delete(`/admin/${slug}/services/${serviceId}`),
}
