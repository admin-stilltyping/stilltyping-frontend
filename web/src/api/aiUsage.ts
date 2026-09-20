import apiClient from './client'

export interface AiUsageReply {
  id: string
  request_id: string
  channel: string
  started_at: string
  completed_at: string
  duration_ms: number
  input_tokens: number
  output_tokens: number
  cached_input_tokens?: number | null
  uncached_input_tokens?: number | null
  llm_calls?: number
  tokens_complete: boolean
  status: 'completed' | 'failed' | 'awaiting_send' | 'send_failed'
}

export interface AiUsageResponse {
  timezone: string
  start: string
  end: string
  total_count: number
  next_offset: number | null
  summary: {
    replies: number
    input_tokens: number
    output_tokens: number
    cached_input_tokens?: number
    uncached_input_tokens?: number
    cache_incomplete_replies?: number
    incomplete_replies: number
    average_duration_ms: number | null
    failed_replies: number
  }
  items: AiUsageReply[]
}

export interface AiUsageParams {
  start?: string
  end?: string
  channel?: string
  offset?: number
  limit?: number
}

export const aiUsageApi = {
  get: (slug: string, params?: AiUsageParams) =>
    apiClient.get<AiUsageResponse>(`/admin/${slug}/ai-usage`, { params }).then((r) => r.data),
}
