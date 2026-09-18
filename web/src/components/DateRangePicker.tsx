import { useState } from 'react'
import { cn } from '@/utils/cn'
import { calendarDate } from '@/utils/aiUsage'

/**
 * `{ start: undefined, end: undefined }` means "use the backend's default"
 * (currently: so far this calendar month). Both are `YYYY-MM-DD` strings
 * otherwise. Shared by any page that filters a query by date range — first
 * consumer is AiUsagePage; the Dashboard's own date-range work (in
 * parallel) may adopt this too.
 */
export interface DateRangeValue {
  start?: string
  end?: string
}

type Preset = 'this-month' | '7d' | '30d' | 'custom'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'this-month', label: 'This month' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

export function DateRangePicker({
  value,
  onChange,
  timeZone,
}: {
  value: DateRangeValue
  timeZone?: string
  onChange: (range: DateRangeValue) => void
}) {
  // Derived once on mount from the incoming value, then owned locally — a
  // custom start/end could coincidentally match a preset's computed dates,
  // so we can't re-derive "which preset is active" from `value` alone.
  const [preset, setPreset] = useState<Preset>(value.start || value.end ? 'custom' : 'this-month')
  const [customStart, setCustomStart] = useState(value.start ?? '')
  const [customEnd, setCustomEnd] = useState(value.end ?? '')

  function selectPreset(p: Preset) {
    setPreset(p)
    if (p === 'this-month') {
      onChange({ start: undefined, end: undefined })
    } else if (p === '7d') {
      onChange({ start: calendarDate(6, timeZone), end: calendarDate(0, timeZone) })
    } else if (p === '30d') {
      onChange({ start: calendarDate(29, timeZone), end: calendarDate(0, timeZone) })
    } else if (customStart && customEnd) {
      onChange({ start: customStart, end: customEnd })
    }
  }

  function updateCustom(next: { start?: string; end?: string }) {
    const start = next.start !== undefined ? next.start : customStart
    const end = next.end !== undefined ? next.end : customEnd
    if (next.start !== undefined) setCustomStart(next.start)
    if (next.end !== undefined) setCustomEnd(next.end)
    if (start && end) onChange({ start, end })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="inline-flex max-w-full flex-wrap rounded-lg border border-gray-200 bg-gray-50 p-0.5"
        role="group"
        aria-label="Date range"
      >
        {PRESETS.map((p) => {
          const active = p.value === preset
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={() => selectPreset(p.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {preset === 'custom' && (
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <input
            aria-label="Start date"
            type="date"
            value={customStart}
            max={customEnd || undefined}
            onChange={(e) => updateCustom({ start: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            aria-label="End date"
            type="date"
            value={customEnd}
            min={customStart || undefined}
            onChange={(e) => updateCustom({ end: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  )
}
