export interface AgentRun {
  id: string
  conversation_id: string | null
  model: string
  effort: string | null
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_creation_tokens: number
  iterations: number
  tool_calls: number
  stop_reason: string | null
  latency_ms: number | null
  error: string | null
  estimated_cost_usd: number
  created_at: string
}
