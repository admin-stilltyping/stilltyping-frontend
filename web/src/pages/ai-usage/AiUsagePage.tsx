import { useState } from 'react'
import { Activity, ArrowDownLeft, ArrowUpRight, Bot, Check, ChevronLeft, ChevronRight, Clock3, Globe, Instagram, MessageCircle, RefreshCw, Send, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@nivaso/ui'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useAiUsage } from '@/hooks/useAiUsage'
import { useBusinessSession } from '@/components/auth/BusinessSession'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSkeleton } from '@/components/ui/LoadingState'
import type { AiUsageReply } from '@/api/aiUsage'
import { usageSeconds, usageTokens } from '@/utils/aiUsage'
import { cn } from '@/utils/cn'

const CHANNELS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-pink-50 text-pink-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
  admin_chat: { label: 'Agent Chat', icon: Bot, color: 'bg-blue-50 text-blue-600' },
  web: { label: 'Website', icon: Globe, color: 'bg-sky-50 text-sky-600' },
  telegram: { label: 'Telegram', icon: Send, color: 'bg-cyan-50 text-cyan-600' },
}

function Channel({ channel }: { channel: string }) {
  const { label, icon: Icon, color } = CHANNELS[channel] ?? { label: channel, icon: MessageCircle, color: 'bg-slate-100 text-slate-600' }
  return <span className="inline-flex items-center gap-2.5 whitespace-nowrap font-medium text-slate-800"><span className={cn('rounded-lg p-2', color)}><Icon aria-hidden="true" className="h-4 w-4" /></span>{label}</span>
}

function Status({ status }: { status: AiUsageReply['status'] }) {
  const labels = { completed: 'Completed', failed: 'Failed', awaiting_send: 'Awaiting send', send_failed: 'Send failed' }
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap', status === 'completed' ? 'bg-emerald-50 text-emerald-700' : status === 'awaiting_send' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
    {status === 'completed' && <Check aria-hidden="true" className="h-3 w-3" />}{labels[status]}
  </span>
}

