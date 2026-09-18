export interface AgentMessage {
  id: string
  seq: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AgentHistory {
  messages: AgentMessage[]
  next_before: number | null
}

export interface AgentSession {
  session_id: string
  title: string
  updated_at: string
}

export interface AgentSessions {
  sessions: AgentSession[]
  next_offset: number | null
}

export interface AgentSend {
  session_id: string
  request_id: string
  message: string
}

export interface AgentReply {
  messages: AgentMessage[]
  knowledge_units: { id: string; title: string; content: string }[]
  support_ticket: string | null
  response_time_ms: number | null
}
