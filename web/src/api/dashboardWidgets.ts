import apiClient from './client'

// Mirrors app/api/admin/dashboard_widgets.py response shapes — one discriminated
// union, keyed on `type`. Every widget key in WIDGET_CATALOG resolves to exactly
// one of these at fetch time.
export type WidgetData =
  | { type: 'stat';   label: string; value: number; unit?: string | null }
  | { type: 'chart';  label: string; series: { label: string; value: number }[] }
  | { type: 'bar';    label: string; bars: { label: string; value: number }[] }
  | { type: 'donut';  label: string; slices: { label: string; value: number }[] }
  | { type: 'funnel'; label: string; stages: { label: string; value: number }[] }
  | { type: 'list';   label: string; items: { title: string; subtitle?: string | null; severity: 'info' | 'warning' | 'critical' }[] }
  | { type: 'gauge';  label: string; items: { label: string; used: number; limit: number | null }[] }

export async function fetchWidgetData(
  slug: string,
  key: string,
  range?: { start?: string; end?: string },
): Promise<WidgetData> {
  const { data } = await apiClient.get<WidgetData>(`/admin/${slug}/dashboard/widgets/${key}`, {
    params: range?.start || range?.end ? { start: range.start, end: range.end } : undefined,
  })
  return data
}
