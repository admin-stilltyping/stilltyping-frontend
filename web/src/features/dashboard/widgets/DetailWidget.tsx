import { CheckCircle2 } from 'lucide-react'
import type { Widget } from '../types'
import { COLORS, HEAT_COLORS } from './palette'

export function DetailWidget({ widget }: { widget: Widget }) {
  const { data, type } = widget
  if (type === 'activity')
    return (
      <ul className="divide-y divide-slate-100">
        {data.items.map((item) => (
          <li key={item.detail} className="flex items-start gap-3 py-4 first:pt-1 last:pb-1">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
            <time className="ml-auto text-xs tabular-nums text-slate-400">{item.time}</time>
          </li>
        ))}
      </ul>
    )
  if (type === 'table')
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{widget.title}: sample counts by category</caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th scope="col" className="py-3 font-medium">
                Category
              </th>
              <th scope="col" className="py-3 text-right font-medium">
                Count
              </th>
              <th scope="col" className="py-3 text-right font-medium">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((point, index) => (
              <tr key={point.label} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="py-4 font-medium text-slate-700">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-sm"
                    style={{ background: COLORS[index % COLORS.length] }}
                  />
                  {point.label}
                </th>
                <td className="py-4 text-right tabular-nums text-slate-900">
                  {point.value.toLocaleString()}
                </td>
                <td className="py-4 text-right tabular-nums text-slate-500">
                  {Math.round((point.value / (data.value || 1)) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  if (type === 'funnel') {
    const first = data.points[0]?.value || 1
    return (
      <ol className="space-y-3 py-2">
        {data.points.map((point, index) => (
          <li key={point.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-slate-600">{point.label}</span>
              <span className="tabular-nums text-slate-500">
                {point.value.toLocaleString()}{' '}
                <span className="ml-2 text-slate-400">
                  {Math.round((point.value / first) * 100)}%
                </span>
              </span>
            </div>
            <div className="flex h-7 justify-center rounded bg-slate-50">
              <div
                className="h-full rounded"
                style={{
                  width: `${(point.value / first) * 100}%`,
                  background: COLORS[index % COLORS.length],
                }}
              />
            </div>
          </li>
        ))}
      </ol>
    )
  }
  const days = [...new Set(data.cells.map((cell) => cell.day))]
  const hours = [...new Set(data.cells.map((cell) => cell.hour))]
  const max = Math.max(1, ...data.cells.map((cell) => cell.value))
  return (
    <div className="overflow-x-auto py-1">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <caption className="sr-only">{widget.title}: sample activity by day and time</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Day</span>
            </th>
            {hours.map((hour) => (
              <th scope="col" key={hour} className="pb-2 text-[10px] font-normal text-slate-500">
                {hour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <th scope="row" className="pr-2 font-normal text-slate-500">
                {day}
              </th>
              {hours.map((hour) => {
                const value =
                  data.cells.find((cell) => cell.day === day && cell.hour === hour)?.value ?? 0
                const level = Math.min(4, Math.floor((value / max) * 5))
                return (
                  <td
                    key={hour}
                    title={`${day}, ${hour}: ${value}`}
                    aria-label={`${day}, ${hour}: ${value}`}
                    className="h-6 rounded-sm text-center text-[10px] tabular-nums"
                    style={{
                      backgroundColor: HEAT_COLORS[level],
                      color: level >= 3 ? 'white' : '#334155',
                    }}
                  >
                    {value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-500">
        <span>Less activity</span>
        {HEAT_COLORS.map((color) => (
          <span
            key={color}
            className="h-2.5 w-4 rounded-sm"
            style={{ background: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
