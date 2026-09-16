import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { AttentionItem, AttentionSeverity } from '@/types/analytics'
import { formatMoney } from '@/utils/formatters'

const SEV: Record<AttentionSeverity, { weight: number; color: string; icon: LucideIcon }> = {
  critical: { weight: 3, color: '#b91c1c', icon: AlertOctagon },
  serious: { weight: 2, color: '#9a3412', icon: AlertTriangle },
  warning: { weight: 1, color: '#a16207', icon: Clock },
  good: { weight: 0, color: '#15803d', icon: CheckCircle2 },
}

export function NeedsAttention({ items, currency }: { items: AttentionItem[]; currency: string }) {
  const sorted = [...items].sort((a, b) => {
    const active = Number(b.count > 0) - Number(a.count > 0)
    if (active) return active
    return SEV[b.severity].weight - SEV[a.severity].weight || b.count - a.count
  })

  return (
    <ul className="divide-y divide-dash-line">
      {sorted.map((item) => {
        const meta = SEV[item.severity]
        const Icon = item.count === 0 ? CheckCircle2 : meta.icon
        const muted = item.count === 0
        const color = muted ? '#6b7280' : meta.color
        return (
          <li key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${color}1a` }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </span>
            <div className="min-w-0">
              <p className={muted ? 'text-sm text-dash-ink3' : 'text-sm text-dash-ink'}>{item.label}</p>
              <p className="truncate text-xs text-dash-ink3">
                {muted ? 'All clear' : item.hint}
                {item.amount != null && item.count > 0 ? ` · ${formatMoney(item.amount, currency)}` : ''}
              </p>
            </div>
            <span
              className="ml-auto text-lg font-semibold"
              style={{ color: muted ? '#6b7280' : '#111827', fontVariantNumeric: 'tabular-nums' }}
            >
              {item.count}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
