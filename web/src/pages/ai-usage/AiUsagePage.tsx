import { useState } from 'react'
import { Bot, MessageSquare, Globe, Instagram, Activity, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useAiUsage } from '@/hooks/useAiUsage'
import { agentRunsApi } from '@/api/agentRuns'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'
import { EmptyState, Badge } from '@nivaso/ui'
import { formatNumber, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { AiUsageByChannel } from '@/api/aiUsage'
import { ErrorState } from '@/components/ui/ErrorState'

// Icon/label/color per channel — matches the choices already made in
// IntegrationsPage.tsx (Bot for Telegram, MessageSquare for WhatsApp, Globe
// for Web) so the same channel always reads the same way across the app.
const CHANNEL_META: Record<string, { label: string; icon: LucideIcon; colorClass: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, colorClass: 'text-green-500' },
  telegram: { label: 'Telegram', icon: Bot, colorClass: 'text-blue-500' },
  web: { label: 'Web', icon: Globe, colorClass: 'text-indigo-500' },
  instagram: { label: 'Instagram', icon: Instagram, colorClass: 'text-pink-500' },
}

function channelMeta(channel: string) {
  return (
    CHANNEL_META[channel] ?? {
      label: channel.charAt(0).toUpperCase() + channel.slice(1),
      icon: Activity,
      colorClass: 'text-gray-500',
    }
  )
}

function formatCost(cost: number) {
  return `$${cost.toFixed(2)}`
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 3 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChannelCard({ channel }: { channel: AiUsageByChannel }) {
  const { label, icon: Icon, colorClass } = channelMeta(channel.channel)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorClass}`} />
        <p className="text-sm font-semibold text-gray-800">{label}</p>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-xs text-gray-500">{channel.runs.toLocaleString()} runs</p>
        <p className="text-lg font-bold text-gray-900">{formatCost(channel.cost_usd)}</p>
      </div>
    </div>
  )
}

function RunsSkeletonRow() {
  return (
    <tr aria-hidden="true" className="motion-safe:animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

/**
 * The raw per-turn run log — ported from AgentRunList.tsx (which now stays
 * unlinked from the sidebar). Unlike that page, this shares the parent
 * page's date range and isn't behind FeatureGate/UI_AGENT_RUNS, since AI
 * Usage as a whole is ungated.
 */
function RecentRuns({ slug, range }: { slug: string; range: DateRangeValue }) {
  const { data: runs, isLoading, error, refetch } = useQuery({
    queryKey: ['agent-runs', slug, range.start, range.end],
    queryFn: () => agentRunsApi.list(slug, { limit: 100, ...range }),
    enabled: !!slug,
    staleTime: 15_000,
  })

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Recent Runs</h3>
      {error ? <ErrorState error={error} title="Unable to load recent activity" onRetry={() => void refetch()} /> : runs?.length === 0 && !isLoading ? (
        <EmptyState
          icon={Activity}
          title="No agent runs"
          description="Agent turns appear here as customers chat, for the selected range."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Input Tok</th>
                <th className="px-4 py-3">Output Tok</th>
                <th className="px-4 py-3">Cache Hit</th>
                <th className="px-4 py-3">Iters</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <RunsSkeletonRow key={i} />)
                : runs?.map((r) => (
                    <tr key={r.id} className={cn('hover:bg-gray-50', r.error && 'bg-red-50/40')}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-700">
                          {r.model.replace('claude-', '').replace('gemini-', 'g-')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.input_tokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700">{r.output_tokens.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {r.cache_read_tokens > 0 ? (
                          <Badge colorClass="bg-green-100 text-green-700">
                            {r.cache_read_tokens.toLocaleString()}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.iterations}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.latency_ms != null
                          ? r.latency_ms >= 1000
                            ? `${(r.latency_ms / 1000).toFixed(1)}s`
                            : `${r.latency_ms}ms`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.estimated_cost_usd < 0.001 ? '<$0.001' : `$${r.estimated_cost_usd.toFixed(4)}`}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AiUsagePage() {
  const slug = useTenantSlug()
  const [range, setRange] = useState<DateRangeValue>({})
  const { data, isLoading, error, refetch } = useAiUsage(slug, range)

  const totalTokens = data ? data.total.input_tokens + data.total.output_tokens : 0
  const hasUsage = !!data && data.total.runs > 0

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Usage</h2>
          <p className="text-sm text-gray-500">
            A breakdown of AI usage for your business, by channel and by customer, plus the raw
            run log — for the selected date range.
          </p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {error ? <ErrorState error={error} title="Unable to load AI usage" onRetry={() => void refetch()} /> : isLoading ? (
        <SkeletonBlock />
      ) : !hasUsage ? (
        <EmptyState
          icon={Activity}
          title="No AI usage in this range"
          description="Usage appears here once your agent starts handling customer conversations."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Runs', value: data.total.runs.toLocaleString() },
              { label: 'Total Cost', value: formatCost(data.total.cost_usd) },
              { label: 'Total Tokens', value: formatNumber(totalTokens) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* By Channel */}
          {data.by_channel.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">By Channel</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.by_channel.map((c) => (
                  <ChannelCard key={c.channel} channel={c} />
                ))}
              </div>
            </div>
          )}

          {/* By Customer */}
          {data.by_customer.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">By Customer</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Runs</th>
                      <th className="px-4 py-3">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.by_customer.map((c) => (
                      <tr key={c.customer_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/customers/${c.customer_id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {c.customer_name ?? (
                              <span className="font-mono text-gray-600">
                                {c.customer_id.slice(0, 8)}…
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{c.runs.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700">{formatCost(c.cost_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Runs — fetches independently of the summary above (own
          loading/empty states), so it renders regardless of hasUsage. */}
      <div className="mt-6">
        <RecentRuns slug={slug} range={range} />
      </div>
    </div>
  )
}
