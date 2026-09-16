import { useState } from 'react'
import { Webhook, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { webhookEventsApi } from '@/api/webhookEvents'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { Badge, EmptyState } from '@nivaso/ui'
import { formatDate } from '@/utils/formatters'
import { Flag } from '@nivaso/types'
import { cn } from '@/utils/cn'
import type { WebhookStatus, WebhookSource } from '@/types/webhookEvent'

const STATUS_COLORS: Record<WebhookStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  processed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  ignored: 'bg-gray-100 text-gray-500',
}

const SOURCE_COLORS: Record<WebhookSource, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  telegram: 'bg-blue-100 text-blue-700',
  razorpay: 'bg-purple-100 text-purple-700',
}

const SOURCE_TABS: { value: WebhookSource | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'razorpay', label: 'Razorpay' },
]

const STATUS_OPTIONS: { value: WebhookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'received', label: 'Received' },
  { value: 'processing', label: 'Processing' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
  { value: 'ignored', label: 'Ignored' },
]

const PAGE_SIZE = 50

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-3"><div className="h-4 rounded bg-gray-200" /></td>
      ))}
    </tr>
  )
}

export function WebhookEventList() {
  return (
    <FeatureGate flag={Flag.UI_WEBHOOK_EVENTS} label="Webhook Events Log">
      <WebhookEventListInner />
    </FeatureGate>
  )
}

function WebhookEventListInner() {
  const slug = useTenantSlug()
  const [source, setSource] = useState<WebhookSource | 'all'>('all')
  const [status, setStatus] = useState<WebhookStatus | 'all'>('all')
  const [page, setPage] = useState(0)

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ['webhook-events', slug, source, status, page],
    queryFn: () =>
      webhookEventsApi.list(slug, {
        source: source === 'all' ? undefined : source,
        status: status === 'all' ? undefined : status,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    enabled: !!slug,
    staleTime: 60_000,
  })

  // Reset to page 0 when filters change
  const handleSourceChange = (val: WebhookSource | 'all') => { setSource(val); setPage(0) }
  const handleStatusChange = (val: WebhookStatus | 'all') => { setStatus(val); setPage(0) }

  if (!slug) {
    return (
      <EmptyState
        icon={Webhook}
        title="No business selected"
        description="Select a business from the header to view webhook events."
      />
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 py-12 text-center">
        <AlertTriangle className="mb-2 h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-red-700">Failed to load webhook events</p>
        <p className="mt-1 text-xs text-red-500">Make sure the backend is running.</p>
      </div>
    )
  }

  const hasNextPage = (events?.length ?? 0) === PAGE_SIZE
  const hasPrevPage = page > 0

  return (
    <div>
      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Source tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {SOURCE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleSourceChange(t.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                source === t.value
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as WebhookStatus | 'all')}
          className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {events?.length === 0 && !isLoading ? (
        <EmptyState
          icon={Webhook}
          title="No webhook events"
          description="Incoming events from WhatsApp, Telegram, and Razorpay appear here."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Event ID</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Attempts</th>
                  <th className="px-5 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : events?.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <Badge colorClass={SOURCE_COLORS[e.source]}>{e.source}</Badge>
                        </td>
                        <td className="px-5 py-3 max-w-xs">
                          <p className="truncate font-mono text-xs text-gray-600">{e.external_event_id}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge colorClass={STATUS_COLORS[e.status]}>{e.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{e.attempts}</td>
                        <td className="px-5 py-3 text-gray-500">{formatDate(e.created_at)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(hasPrevPage || hasNextPage) && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Page {page + 1}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
