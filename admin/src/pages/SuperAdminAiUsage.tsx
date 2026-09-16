import { Fragment, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { aiUsageApi, type AiUsageRow } from '@/api/aiUsage'
import { cn } from '@/utils/cn'

type SortKey = 'business_name' | 'runs' | 'tokens' | 'cost_usd' | 'limit_usd'

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

function DailyBreakdown({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-ai-usage', slug],
    queryFn: () => aiUsageApi.getAiUsage(slug),
  })

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded-lg bg-gray-800" />
  }

  if (!data || data.by_day.length === 0) {
    return <p className="py-3 text-xs text-gray-600">No usage recorded this month yet.</p>
  }

  const maxCost = Math.max(...data.by_day.map((d) => d.cost_usd), 0.01)

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-1.5 pr-4 font-medium">Date</th>
          <th className="py-1.5 pr-4 font-medium">Runs</th>
          <th className="py-1.5 pr-4 font-medium">Cost</th>
          <th className="py-1.5 font-medium">Trend</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800/60">
        {data.by_day.map((d) => (
          <tr key={d.date}>
            <td className="py-1.5 pr-4 text-gray-400 whitespace-nowrap">{d.date}</td>
            <td className="py-1.5 pr-4 text-gray-300">{d.runs}</td>
            <td className="py-1.5 pr-4 text-gray-300">{formatUsd(d.cost_usd)}</td>
            <td className="py-1.5 w-1/2">
              <div className="h-1.5 w-full rounded-full bg-gray-800">
                <div
                  className="h-1.5 rounded-full bg-violet-500"
                  style={{ width: `${Math.min(100, (d.cost_usd / maxCost) * 100)}%` }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function SuperAdminAiUsage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('cost_usd')
  const [sortDesc, setSortDesc] = useState(true)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['super-admin-ai-usage'],
    queryFn: aiUsageApi.listAiUsage,
    staleTime: 30_000,
  })

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let av: number | string
      let bv: number | string
      if (sortKey === 'tokens') {
        av = a.input_tokens + a.output_tokens
        bv = b.input_tokens + b.output_tokens
      } else if (sortKey === 'limit_usd') {
        av = a.limit_usd ?? Number.POSITIVE_INFINITY
        bv = b.limit_usd ?? Number.POSITIVE_INFINITY
      } else {
        av = a[sortKey]
        bv = b[sortKey]
      }
      if (typeof av === 'string' || typeof bv === 'string') {
        const cmp = String(av).localeCompare(String(bv))
        return sortDesc ? -cmp : cmp
      }
      const cmp = (av as number) - (bv as number)
      return sortDesc ? -cmp : cmp
    })
    return copy
  }, [rows, sortKey, sortDesc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((d) => !d)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  const isOverBudget = (row: AiUsageRow) => row.limit_usd !== null && row.cost_usd >= row.limit_usd

  const columns: { key: SortKey; label: string }[] = [
    { key: 'business_name', label: 'Business' },
    { key: 'runs', label: 'Runs' },
    { key: 'tokens', label: 'Tokens' },
    { key: 'cost_usd', label: 'Cost (month)' },
    { key: 'limit_usd', label: 'Limit' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">AI Usage</h1>
        <p className="text-sm text-gray-400">Agent runs and spend per business, current calendar month.</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-800" />)}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-600">No AI usage recorded yet.</div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left">
                <th className="w-8 px-4 py-3" />
                {columns.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="cursor-pointer select-none px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider hover:text-gray-300"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortKey === key && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3 -rotate-90" />)}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {sorted.map((row) => {
                const over = isOverBudget(row)
                const isExpanded = expanded === row.business_slug
                return (
                  <Fragment key={row.business_id}>
                    <tr
                      onClick={() => setExpanded(isExpanded ? null : row.business_slug)}
                      className="cursor-pointer hover:bg-gray-900"
                    >
                      <td className="px-4 py-3 text-gray-600">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-200">{row.business_name}</p>
                        <p className="font-mono text-[10px] text-gray-600">{row.business_slug}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{row.runs}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {(row.input_tokens + row.output_tokens).toLocaleString()}
                        <span className="ml-1 text-[10px] text-gray-600">
                          ({row.input_tokens.toLocaleString()} in / {row.output_tokens.toLocaleString()} out)
                        </span>
                      </td>
                      <td className={cn('px-4 py-3 font-medium', over ? 'text-red-400' : 'text-gray-300')}>
                        {formatUsd(row.cost_usd)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {row.limit_usd === null ? 'Unlimited' : formatUsd(row.limit_usd)}
                      </td>
                      <td className="px-4 py-3">
                        {row.limit_usd === null ? (
                          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-500">n/a</span>
                        ) : over ? (
                          <span className="rounded-full bg-red-900 px-2 py-0.5 text-[10px] font-medium text-red-300">over budget</span>
                        ) : (
                          <span className="rounded-full bg-green-900 px-2 py-0.5 text-[10px] font-medium text-green-300">within limit</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-900/50">
                        <td />
                        <td colSpan={6} className="px-4 py-3">
                          <DailyBreakdown slug={row.business_slug} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
