import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listNotifications, getUnreadCount, markNotificationRead } from '@/api/notifications'

export function useUnreadCount(slug: string) {
  return useQuery({
    queryKey: ['notifications-unread-count', slug],
    queryFn: () => getUnreadCount(slug),
    enabled: !!slug,
    refetchInterval: 60_000,
  })
}

export function useNotifications(slug: string) {
  return useQuery({
    queryKey: ['notifications', slug],
    queryFn: () => listNotifications(slug),
    enabled: !!slug,
  })
}

export function useMarkNotificationRead(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(slug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', slug] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count', slug] })
    },
  })
}
