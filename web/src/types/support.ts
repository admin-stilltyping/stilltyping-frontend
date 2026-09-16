// Matches context-agent's support_tickets shape (see app support.as_dict).
export type TicketStatus = 'open' | 'resolved'

export interface SupportTicket {
  ticket_ref: string
  tenant_id: string
  status: TicketStatus
  question: string
  reason: string
  channel: string | null
  external_user_id: string | null
  notes: string | null
  request_id: string
  created_at: string | null
  resolved_at: string | null
}

export interface UpdateTicketPayload {
  status?: TicketStatus
  notes?: string
}

export interface ListTicketsParams {
  status?: TicketStatus
}