function Started({ reply, timezone }: { reply: AiUsageReply; timezone: string }) {
  const value = new Date(reply.started_at)
  return <div className="whitespace-nowrap"><time dateTime={reply.started_at} className="font-medium text-slate-700">{value.toLocaleDateString('en-IN', { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric' })}</time><div className="mt-0.5 text-xs text-slate-500">{value.toLocaleTimeString('en-IN', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div></div>
}

const PAGE_SIZE = 25
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

export function AiUsagePage() {
  const slug = useTenantSlug()
  const { business } = useBusinessSession()
  const [range, setRange] = useState<DateRangeValue>({})
  const [channel, setChannel] = useState('')
  const [offset, setOffset] = useState(0)
  const { data, isLoading, isFetching, error, refetch } = useAiUsage(slug, { ...range, channel: channel || undefined, offset, limit: PAGE_SIZE })
  const timezone = data?.timezone ?? business.timezone
  const summary = data?.summary
  const incomplete = !!summary?.incomplete_replies

  function refresh() {
    if (offset) setOffset(0)
    else void refetch()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-xl font-semibold tracking-tight text-slate-900">AI Usage</h2><p className="mt-1 text-sm text-slate-500">Every AI reply, across your connected channels and Agent Chat.</p></div>
        <DateRangePicker value={range} timeZone={timezone} onChange={next => { setRange(next); setOffset(0) }} />
      </div>

      {error && <ErrorState error={error} title="Unable to refresh AI usage" onRetry={() => void refetch()} />}
      {isLoading ? <PageSkeleton label="Loading AI usage" /> : data && <>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: 'Reply attempts', value: summary!.replies.toLocaleString('en-IN'), hint: summary!.failed_replies ? `${summary!.failed_replies} failed` : 'Across the selected range', icon: Activity },
            { label: 'Input tokens', value: usageTokens(summary!.input_tokens, !incomplete), hint: 'Prompt and conversation context', icon: ArrowDownLeft },
            { label: 'Output tokens', value: usageTokens(summary!.output_tokens, !incomplete), hint: 'Reported by the AI provider', icon: ArrowUpRight },
            { label: 'Average completion', value: usageSeconds(summary!.average_duration_ms), hint: 'Completed replies only', icon: Clock3 },
          ].map(({ label, value, hint, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" /></div><p className="mt-3 break-words text-xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-2xl">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div>)}
        </div>
      </>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div><h3 className="font-semibold text-slate-900">Reply activity</h3><p className="mt-1 text-xs text-slate-500">Newest first · Times in {timezone}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter by channel" value={channel} onChange={e => { setChannel(e.target.value); setOffset(0) }} className="h-9 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">All channels</option>{Object.entries(CHANNELS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
            <button type="button" className={button} onClick={refresh} disabled={isFetching} aria-label="Refresh usage"><RefreshCw aria-hidden="true" className={cn('h-4 w-4', isFetching && 'motion-safe:animate-spin')} /><span className="hidden sm:inline">Refresh</span></button>
          </div>
        </div>
        {data && !isLoading && data.items.length === 0 ? <EmptyState icon={Activity} title="No replies in this range" description="New AI replies from Instagram, WhatsApp, Agent Chat and other connected channels will appear here. Try another channel or date range." /> : data && <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] text-sm">
              <caption className="sr-only">AI replies with date, channel, status, completion time and token usage</caption>
              <thead className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-medium text-slate-500"><tr>{['Date & time', 'Channel', 'Status', 'Time taken', 'Input tokens', 'Output tokens'].map(label => <th key={label} scope="col" className="px-5 py-3 font-medium">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{data.items.map(reply => <tr key={reply.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><Started reply={reply} timezone={timezone} /></td><td className="px-5 py-4"><Channel channel={reply.channel} /></td><td className="px-5 py-4"><Status status={reply.status} /></td><td className="px-5 py-4 whitespace-nowrap tabular-nums text-slate-700">{reply.status === 'awaiting_send' ? 'Pending' : usageSeconds(reply.duration_ms)}</td><td className="px-5 py-4 tabular-nums text-slate-700">{usageTokens(reply.input_tokens, reply.tokens_complete)}</td><td className="px-5 py-4 tabular-nums text-slate-700">{usageTokens(reply.output_tokens, reply.tokens_complete)}</td></tr>)}</tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 md:hidden">{data.items.map(reply => <li key={reply.id} className="space-y-4 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Channel channel={reply.channel} /><Status status={reply.status} /></div><Started reply={reply} timezone={timezone} /><dl className="grid grid-cols-3 gap-3">{[
            ['Time taken', reply.status === 'awaiting_send' ? 'Pending' : usageSeconds(reply.duration_ms)],
            ['Input tokens', usageTokens(reply.input_tokens, reply.tokens_complete)],
            ['Output tokens', usageTokens(reply.output_tokens, reply.tokens_complete)],
          ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium tabular-nums text-slate-800">{value}</dd></div>)}</dl></li>)}</ul>
          {data.total_count > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5"><p className="text-xs text-slate-500">{offset + 1}–{offset + data.items.length} of {data.total_count.toLocaleString('en-IN')} replies</p><div className="flex items-center gap-2"><button type="button" className={button} disabled={offset === 0 || isFetching} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft aria-hidden="true" className="h-4 w-4" />Previous</button><button type="button" className={button} disabled={data.next_offset === null || isFetching} onClick={() => setOffset(data.next_offset ?? offset)}>Next<ChevronRight aria-hidden="true" className="h-4 w-4" /></button></div></div>}
        </>}
      </section>
      <div className="space-y-1 text-xs leading-relaxed text-slate-500">
        <p>Time taken includes AI processing and, for messaging channels, the send request. It excludes delivery to the recipient’s device. Tokens cover all AI model steps for each reply, excluding embeddings.</p>
        <p>Tracking starts with this update; earlier replies have no recorded usage. New activity refreshes every 30 seconds on the first page.</p>
        {incomplete && <p className="text-amber-700">Some token counts were not reported by the provider. A “+” marks a partial total; “Not reported” means the count is unavailable.</p>}
      </div>
    </div>
  )
}
