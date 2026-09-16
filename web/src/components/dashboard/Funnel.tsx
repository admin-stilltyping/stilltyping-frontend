import { ChevronDown } from 'lucide-react'
import { formatNumber, formatPercent } from '@/utils/formatters'

export interface FunnelStageData {
  label: string
  value: number
}

// Ordinal blue ramp (light → dark), lightest step still legible on a white surface.
const RAMP = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a']

export function Funnel({
  stages,
  footerLabel = 'First → last stage',
}: {
  stages: FunnelStageData[]
  footerLabel?: string
}) {
  if (!stages.length) return null
  const top = stages[0].value || 1
  const overall = stages[stages.length - 1].value / top

  return (
    <div>
      <ul className="space-y-3.5">
        {stages.map((s, i) => {
          const widthPct = Math.max(3, (s.value / top) * 100)
          const stepConv = i === 0 ? 1 : s.value / (stages[i - 1].value || 1)
          const drop = 1 - stepConv
          const color = RAMP[i] ?? RAMP[RAMP.length - 1]
          return (
            <li key={`${s.label}-${i}`}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-dash-ink2">{s.label}</span>
                <span className="text-sm font-semibold text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatNumber(s.value)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-gray-900/[0.06]">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{ width: `${widthPct}%`, background: color }}
                    title={`${s.label}: ${formatNumber(s.value)} (${formatPercent(s.value / top)} of top)`}
                  />
                </div>
                {i > 0 && (
                  <span
                    className="flex w-16 shrink-0 items-center justify-end gap-0.5 text-xs"
                    style={{ color: drop > 0.4 ? '#9a3412' : '#4b5563', fontVariantNumeric: 'tabular-nums' }}
                    title={`${formatPercent(drop)} drop from previous step`}
                  >
                    <ChevronDown className="h-3 w-3" />
                    {formatPercent(stepConv)}
                  </span>
                )}
                {i === 0 && <span className="w-16 shrink-0" />}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-dash-line pt-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-dash-ink3">{footerLabel}</span>
        <span className="text-sm font-semibold text-dash-violetlt" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatPercent(overall, 1)} convert
        </span>
      </div>
    </div>
  )
}
