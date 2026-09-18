import { Fragment, useState } from 'react'
import { AlertCircle, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Instagram, MessageCircle, RefreshCw, Repeat2, Send, Webhook } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@nivaso/ui'
import { Flag } from '@nivaso/types'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useBusinessSession } from '@/components/auth/BusinessSession'
import { webhookEventsApi } from '@/api/webhookEvents'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/LoadingState'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'
import { usageSeconds } from '@/utils/aiUsage'
import { cn } from '@/utils/cn'
import type { WebhookEvent, WebhookSource, WebhookStatus } from '@/types/webhookEvent'

const SOURCES = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-pink-50 text-pink-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
  telegram: { label: 'Telegram', icon: Send, color: 'bg-sky-50 text-sky-600' },
}
const STATUSES: Record<WebhookStatus, { label: string; color: string }> = {
  received: { label: 'Received', color: 'bg-blue-50 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-amber-50 text-amber-700' },
  processed: { label: 'Reply sent', color: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700' },
  ignored: { label: 'Ignored', color: 'bg-slate-100 text-slate-600' },
}
const PAGE_SIZE = 25
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

function Source({ source }: { source: WebhookSource }) {
  const { label, icon: Icon, color } = SOURCES[source]
  return <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-sm font-medium text-slate-800"><span className={cn('rounded-lg p-2', color)}><Icon aria-hidden="true" className="h-4 w-4" /></span>{label}</span>
}

function Status({ status }: { status: WebhookStatus }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', STATUSES[status].color)}>{STATUSES[status].label}</span>
}

function formatTime(value: string | null, timezone: string) {
  return value ? new Date(value).toLocaleString('en-IN', { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'
}

function Details({ event, timezone }: { event: WebhookEvent; timezone: string }) {
  return <div className="space-y-4 rounded-lg bg-slate-50 p-4 text-sm">
    <p className={cn('leading-relaxed', event.status === 'failed' ? 'text-red-700' : 'text-slate-700')}>{event.detail}</p>
    <dl className="grid gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
      {[
        ['Provider event ID', event.external_event_id ?? 'Not supplied'],
        ['Last received', formatTime(event.last_received_at, timezone)],
        ['Finished', formatTime(event.completed_at, timezone)],
        ['Processing time', usageSeconds(event.duration_ms)],
        ['Repeated deliveries', String(Math.max(0, event.deliveries - 1))],
        ['Request ID', event.request_id ?? '—'],
      ].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-all font-medium text-slate-700">{value}</dd></div>)}
    </dl>
    {event.deliveries > 1 && <p className="text-xs text-slate-500">Repeated deliveries were skipped to prevent duplicate replies.</p>}
  </div>
}

function LoadingRows() {
  return <div role="status" aria-label="Loading webhook events" className="divide-y divide-slate-100"><span className="sr-only">Loading webhook events</span>{Array.from({ length: 5 }, (_, i) => <div key={i} aria-hidden="true" className="grid grid-cols-2 gap-6 px-5 py-6 md:grid-cols-5">{Array.from({ length: 5 }, (_, j) => <Skeleton key={j} className={cn('h-4 w-4/5', j > 1 && 'hidden md:block')} />)}</div>)}</div>
}

export function WebhookEventList() {
  return <FeatureGate flag={Flag.UI_WEBHOOK_EVENTS} label="Webhook Events Log"><WebhookEventListInner /></FeatureGate>
}

function WebhookEventListInner() {
  const slug = useTenantSlug()
  const { business } = useBusinessSession()
  const queryClient = useQueryClient()
  const [source, setSource] = useState<WebhookSource | ''>('')
  const [status, setStatus] = useState<WebhookStatus | ''>('')
  const [range, setRange] = useState<DateRangeValue>({})
  const [offset, setOffset] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const params = { source: source || undefined, status: status || undefined, ...range, limit: PAGE_SIZE, offset }
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['webhook-events', slug, params],
    queryFn: () => webhookEventsApi.list(slug, params),
    enabled: !!slug,
    staleTime: 10_000,
    refetchInterval: offset === 0 ? 15_000 : false,
  })
  const timezone = data?.timezone ?? business.timezone

  function resetPage() { setOffset(0); setExpanded(null) }
  function toggle(id: string) { setExpanded(expanded === id ? null : id) }
  function refresh() {
    resetPage()
    void queryClient.invalidateQueries({ queryKey: ['webhook-events', slug] })
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-semibold tracking-tight text-slate-900">Webhook Events</h2><p className="mt-1 text-sm text-slate-500">Follow incoming messages from arrival to reply.</p></div>
      <DateRangePicker value={range} timeZone={timezone} onChange={next => { setRange(next); resetPage() }} />
    </div>
    {error && <ErrorState error={error} title="Unable to load webhook events" onRetry={() => void refetch()} />}
    {(data || isLoading) && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { label: 'Message events', value: data?.summary.events, icon: Webhook },
        { label: 'Replies sent', value: data?.summary.replies_sent, icon: CheckCheck },
        { label: 'Failed', value: data?.summary.failed, icon: AlertCircle },
        { label: 'Repeated deliveries', value: data?.summary.duplicate_deliveries, icon: Repeat2 },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" /></div>{isLoading ? <Skeleton className="mt-3 h-7 w-16" /> : <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value?.toLocaleString('en-IN')}</p>}</div>)}
    </div>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="space-y-3 border-b border-slate-100 p-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Incoming activity</h3><p className="mt-1 text-xs text-slate-500">Newest first · Times in {timezone}</p></div><button type="button" aria-label="Refresh events" onClick={refresh} disabled={isFetching} className={button}><RefreshCw aria-hidden="true" className={cn('h-4 w-4', isFetching && 'motion-safe:animate-spin')} /><span className="hidden sm:inline">Refresh</span></button></div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filter by source" className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-slate-50 p-1">{[{ value: '', label: 'All' }, ...Object.entries(SOURCES).map(([value, { label }]) => ({ value, label }))].map(option => <button key={option.value} type="button" aria-pressed={source === option.value} onClick={() => { setSource(option.value as WebhookSource | ''); resetPage() }} className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm', source === option.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>{option.label}</button>)}</div>
          <select aria-label="Filter by status" value={status} onChange={e => { setStatus(e.target.value as WebhookStatus | ''); resetPage() }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:ml-auto"><option value="">All statuses</option>{Object.entries(STATUSES).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
      </div>
      {isLoading ? <LoadingRows /> : data?.items.length === 0 ? <EmptyState icon={Webhook} title="No webhook events in this range" description="Verified incoming messages from Instagram, WhatsApp and Telegram will appear here. Try another source, status or date range." /> : data && <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[880px] text-sm"><caption className="sr-only">Incoming webhook messages and processing outcomes</caption><thead className="border-b border-slate-100 bg-slate-50/70 text-left text-xs text-slate-500"><tr>{['Source', 'Event ID', 'Status', 'Deliveries', 'Received', ''].map((label, index) => <th key={index} scope="col" className="px-5 py-3 font-medium">{label || <span className="sr-only">Details</span>}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.items.map(event => <Fragment key={event.id}><tr className="hover:bg-slate-50/60"><td className="px-5 py-4"><Source source={event.source} /></td><td className="max-w-[240px] px-5 py-4"><p title={event.external_event_id ?? undefined} className="truncate font-mono text-xs text-slate-600">{event.external_event_id ?? 'Not supplied'}</p></td><td className="px-5 py-4"><Status status={event.status} /></td><td className="px-5 py-4 tabular-nums text-slate-600">{event.deliveries}</td><td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600"><time dateTime={event.created_at}>{formatTime(event.created_at, timezone)}</time></td><td className="px-5 py-4"><button type="button" aria-expanded={expanded === event.id} aria-controls={`event-${event.id}`} onClick={() => toggle(event.id)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">Details<ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform', expanded === event.id && 'rotate-180')} /></button></td></tr>{expanded === event.id && <tr id={`event-${event.id}`}><td colSpan={6} className="px-5 pb-4 pt-2"><Details event={event} timezone={timezone} /></td></tr>}</Fragment>)}</tbody></table></div>
        <ul className="divide-y divide-slate-100 md:hidden">{data.items.map(event => <li key={event.id} className="space-y-3 p-4"><div className="flex items-center justify-between gap-2"><Source source={event.source} /><Status status={event.status} /></div><p className="truncate font-mono text-xs text-slate-500">{event.external_event_id ?? 'No event ID supplied'}</p><time dateTime={event.created_at} className="block text-xs text-slate-500">{formatTime(event.created_at, timezone)}</time><div className="flex items-center justify-between"><span className="text-xs text-slate-500">{event.deliveries} {event.deliveries === 1 ? 'delivery' : 'deliveries'}</span><button type="button" aria-expanded={expanded === event.id} onClick={() => toggle(event.id)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">Details<ChevronDown aria-hidden="true" className={cn('h-4 w-4', expanded === event.id && 'rotate-180')} /></button></div>{expanded === event.id && <Details event={event} timezone={timezone} />}</li>)}</ul>
        {data.total_count > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5"><p className="text-xs text-slate-500">{offset + 1}–{offset + data.items.length} of {data.total_count.toLocaleString('en-IN')} events</p><div className="flex gap-2"><button type="button" className={button} disabled={offset === 0 || isFetching} onClick={() => { setOffset(Math.max(0, offset - PAGE_SIZE)); setExpanded(null) }}><ChevronLeft aria-hidden="true" className="h-4 w-4" />Previous</button><button type="button" className={button} disabled={data.next_offset === null || isFetching} onClick={() => { setOffset(data.next_offset ?? offset); setExpanded(null) }}>Next<ChevronRight aria-hidden="true" className="h-4 w-4" /></button></div></div>}
      </>}
    </section>
    <div className="space-y-1 text-xs leading-relaxed text-slate-500"><p>Repeated deliveries are counted without sending another reply. Incoming media is marked Ignored; delivery receipts, read receipts and your own message echoes are excluded.</p><p>Detailed history is available for messages received after this update. New activity refreshes every 15 seconds on the first page.</p></div>
  </div>
}
