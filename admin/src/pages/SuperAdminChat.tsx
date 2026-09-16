import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, ShieldCheck, Trash2, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/api/superAdmin'
import { modelsApi } from '@/api/models'
import { cn } from '@/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
  modelUsed?: string
}

// History sent to the backend — simple role/content pairs only.
interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

function parseModel(value: string): { provider?: 'anthropic' | 'gemini' | 'groq'; model?: string } {
  if (!value) return {}
  const [rawProvider, model] = value.split('::')
  const provider = (['anthropic', 'gemini', 'groq'] as const).find((p) => p === rawProvider)
  return { provider, model }
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: DisplayMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('mb-5 flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-violet-600' : 'bg-gray-700',
        )}
      >
        {isUser ? (
          <ShieldCheck className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-gray-300" />
        )}
      </div>

      {/* Content */}
      <div className="max-w-[75%]">
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'rounded-tr-sm bg-violet-600 text-white'
              : 'rounded-tl-sm bg-gray-800 text-gray-100',
          )}
        >
          {msg.content}
        </div>

        {/* Tool + model badges */}
        {(msg.toolsUsed?.length || msg.modelUsed) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {msg.modelUsed && (
              <span className="rounded-full bg-violet-900/60 px-2 py-0.5 text-xs font-medium text-violet-300">
                {msg.modelUsed}
              </span>
            )}
            {msg.toolsUsed?.map((t) => (
              <span
                key={t}
                className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="mb-5 flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700">
        <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-gray-800 px-4 py-2.5">
        <div className="flex gap-1 items-center h-5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SuperAdminChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch live model list from backend so deprecated models never appear.
  const { data: allModels = [] } = useQuery({
    queryKey: ['models'],
    queryFn: modelsApi.list,
    staleTime: 5 * 60_000,
  })

  const safeModels = Array.isArray(allModels) ? allModels : []
  const modelOptions = [
    { value: '', label: 'Default model' },
    ...safeModels.map((m) => ({
      value: `${m.provider}::${m.model}`,
      label: m.label,
    })),
  ]

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (vars: { message: string; history: ApiMessage[]; model?: string }) =>
      superAdminApi.chat(vars),
    onSuccess: (data, vars) => {
      const assistantMsg: DisplayMessage = {
        role: 'assistant',
        content: data.reply,
        toolsUsed: data.tools_used.length ? data.tools_used : undefined,
      }
      setMessages((prev) => [...prev, assistantMsg])
      // Update API history with the completed exchange
      setApiHistory((prev) => [
        ...prev,
        { role: 'user', content: vars.message },
        { role: 'assistant', content: data.reply },
      ])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ])
    },
  })

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isPending) return

    const userMsg: DisplayMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const { model } = parseModel(selectedModel)
    sendMessage({ message: text, history: apiHistory, model })
  }, [input, isPending, selectedModel, apiHistory, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
    setApiHistory([])
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Platform AI</h1>
          <p className="text-xs text-gray-500">
            Ask anything about businesses, plans, feature requests, or audit activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Model selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {modelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Clear conversation */}
          <button
            onClick={handleClear}
            disabled={messages.length === 0}
            title="Clear conversation"
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:border-red-800 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-900/40">
              <Bot className="h-6 w-6 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-gray-300">Platform AI ready</p>
            <p className="mt-1 max-w-xs text-xs text-gray-500">
              Try: "Give me a platform overview", "List all businesses on the pro plan",
              or "Approve the WhatsApp request from demo-store."
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isPending && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="mt-3 flex gap-2 items-end">
        <div className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the platform AI… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-gray-100 placeholder-gray-600 outline-none"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || isPending}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
            !input.trim() || isPending
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-700',
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-gray-700">
        Conversation is not stored — history resets on page refresh.
      </p>
    </div>
  )
}
