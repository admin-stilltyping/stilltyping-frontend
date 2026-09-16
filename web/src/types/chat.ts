export interface ChatRequest {
  message: string
  user_id?: string
  business_slug?: string
  display_name?: string
  provider?: 'anthropic' | 'gemini' | 'groq'
  model?: string
  admin_mode?: boolean
}

export interface ToolUsed {
  tool: string
  arguments: Record<string, unknown>
}

export interface ChatResponse {
  reply: string
  business_slug: string
  conversation_id: string
  customer_id: string
  conversation_state: string
  tools_used: ToolUsed[]
  model_used: string
  channel_latency_ms: number | null
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ModelOption {
  provider: 'anthropic' | 'gemini' | 'groq'
  model: string
  label: string
}

export interface SessionOut {
  user_id: string
  customer_name: string | null
  conversation_id: string | null
  last_message_at: string | null
}

// Mirrors AVAILABLE_MODELS in app/agent/models_registry.py — keep in sync.
// Used by the super-admin chat (unrestricted model picker); the client-admin
// chat (ChatTest) fetches from /admin/models and filters by plan entitlement.
export const MODEL_OPTIONS: ModelOption[] = [
  // Anthropic — Claude
  { provider: 'anthropic', model: 'claude-opus-4-7',                      label: 'Claude Opus 4' },
  { provider: 'anthropic', model: 'claude-sonnet-4-6',                    label: 'Claude Sonnet 4' },
  { provider: 'anthropic', model: 'claude-haiku-4-5-20251001',            label: 'Claude Haiku 4' },
  // Google — Gemini
  { provider: 'gemini',    model: 'gemini-3.1-pro-preview',               label: 'Gemini 3.1 Pro' },
  { provider: 'gemini',    model: 'gemini-3.6-flash',                     label: 'Gemini 3.6 Flash' },
  { provider: 'gemini',    model: 'gemini-3.5-flash-lite',                label: 'Gemini 3.5 Flash Lite' },
  // Groq — fast inference
  { provider: 'groq',      model: 'openai/gpt-oss-120b',                  label: 'GPT-OSS 120B (Groq)' },
  { provider: 'groq',      model: 'llama-3.3-70b-versatile',              label: 'Llama 3.3 70B (Groq)' },
  { provider: 'groq',      model: 'llama3-groq-70b-8192-tool-use-preview',label: 'Llama 3 70B Tool Use (Groq)' },
  { provider: 'groq',      model: 'deepseek-r1-distill-llama-70b',        label: 'DeepSeek R1 70B (Groq)' },
]
