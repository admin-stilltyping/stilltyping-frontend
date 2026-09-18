export type WebhookSource = 'instagram' | 'whatsapp' | 'telegram'
export type WebhookStatus = 'received' | 'processing' | 'processed' | 'failed' | 'ignored'

export interface WebhookEvent {
  id: string
  source: WebhookSource
  external_event_id: string | null
  status: WebhookStatus
  deliveries: number
  duration_ms: number | null
  detail: string
  request_id: string | null
  completed_at: string | null
  last_received_at: string | null
  created_at: string
}

export interface WebhookEventPage {
  items: WebhookEvent[]
  timezone: string
  start: string
  end: string
  total_count: number
  next_offset: number | null
  summary: { events: number; replies_sent: number; failed: number; duplicate_deliveries: number }
}
