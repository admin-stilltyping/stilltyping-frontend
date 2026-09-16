export type UseCase = 'support' | 'clinic' | 'retail' | 'services'
export type Period = 7 | 30 | 90
export type WidgetType =
  | 'kpi'
  | 'progress'
  | 'gauge'
  | 'sparkline'
  | 'line'
  | 'area'
  | 'horizontal_bar'
  | 'vertical_bar'
  | 'grouped_bar'
  | 'stacked_bar'
  | 'pie'
  | 'donut'
  | 'funnel'
  | 'heatmap'
  | 'table'
  | 'activity'

export interface WidgetDefinition {
  id: WidgetType
  type: WidgetType
  type_label: string
  group: 'summary' | 'chart' | 'detail'
  title: string
  description: string
}
export interface Point {
  label: string
  value: number
  secondary: number | null
}
export interface WidgetData {
  value: number
  delta: number
  unit: string
  target: number
  points: Point[]
  series_labels: string[]
  cells: { day: string; hour: string; value: number }[]
  items: { title: string; detail: string; time: string }[]
}
export interface Widget extends WidgetDefinition {
  data: WidgetData
}
export interface DashboardResponse {
  mode: 'demo'
  business_id: string
  business_slug: string
  business_name: string
  period: Period
  config: { use_case: UseCase; widget_ids: WidgetType[]; revision: number; as_of: string }
  use_cases: Record<UseCase, string>
  catalog: WidgetDefinition[]
  widgets: Widget[]
}
