import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, RefreshCw, Plus, MessageSquare } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/api/chat'
import { modelsApi } from '@/api/models'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Button, Select } from '@nivaso/ui'
import { cn } from '@/utils/cn'
import type { SessionOut } from '@/types/chat'
import { Flag, flagArray } from '@nivaso/types'
import { useEntitlementStore } from '@/store/entitlementStore'
import { formatDate } from '@/utils/formatters'

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  modelUsed?: string
  toolsUsed?: string[]
  channelLatencyMs?: number | null
  fromHistory?: boolean
}

function parseModel(value: string): { provider?: 'anthropic' | 'gemini' | 'groq'; model?: string } {
  if (!value) return {}
  const [rawProvider, model] = value.split('::')
  const provider = (['anthropic', 'gemini', 'groq'] as const).find((p) => p === rawProvider)
  return { provider, model }
}

function newUserId() {
  return `session-${Date.now()}`
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({
  s,
  active,
  onClick,
}: {
  s: SessionOut
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
        active
          ? 'bg-blue-50 ring-1 ring-blue-200'
          : 'hover:bg-gray-50',
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
            active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600',
          )}
        >
          {(s.customer_name ?? s.user_id).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium',
              active ? 'text-blue-700' : 'text-gray-800',
            )}
          >
            {s.customer_name ?? s.user_id}
          </p>
          {s.customer_name && (
            <p className="truncate text-xs text-gray-400">{s.user_id}</p>
          )}
        </div>
      </div>
      {s.last_message_at && (
        <p className="mt-1 text-right text-xs text-gray-400">
          {formatDate(s.last_message_at)}
        </p>
      )}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatTest() {
  const selectedBusinessSlug = useTenantSlug()
  const qc = useQueryClient()
  const [userId, setUserId] = useState(newUserId)
  const [selectedModel, setSelectedModel] = useState('')

  // Fetch all platform models from the backend, then filter by plan entitlement.
  const entitlements = useEntitlementStore((s) => s.entitlements)
  const { data: allModels = [] } = useQuery({
    queryKey: ['models', selectedBusinessSlug],  // re-fetch when business changes
    queryFn: modelsApi.list,
    staleTime: 0,                                // always fresh — must stay in sync with entitlement model IDs
  })

  const safeAllModels = Array.isArray(allModels) ? allModels : []
  const allowedModelIds = flagArray(entitlements, Flag.AI_MODELS)
  const availableModels = allowedModelIds === null
    ? safeAllModels
    : safeAllModels.filter((m) => allowedModelIds.includes(m.model))
  // Declare safeModels before the useEffect that references it in its dep array.
  const safeModels = Array.isArray(availableModels) ? availableModels : []
  const modelSelectOptions = safeModels.map((m) => ({
    value: `${m.provider}::${m.model}`,
    label: m.label,
  }))

  // Auto-select the first plan-allowed model once the list loads.
  // Also reset if the current selection is no longer in the allowed list
  // (e.g. after switching to a business on a different plan).
  useEffect(() => {
    if (safeModels.length === 0) return
    const isStillAllowed = safeModels.some(
      (m) => `${m.provider}::${m.model}` === selectedModel,
    )
    if (!selectedModel || !isStillAllowed) {
      const first = safeModels[0]
      setSelectedModel(`${first.provider}::${first.model}`)
    }
  }, [safeModels, selectedModel])
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const slug = selectedBusinessSlug || undefined

  // ── Sessions list ────────────────────────────────────────────────────────

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions', slug],
    queryFn: () => chatApi.sessions({ business_slug: slug }),
    staleTime: 10_000,
  })

  // ── Conversation history ─────────────────────────────────────────────────

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['chat-history', userId, slug],
    queryFn: () => chatApi.history({ user_id: userId, business_slug: slug }),
    enabled: !!userId,
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    setMessages(
      (history ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        fromHistory: true,
      })),
    )
  }, [history])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ─────────────────────────────────────────────────────────

  const { mutate: send, isPending } = useMutation({
    mutationFn: chatApi.send,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          modelUsed: data.model_used,
          toolsUsed: data.tools_used.map((t) => t.tool),
          channelLatencyMs: data.channel_latency_ms,
        },
      ])
      // Refresh sessions list so new sessions / last_message_at updates appear
      qc.invalidateQueries({ queryKey: ['chat-sessions', slug] })
    },
  })

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isPending) return
    const { provider, model } = parseModel(selectedModel)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    send({
      message: text,
      user_id: userId,
      business_slug: slug,
      provider,
      model,
      admin_mode: true,
    })
  }, [input, isPending, selectedModel, userId, slug, send])

  // Select an existing session
  const handleSelectSession = useCallback((uid: string) => {
    setUserId(uid)
    setMessages([])
  }, [])

  // Start a fresh session — the backend tags all admin_mode sessions as test
  // customers regardless of user_id, so the frontend can use any stable ID.
  const handleNewSession = useCallback(() => {
    setUserId(newUserId())
    setMessages([])
    setInput('')
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* ── Sessions sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
          <span className="text-sm font-semibold text-gray-700">Sessions</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            title="Start a new session"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {sessionsLoading && (
            <p className="py-4 text-center text-xs text-gray-400">Loading…</p>
          )}

          {!sessionsLoading && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-400">No sessions yet.</p>
              <p className="text-xs text-gray-400">Send a message to create one.</p>
            </div>
          )}

          <div className="space-y-1">
            {sessions.map((s) => (
              <SessionCard
                key={s.user_id}
                s={s}
                active={s.user_id === userId}
                onClick={() => handleSelectSession(s.user_id)}
              />
            ))}
          </div>

          {/* Current session might not be in the list yet (no message sent) */}
          {userId && !sessions.find((s) => s.user_id === userId) && (
            <div className="mt-1">
              <SessionCard
                s={{
                  user_id: userId,
                  customer_name: null,
                  conversation_id: null,
                  last_message_at: null,
                }}
                active
                onClick={() => {}}
              />
            </div>
          )}
        </div>
      </aside>

      {/* ── Chat area ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
          {/* Active business indicator */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">Business</label>
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-mono text-gray-700">
              {slug || <span className="text-gray-400">not selected</span>}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">Session ID</label>
            <input
              value={userId}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="web-tester"
            />
          </div>

          <div className="flex min-w-[180px] flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-500">Model</label>
              {entitlements && (
                <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 capitalize">
                  {entitlements.plan} · {safeModels.length} available
                </span>
              )}
            </div>
            <Select
              options={modelSelectOptions}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ['chat-history', userId, slug] })
                qc.invalidateQueries({ queryKey: ['chat-sessions', slug] })
              }}
              title="Reload history from server"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {historyLoading && (
            <p className="py-4 text-center text-sm text-gray-400">Loading history…</p>
          )}

          {!historyLoading && messages.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              {sessions.find((s) => s.user_id === userId)
                ? 'No messages in this session yet.'
                : 'Send a message to start a new session.'}
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'mb-4 flex gap-3',
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  m.role === 'user' ? 'bg-blue-600' : 'bg-gray-200',
                )}
              >
                {m.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-gray-600" />
                )}
              </div>

              <div className="max-w-[75%]">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'rounded-tr-sm bg-blue-600 text-white'
                      : 'rounded-tl-sm bg-gray-100 text-gray-800',
                    m.fromHistory && 'opacity-80',
                  )}
                >
                  {m.content}
                </div>

                {(m.modelUsed || (m.toolsUsed && m.toolsUsed.length > 0) || m.channelLatencyMs != null) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.modelUsed && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                        {m.modelUsed}
                      </span>
                    )}
                    {m.channelLatencyMs != null && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        {m.channelLatencyMs < 1000
                          ? `${m.channelLatencyMs}ms`
                          : `${(m.channelLatencyMs / 1000).toFixed(1)}s`}
                      </span>
                    )}
                    {m.toolsUsed?.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button onClick={handleSend} loading={isPending} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
