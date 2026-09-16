import { useState } from 'react'
import { TicketCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTickets } from '@/hooks/useSupport'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, EmptyState } from '@nivaso/ui'
import { cn } from '@/utils/cn'
import type { TicketStatus } from '@/types/support'

type Tab = TicketStatus | 'all'

const TABS: { value: Tab; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
]

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
}

function formatDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString() : '—'
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

export function TicketList() {
  const slug = useTenantSlug()
  const [tab, setTab] = useState<Tab>('open')
  const { data: tickets, isLoading } = useTickets(
    slug,
    tab === 'all' ? undefined : { status: tab },
  )

  return (
    <div>
      {/* Status tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t.value
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tickets?.length === 0 && !isLoading ? (
        <EmptyState
          icon={TicketCheck}
          title="No tickets"
          description="No support tickets in this category."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Question</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : tickets?.map((t) => (
                    <tr key={t.ticket_ref} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link
                          to={`/support/${t.ticket_ref}`}
                          className="font-mono font-medium text-blue-600 hover:underline"
                        >
                          {t.ticket_ref}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <span className="block max-w-md truncate" title={t.question}>
                          {t.question}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{t.channel ?? '—'}</td>
                      <td className="px-5 py-3">
                        <Badge colorClass={STATUS_COLORS[t.status]}>{t.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
