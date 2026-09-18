import apiClient from './client'
import type { SupportTicket, UpdateTicketPayload, ListTicketsParams } from '@/types/support'

// context-agent: GET returns { tickets: [...] }; ref is the human-readable TKT-… id.
interface TicketListResponse {
  tickets: SupportTicket[]
}

export const supportApi = {
  list: (slug: string, params?: ListTicketsParams) =>
    apiClient
      .get<TicketListResponse>(`/admin/${slug}/support-tickets`, { params })
      .then((r) => r.data.tickets),

  get: (slug: string, reference: string) =>
    apiClient
      .get<SupportTicket>(`/admin/${slug}/support-tickets/${reference}`)
      .then((r) => r.data),

  update: (slug: string, reference: string, payload: UpdateTicketPayload) =>
    apiClient
      .patch<SupportTicket>(`/admin/${slug}/support-tickets/${reference}`, payload)
      .then((r) => r.data),
}
