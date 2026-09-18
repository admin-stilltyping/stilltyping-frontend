import apiClient from './client'
import type { WebhookEventPage, WebhookSource, WebhookStatus } from '@/types/webhookEvent'

export interface WebhookEventParams {
  source?: WebhookSource
  status?: WebhookStatus
  start?: string
  end?: string
  limit?: number
  offset?: number
}

export const webhookEventsApi = {
  list: (slug: string, params?: WebhookEventParams) =>
    apiClient.get<WebhookEventPage>(`/admin/${slug}/webhook-events`, { params }).then((r) => r.data),
}
