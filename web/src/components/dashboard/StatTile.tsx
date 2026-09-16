import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Metric } from '@/types/analytics'
import { formatPercent } from '@/utils/formatters'
import { Sparkline } from './Sparkline'

interface StatTileProps {
  label: string
  value: string
  metric: Metric
  /** Sparkline hue (defaults to the brand violet). */
  accent?: string
}

export function StatTile({ label, value, metric, accent = '#7c3aed' }: StatTileProps) {
  const { delta, higherIsBetter, spark } = metric
  const good = delta == null ? null : delta === 0 ? null : delta > 0 === higherIsBetter
  const deltaColor = good == null ? '#6b7280' : good ? '#15803d' : '#b91c1c'
  const Arrow = delta != null && delta < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <div className="group rounded-xl border border-dash-line bg-dash-surface/80 p-4 transition-colors hover:border-gray-300">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-dash-ink3">{label}</span>
        {delta != null && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium"
            style={{ color: deltaColor, fontVariantNumeric: 'tabular-nums' }}
            title="vs previous period"
          >
            <Arrow className="h-3 w-3" />
            {formatPercent(Math.abs(delta))}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold leading-none text-dash-ink">{value}</span>
        <Sparkline data={spark} stroke={accent} width={92} height={30} className="mb-0.5 opacity-90" />
      </div>
    </div>
  )
}
