import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { useUnreadCount, useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'
import type { NotificationSeverity } from '@/types/notification'
import { PushNotificationControl } from './PushNotificationControl'

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  info: 'bg-blue-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500',
}

interface NotificationBellProps {
  slug: string
}

export function NotificationBell({ slug }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: unread } = useUnreadCount(slug)
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications(slug, open)
  const { mutate: markRead, isPending: marking, error: markError } = useMarkNotificationRead(slug)

  const count = unread?.count ?? 0
  const displayCount = count > 9 ? '9+' : String(count)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const update = (event: MessageEvent) => {
      if (event.data?.type !== 'NOTIFICATIONS_UPDATED') return
      void qc.invalidateQueries({ queryKey: ['notifications', slug] })
      void qc.invalidateQueries({ queryKey: ['notifications-unread-count', slug] })
    }
    navigator.serviceWorker.addEventListener('message', update)
    return () => navigator.serviceWorker.removeEventListener('message', update)
  }, [slug, qc])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
    }
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
        aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="notification-panel"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <section id="notification-panel" aria-label="Notifications" className="fixed right-4 top-16 z-50 mt-2 max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg sm:absolute sm:right-0 sm:top-full">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {count > 0 && <button disabled={marking} onClick={() => markRead('all')} className="text-xs text-blue-600 hover:underline disabled:opacity-50">Mark all read</button>}
          </div>
          {markError && <p role="alert" className="px-4 py-2 text-xs text-red-700">Could not mark notifications as read. Please try again.</p>}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
              </div>
            )}
            {isError && <div role="alert" className="px-4 py-5 text-sm text-gray-600">Could not load notifications. <button onClick={() => void refetch()} className="text-blue-600 underline">Try again</button></div>}
            {!isLoading && !isError && notifications.length === 0 && (
              <div className="px-4 py-6 text-center"><Bell className="mx-auto mb-2 h-6 w-6 text-gray-300" /><p className="text-sm font-medium text-gray-700">You’re all caught up</p><p className="mt-1 text-xs leading-5 text-gray-500">New tickets, appointments, and orders will appear here.</p></div>
            )}
            {!isLoading && notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead(n.id)
                  setOpen(false)
                  navigate(n.url)
                }}
                className={cn(
                  'flex w-full items-start gap-2.5 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50',
                  !n.is_read && 'bg-blue-50/40',
                )}
              >
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', SEVERITY_DOT[n.severity])} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn('text-sm', n.is_read ? 'font-medium text-gray-600' : 'font-semibold text-gray-900')}>
                      {n.title}
                    </span>
                    {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{n.message}</span>
                  <span className="mt-1 block text-[10px] text-gray-400">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <PushNotificationControl slug={slug} />
        </section>
      )}
    </div>
  )
}
