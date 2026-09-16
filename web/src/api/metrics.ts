import apiClient from './client'
import type { Metrics } from '@/types/metrics'

export async function fetchMetrics(slug: string): Promise<Metrics> {
  const { data } = await apiClient.get<Metrics>(`/admin/${slug}/metrics`)
  return data
}
