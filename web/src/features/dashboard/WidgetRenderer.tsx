import type { Widget } from './types'
import { ChartWidget } from './widgets/ChartWidget'
import { SummaryWidget } from './widgets/SummaryWidget'
import { DetailWidget } from './widgets/DetailWidget'

export function WidgetRenderer({ widget }: { widget: Widget }) {
  return (
    <article
      aria-label={widget.title}
      data-widget-type={widget.type}
      className="min-w-0 rounded-xl border border-slate-200 bg-white"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{widget.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{widget.type_label}</p>
        </div>
        <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
          Demo
        </span>
      </header>
      <div className="px-5 py-4">
        {widget.group === 'summary' ? (
          <SummaryWidget widget={widget} />
        ) : widget.group === 'chart' ? (
          <ChartWidget widget={widget} />
        ) : (
          <DetailWidget widget={widget} />
        )}
        {widget.group === 'chart' && (
          <details className="mt-3 text-xs text-slate-500">
            <summary className="w-fit cursor-pointer rounded hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
              View data
            </summary>
            <div className="mt-2 max-h-40 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th scope="col" className="py-1 font-medium">
                      Label
                    </th>
                    <th scope="col" className="py-1 text-right font-medium">
                      {widget.type === 'grouped_bar' || widget.type === 'stacked_bar'
                        ? widget.data.series_labels[0]
                        : 'Value'}
                    </th>
                    {(widget.type === 'grouped_bar' || widget.type === 'stacked_bar') && (
                      <th scope="col" className="py-1 text-right font-medium">
                        {widget.data.series_labels[1]}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {widget.data.points.map((point) => (
                    <tr key={point.label}>
                      <td className="py-1">{point.label}</td>
                      <td className="text-right tabular-nums">{point.value}</td>
                      {(widget.type === 'grouped_bar' || widget.type === 'stacked_bar') && (
                        <td className="text-right tabular-nums">{point.secondary}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>
    </article>
  )
}
