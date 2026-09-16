import type { DateRange } from '@/types/analytics'
import { cn } from '@/utils/cn'

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1d', label: 'Today' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

export function RangeToggle({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (r: DateRange) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-dash-line bg-dash-surface2/60 p-0.5" role="tablist" aria-label="Date range">
      {OPTIONS.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider transition-colors',
              active ? 'bg-dash-violet/20 text-dash-violetlt' : 'text-dash-ink3 hover:text-dash-ink2',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
