import { AlertTriangle, PackageCheck } from 'lucide-react'
import type { StockItem } from '@/types/analytics'

// Status palette — fill carries severity, track is the same hue faded.
function severity(freeRatio: number): { color: string; label: string } {
  if (freeRatio <= 0.15) return { color: '#b91c1c', label: 'critical' }
  if (freeRatio <= 0.35) return { color: '#9a3412', label: 'low' }
  return { color: '#15803d', label: 'healthy' }
}

/**
 * Credential pools per game. The fill shows *free* slots, so a pool that's
 * nearly handed out reads as nearly empty — auto-delivery stops the moment a
 * game runs dry, so this is the panel that quietly prevents lost sales.
 */
export function StockArmory({ stock }: { stock: StockItem[] }) {
  const rows = [...stock].sort(
    (a, b) => (a.capacity - a.allocated) / a.capacity - (b.capacity - b.allocated) / b.capacity,
  )

  return (
    <ul className="space-y-3.5">
      {rows.map((s) => {
        const free = s.capacity - s.allocated
        const freeRatio = free / s.capacity
        const sev = severity(freeRatio)
        const alarm = freeRatio <= 0.35
        return (
          <li key={s.product}>
            <div className="mb-1.5 flex items-center gap-2">
              {alarm ? (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: sev.color }} />
              ) : (
                <PackageCheck className="h-3.5 w-3.5 shrink-0 text-dash-ink3" />
              )}
              <span className="truncate text-sm text-dash-ink2">{s.product}</span>
              <span
                className="ml-auto text-sm font-semibold"
                style={{ color: alarm ? sev.color : '#111827', fontVariantNumeric: 'tabular-nums' }}
              >
                {free}
                <span className="text-xs font-normal text-dash-ink3">/{s.capacity} free</span>
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: `${sev.color}1f` }}
              title={`${s.product}: ${free} of ${s.capacity} slots free · ${s.activeAccounts} accounts`}
            >
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, freeRatio * 100)}%`, background: sev.color }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
