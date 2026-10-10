import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { requestTimingApi, type RequestTimingItem } from '@/api/requestTiming'
import { cn } from '@/utils/cn'

const STATUS_STYLE: Record<RequestTimingItem['status'], string> = {
  completed: 'bg-green-900 text-green-300',
  awaiting_send: 'bg-amber-900 text-amber-300',
  send_failed: 'bg-red-900 text-red-300',
  failed: 'bg-red-900 text-red-300',
}

const PHASES: { key: 'queue_ms' | 'db_ms' | 'ai_ms' | 'tool_ms' | 'send_ms'; label: string; color: string }[] = [
  { key: 'queue_ms', label: 'Queue (waiting to start)', color: 'bg-gray-500' },
  { key: 'db_ms', label: 'Database', color: 'bg-blue-500' },
  { key: 'ai_ms', label: 'AI model', color: 'bg-violet-500' },
  { key: 'tool_ms', label: 'Tools', color: 'bg-amber-500' },
  { key: 'send_ms', label: 'Channel send', color: 'bg-green-500' },
]

function ms(value: number | null) {
  return value === null || value === undefined ? '—' : `${Math.round(value).toLocaleString()} ms`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayIso() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function PhaseBar({ item }: { item: RequestTimingItem }) {
  const known = PHASES.reduce((sum, p) => sum + (item[p.key] ?? 0), 0)
  if (known <= 0) {
    return <span className="text-[10px] text-gray-600">no breakdown</span>
  }
  const other = Math.max(0, item.duration_ms - known)
  return (
    <div
      className="flex h-3 w-40 overflow-hidden rounded-full bg-gray-800"
      title={PHASES.map((p) => `${p.label}: ${ms(item[p.key])}`).join('\n')}
    >
      {PHASES.map((p) => (
        <div
          key={p.key}
          className={p.color}
          style={{ width: `${((item[p.key] ?? 0) / item.duration_ms) * 100}%` }}
        />
      ))}
      {other > 0 && (
        <div className="bg-gray-600" style={{ width: `${(other / item.duration_ms) * 100}%` }} />
      )}
    </div>
  )
}

export function SuperAdminRequestTiming() {
  const [business, setBusiness] = useState('')
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [start, setStart] = useState(yesterdayIso())
  const [end, setEnd] = useState(todayIso())
  const [offset, setOffset] = useState(0)

  const params = {
    business: business || undefined,
    channel: channel || undefined,
    status: (status || undefined) as RequestTimingItem['status'] | undefined,
    start,
    end,
    offset,
    limit: 25,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['super-admin-request-timing', params],
    queryFn: () => requestTimingApi.list(params),
    staleTime: 15_000,
  })

  const summary = data?.summary
  const cards: { label: string; value: string }[] = [
    { label: 'Replies', value: summary ? summary.replies.toLocaleString() : '—' },
    { label: 'Avg total', value: ms(summary?.average_duration_ms ?? null) },
    { label: 'Avg queue', value: ms(summary?.average_queue_ms ?? null) },
    { label: 'Avg DB', value: ms(summary?.average_db_ms ?? null) },
    { label: 'Avg AI', value: ms(summary?.average_ai_ms ?? null) },
    { label: 'Avg send', value: ms(summary?.average_send_ms ?? null) },
    { label: 'Slowest', value: ms(summary?.slowest_duration_ms ?? null) },
    { label: 'Failed', value: summary ? summary.failed_replies.toLocaleString() : '—' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Request Timing</h1>
        <p className="text-sm text-gray-400">
          Per-reply breakdown of where time went: queueing after the webhook arrived, database
          time, the AI model call, tool execution, and sending the reply back to the channel.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Business slug
          <input
            value={business}
            onChange={(e) => { setOffset(0); setBusiness(e.target.value) }}
            placeholder="all businesses"
            className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-violet-600 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Channel
          <select
            value={channel}
            onChange={(e) => { setOffset(0); setChannel(e.target.value) }}
            className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-200 focus:border-violet-600 focus:outline-none"
          >
            <option value="">All</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
            <option value="admin_chat">Admin chat</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Status
          <select
            value={status}
            onChange={(e) => { setOffset(0); setStatus(e.target.value) }}
            className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-200 focus:border-violet-600 focus:outline-none"
          >
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="awaiting_send">Awaiting send</option>
            <option value="send_failed">Send failed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Start
          <input
            type="date"
            value={start}
            onChange={(e) => { setOffset(0); setStart(e.target.value) }}
            className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-200 focus:border-violet-600 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          End
          <input
            type="date"
            value={end}
            onChange={(e) => { setOffset(0); setEnd(e.target.value) }}
            className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-200 focus:border-violet-600 focus:outline-none"
          />
        </label>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">{c.label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-100">{c.value}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-800" />)}
        </div>
      )}

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <div className="py-12 text-center text-sm text-gray-600">No replies in this range.</div>
      )}

      {!isLoading && (data?.items.length ?? 0) > 0 && (
        <div className={cn('overflow-hidden rounded-xl border border-gray-800', isFetching && 'opacity-60')}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left">
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">When</th>
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Business</th>
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Channel</th>
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Breakdown</th>
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {data?.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-900">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(item.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200">{item.business_name}</p>
                    <p className="font-mono text-[10px] text-gray-600">{item.business_slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{item.channel}</td>
                  <td className="px-4 py-3"><PhaseBar item={item} /></td>
                  <td className={cn('px-4 py-3 font-medium', item.duration_ms > 10_000 ? 'text-red-400' : 'text-gray-300')}>
                    {ms(item.duration_ms)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_STYLE[item.status])}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (data.items.length > 0 || offset > 0) && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{data.total_count.toLocaleString()} total</span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 25))}
              className="rounded-lg border border-gray-800 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-900"
            >
              Previous
            </button>
            <button
              disabled={data.next_offset === null}
              onClick={() => setOffset(data.next_offset ?? offset)}
              className="rounded-lg border border-gray-800 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-900"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
