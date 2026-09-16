export type WebhookSource = 'whatsapp' | 'telegram' | 'razorpay'
export type WebhookStatus = 'received' | 'processing' | 'processed' | 'failed' | 'ignored'

export interface WebhookEvent {
  id: string
  source: WebhookSource
  external_event_id: string
  status: WebhookStatus
  signature_verified: boolean
  error: string | null
  attempts: number
  processed_at: string | null
  created_at: string
}
