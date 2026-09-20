import { superAdminClient } from './superAdmin'

export interface RequestTimingItem {
  id: string
  request_id: string
  business_slug: string
  business_name: string
  channel: string
  started_at: string
  completed_at: string
  status: 'completed' | 'failed' | 'awaiting_send' | 'send_failed'
  duration_ms: number
  queue_ms: number | null
  db_ms: number | null
  ai_ms: number | null
  tool_ms: number | null
  send_ms: number | null
}

export interface RequestTimingSummary {
  replies: number
  average_duration_ms: number | null
  slowest_duration_ms: number | null
  average_queue_ms: number | null
  average_db_ms: number | null
  average_ai_ms: number | null
  average_send_ms: number | null
  failed_replies: number
}

export interface RequestTimingResponse {
  start: string
  end: string
  total_count: number
  next_offset: number | null
  summary: RequestTimingSummary
  items: RequestTimingItem[]
}

export interface RequestTimingParams {
  business?: string
  channel?: string
  status?: RequestTimingItem['status']
  start?: string
  end?: string
  offset?: number
  limit?: number
}

export const requestTimingApi = {
  list: (params?: RequestTimingParams) =>
    superAdminClient
      .get<RequestTimingResponse>('/super-admin/request-timing', { params })
      .then((r) => r.data),
}
