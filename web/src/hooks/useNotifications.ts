import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '@/api/notifications'

export function useUnreadCount(slug: string) {
  return useQuery({
    queryKey: ['notifications-unread-count', slug],
    queryFn: () => getUnreadCount(slug),
    enabled: !!slug,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    retry: false,
  })
}

export function useNotifications(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['notifications', slug],
    queryFn: () => listNotifications(slug),
    enabled: !!slug && enabled,
    staleTime: 15_000,
    retry: false,
  })
}

export function useMarkNotificationRead(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (id === 'all') await markAllNotificationsRead(slug)
      else await markNotificationRead(slug, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', slug] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count', slug] })
    },
  })
}
