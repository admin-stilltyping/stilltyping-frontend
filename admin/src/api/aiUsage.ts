import { superAdminClient } from './superAdmin'

export interface AiUsageRow {
  business_id: string
  business_slug: string
  business_name: string
  runs: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  limit_usd: number | null
}

export interface AiUsageDetail extends AiUsageRow {
  by_day: { date: string; runs: number; cost_usd: number }[]
}

export const aiUsageApi = {
  listAiUsage: () =>
    superAdminClient.get<AiUsageRow[]>('/super-admin/ai-usage').then((r) => r.data),

  getAiUsage: (slug: string) =>
    superAdminClient.get<AiUsageDetail>(`/super-admin/ai-usage/${slug}`).then((r) => r.data),
}
