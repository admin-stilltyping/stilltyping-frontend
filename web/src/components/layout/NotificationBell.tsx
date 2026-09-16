import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUnreadCount, useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'
import type { NotificationSeverity } from '@/types/notification'

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

  const { data: unread } = useUnreadCount(slug)
  const { data: notifications = [], isLoading } = useNotifications(slug)
  const { mutate: markRead } = useMarkNotificationRead(slug)

  const count = unread?.count ?? 0
  const displayCount = count > 9 ? '9+' : String(count)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
              </div>
            )}
            {!isLoading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications.</p>
            )}
            {!isLoading && notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
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
        </div>
      )}
    </div>
  )
}
