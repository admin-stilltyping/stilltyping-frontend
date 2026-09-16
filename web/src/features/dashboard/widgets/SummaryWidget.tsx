import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Widget } from '../types'
import { ChartWidget } from './ChartWidget'

export function SummaryWidget({ widget }: { widget: Widget }) {
  const { data, type } = widget
  const ratio = Math.min(100, Math.max(0, (data.value / data.target) * 100))
  const Change = data.delta >= 0 ? ArrowUpRight : ArrowDownRight
  if (type === 'gauge')
    return (
      <div className="flex items-center gap-6 py-3">
        <div className="relative h-36 w-36 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full"
            role="img"
            aria-label={`${ratio.toFixed(0)} percent`}
          >
            <circle cx="60" cy="60" r="47" fill="none" stroke="#e2e8f0" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r="47"
              fill="none"
              stroke="#0d9488"
              strokeWidth="9"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${ratio} 100`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <strong className="absolute inset-0 flex items-center justify-center text-3xl font-semibold tabular-nums text-slate-900">
            {ratio.toFixed(0)}%
          </strong>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Sample score</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            An illustrative percentage for this business use case.
          </p>
        </div>
      </div>
    )
  return (
    <div className="pt-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <strong className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
          {data.value.toLocaleString()}
        </strong>
        <span className="text-sm text-slate-500">{data.unit}</span>
      </div>
      {type === 'progress' ? (
        <div className="mt-5 space-y-2">
          <div
            role="progressbar"
            aria-label={widget.title}
            aria-valuemin={0}
            aria-valuemax={data.target}
            aria-valuenow={data.value}
            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${ratio}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{ratio.toFixed(0)}% of goal</span>
            <span>Goal: {data.target.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <Change className={`h-4 w-4 ${data.delta >= 0 ? 'text-teal-600' : 'text-amber-600'}`} />
          <span className="font-semibold text-slate-700">{Math.abs(data.delta)}%</span> sample
          change from the previous period
        </p>
      )}
      {type === 'sparkline' && (
        <div className="mt-3">
          <ChartWidget widget={widget} />
        </div>
      )}
    </div>
  )
}
