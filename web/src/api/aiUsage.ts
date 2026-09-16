import apiClient from './client'

export interface AiUsageTotal {
  runs: number
  cost_usd: number
  input_tokens: number
  output_tokens: number
}

export interface AiUsageByChannel {
  channel: 'whatsapp' | 'telegram' | 'web' | 'instagram' | string
  runs: number
  cost_usd: number
}

export interface AiUsageByCustomer {
  customer_id: string
  customer_name: string | null
  runs: number
  cost_usd: number
}

export interface AiUsageResponse {
  total: AiUsageTotal
  by_channel: AiUsageByChannel[]
  by_customer: AiUsageByCustomer[]
}

export interface AiUsageParams {
  start?: string
  end?: string
}

export const aiUsageApi = {
  get: (slug: string, params?: AiUsageParams) =>
    apiClient
      .get<AiUsageResponse>(`/admin/${slug}/ai-usage`, { params })
      .then((r) => r.data),
}

export function getAiUsage(slug: string, params?: AiUsageParams): Promise<AiUsageResponse> {
  return aiUsageApi.get(slug, params)
}
