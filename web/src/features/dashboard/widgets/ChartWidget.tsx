import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Widget } from '../types'
import { COLORS } from './palette'

const axis = { fontSize: 11, fill: '#64748b' }
const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 4px 18px #0f172a0d',
}
const number = (value: number) => new Intl.NumberFormat('en', { notation: 'compact' }).format(value)

export function ChartWidget({ widget }: { widget: Widget }) {
  const { data, type } = widget
  const points = data.points
  if (type === 'pie' || type === 'donut')
    return (
      <div className="flex min-h-60 flex-col items-center gap-3 sm:flex-row">
        <div className="relative h-56 w-full min-w-0 sm:w-3/5">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart accessibilityLayer>
              <Pie
                data={points}
                dataKey="value"
                nameKey="label"
                innerRadius={type === 'donut' ? 60 : 0}
                outerRadius={89}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={3}
                isAnimationActive={false}
              >
                {points.map((point, index) => (
                  <Cell key={point.label} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          {type === 'donut' && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-2xl font-semibold tabular-nums text-slate-900">
                {number(points.reduce((sum, point) => sum + point.value, 0))}
              </strong>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          )}
        </div>
        <ul className="w-full space-y-3 text-xs sm:w-2/5">
          {points.map((point, index) => (
            <li key={point.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <span className="text-slate-600">{point.label}</span>
              <strong className="ml-auto tabular-nums text-slate-900">
                {point.value.toLocaleString()}
              </strong>
            </li>
          ))}
        </ul>
      </div>
    )

  if (type === 'line' || type === 'area' || type === 'sparkline') {
    const isSpark = type === 'sparkline'
    const chartProps = { data: points, margin: { top: 8, right: 10, bottom: 0, left: -22 } }
    const decorations = (
      <>
        {!isSpark && <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />}
        {!isSpark && (
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} minTickGap={20} />
        )}
        {!isSpark && <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={number} />}
        <Tooltip contentStyle={tooltipStyle} />
      </>
    )
    return (
      <div className={isSpark ? 'h-20 w-full' : 'h-60 w-full'}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {type === 'line' ? (
            <LineChart {...chartProps} accessibilityLayer>
              {decorations}
              <Line
                type="monotone"
                dataKey="value"
                name="Count"
                stroke={COLORS[0]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <AreaChart {...chartProps} accessibilityLayer>
              {decorations}
              <Area
                type="monotone"
                dataKey="value"
                name="Count"
                stroke={COLORS[1]}
                strokeWidth={2.5}
                fill={COLORS[1]}
                fillOpacity={0.1}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  const horizontal = type === 'horizontal_bar'
  const double = type === 'grouped_bar' || type === 'stacked_bar'
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={points}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 10, bottom: 0, left: horizontal ? 0 : -22 }}
          barGap={3}
          accessibilityLayer
        >
          <CartesianGrid
            vertical={horizontal}
            horizontal={!horizontal}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
          <XAxis
            type={horizontal ? 'number' : 'category'}
            dataKey={horizontal ? undefined : 'label'}
            tick={axis}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            type={horizontal ? 'category' : 'number'}
            dataKey={horizontal ? 'label' : undefined}
            width={horizontal ? 105 : 60}
            tick={axis}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
          {double && (
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            />
          )}
          <Bar
            dataKey="value"
            name={double ? data.series_labels[0] : 'Count'}
            fill={COLORS[0]}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={36}
            stackId={type === 'stacked_bar' ? 'total' : undefined}
            isAnimationActive={false}
          />
          {double && (
            <Bar
              dataKey="secondary"
              name={data.series_labels[1]}
              fill={COLORS[1]}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              stackId={type === 'stacked_bar' ? 'total' : undefined}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
