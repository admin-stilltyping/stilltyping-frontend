import apiClient from './client'

export const pushApi = {
  config: (slug: string) => apiClient.get<{ configured: boolean; public_key: string | null }>(`/admin/${slug}/push/config`).then(r => r.data),
  subscribe: (slug: string, subscription: PushSubscriptionJSON) => apiClient.post<{ id: string }>(`/admin/${slug}/push/subscription`, subscription).then(r => r.data),
  status: (slug: string, id: string) => apiClient.get<{ active: boolean }>(`/admin/${slug}/push/subscriptions/${id}`).then(r => r.data),
  unsubscribe: (slug: string, endpoint: string) => apiClient.delete(`/admin/${slug}/push/subscription`, { data: { endpoint }, timeout: 5000 }),
}
