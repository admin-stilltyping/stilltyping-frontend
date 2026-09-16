import apiClient from './client'
import type { AppNotification } from '@/types/notification'

export function listNotifications(slug: string, unreadOnly = false) {
  return apiClient
    .get<AppNotification[]>(`/admin/${slug}/notifications`, { params: { unread_only: unreadOnly } })
    .then((r) => r.data)
}

export function getUnreadCount(slug: string) {
  return apiClient.get<{ count: number }>(`/admin/${slug}/notifications/unread-count`).then((r) => r.data)
}

export function markNotificationRead(slug: string, id: string) {
  return apiClient.patch<AppNotification>(`/admin/${slug}/notifications/${id}/read`).then((r) => r.data)
}
