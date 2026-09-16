import apiClient from './client'
import type { WebhookEvent } from '@/types/webhookEvent'

export const webhookEventsApi = {
  list: (slug: string, params?: { source?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get<WebhookEvent[]>(`/admin/${slug}/webhook-events`, { params }).then((r) => r.data),
}
