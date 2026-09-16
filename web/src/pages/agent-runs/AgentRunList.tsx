import { Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { agentRunsApi } from '@/api/agentRuns'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { Badge, EmptyState } from '@nivaso/ui'
import { formatDate } from '@/utils/formatters'
import { Flag } from '@nivaso/types'
import { cn } from '@/utils/cn'

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 rounded bg-gray-200" /></td>
      ))}
    </tr>
  )
}

export function AgentRunList() {
  return (
    <FeatureGate flag={Flag.UI_AGENT_RUNS} label="Agent Runs Log">
      <AgentRunListInner />
    </FeatureGate>
  )
}

function AgentRunListInner() {
  const slug = useTenantSlug()

  const { data: runs, isLoading } = useQuery({
    queryKey: ['agent-runs', slug],
    queryFn: () => agentRunsApi.list(slug, { limit: 100 }),
    enabled: !!slug,
    staleTime: 15_000,
  })

  const totalCost = runs?.reduce((s, r) => s + r.estimated_cost_usd, 0) ?? 0
  const totalTokens = runs?.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0) ?? 0

  return (
    <div>
      {/* Summary strip */}
      {!isLoading && runs && runs.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Runs', value: runs.length },
            { label: 'Total Tokens', value: totalTokens.toLocaleString() },
            { label: 'Est. Cost', value: `$${totalCost.toFixed(4)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {runs?.length === 0 && !isLoading ? (
        <EmptyState icon={Activity} title="No agent runs" description="Agent turns appear here as customers chat." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
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
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : runs?.map((r) => (
                    <tr key={r.id} className={cn('hover:bg-gray-50', r.error && 'bg-red-50/40')}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-700">{r.model.replace('claude-', '').replace('gemini-', 'g-')}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.input_tokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700">{r.output_tokens.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {r.cache_read_tokens > 0
                          ? <Badge colorClass="bg-green-100 text-green-700">{r.cache_read_tokens.toLocaleString()}</Badge>
                          : <span className="text-gray-400">—</span>}
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
