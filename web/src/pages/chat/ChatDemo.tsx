import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Plus, ChevronDown, Check, CheckCheck } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/api/chat'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { cn } from '@/utils/cn'
import type { SessionOut } from '@/types/chat'

interface Msg {
  role: 'user' | 'assistant'
  content: string
  model?: string
  tools?: string[]
}

function newUserId() {
  return `demo-${Math.random().toString(36).slice(2, 7)}`
}

/** Render message text: linkify URLs, and turn a payment link into a button. */
function ContentBody({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) {
          const url = p.replace(/[)?.,]+$/, '')
          const isPay =
            url.includes('/mock/pay/') || url.includes('rzp.io') || url.includes('razorpay')
          if (isPay) {
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex w-fit items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
              >
                💳 Pay now
              </a>
            )
          }
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sky-700 underline"
            >
              {url}
            </a>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

export function ChatDemo() {
  const selectedBusinessSlug = useTenantSlug()
  const slug = selectedBusinessSlug || undefined
  const qc = useQueryClient()

  const [userId, setUserId] = useState(newUserId)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions', slug],
    queryFn: () => chatApi.sessions({ business_slug: slug }),
    staleTime: 5_000,
  })

  const { data: history } = useQuery({
    queryKey: ['chat-history', userId, slug],
    queryFn: () => chatApi.history({ user_id: userId, business_slug: slug }),
    enabled: !!userId,
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    setMessages((history ?? []).map((m) => ({ role: m.role, content: m.content })))
  }, [history])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { mutate: send, isPending } = useMutation({
    mutationFn: chatApi.send,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          model: data.model_used,
          tools: data.tools_used.map((t) => t.tool),
        },
      ])
      qc.invalidateQueries({ queryKey: ['chat-sessions', slug] })
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
      ])
    },
  })

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isPending) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    // No provider/model override → uses the server's configured model, exactly
    // like a real WhatsApp customer would hit it.
    send({ message: text, user_id: userId, business_slug: slug })
  }, [input, isPending, userId, slug, send])

  const switchCustomer = useCallback((uid: string) => {
    setUserId(uid)
    setMessages([])
    setSwitcherOpen(false)
  }, [])

  const newCustomer = useCallback(() => {
    const id = window.prompt(
      'New customer id (a phone number or name):',
      `cust-${Math.random().toString(36).slice(2, 7)}`,
    )
    if (id && id.trim()) switchCustomer(id.trim())
  }, [switchCustomer])

  const current = sessions.find((s) => s.user_id === userId)
  const displayName = current?.customer_name ?? userId

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      {/* ── Header (WhatsApp-style) ── */}
      <div className="relative flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Naveen Games</p>
          <p className="truncate text-xs text-emerald-100">
            you are: {displayName}
          </p>
        </div>

        {/* Customer switcher */}
        <div className="relative">
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
          >
            Change customer
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {switcherOpen && (
            <div className="absolute right-0 z-10 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800 shadow-xl">
              <button
                onClick={newCustomer}
                className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" /> New customer
              </button>
              <div className="max-h-72 overflow-y-auto">
                {sessions.length === 0 && (
                  <p className="px-3 py-3 text-xs text-gray-400">No customers yet.</p>
                )}
                {sessions.map((s: SessionOut) => (
                  <button
                    key={s.user_id}
                    onClick={() => switchCustomer(s.user_id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50',
                      s.user_id === userId && 'bg-emerald-50',
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                      {(s.customer_name ?? s.user_id).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {s.customer_name ?? s.user_id}
                      </p>
                      <p className="truncate text-xs text-gray-400">{s.user_id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages (WhatsApp wallpaper) ── */}
      <div
        className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
        style={{ background: '#ECE5DD' }}
        onClick={() => switcherOpen && setSwitcherOpen(false)}
      >
        {messages.length === 0 && (
          <div className="mx-auto mt-10 w-fit rounded-lg bg-white/70 px-4 py-2 text-center text-sm text-gray-500 shadow-sm">
            👋 Say hi to start — try “gta 5”, then “ok give the qr”.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[78%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm',
                m.role === 'user'
                  ? 'rounded-tr-none bg-[#DCF8C6] text-gray-900'
                  : 'rounded-tl-none bg-white text-gray-900',
              )}
            >
              <div className="whitespace-pre-wrap break-words">
                <ContentBody text={m.content} />
              </div>
              <div className="mt-1 flex items-center justify-end gap-1">
                {m.role === 'user' && <CheckCheck className="h-3.5 w-3.5 text-sky-500" />}
              </div>
              {showDetails && m.role === 'assistant' && (m.model || m.tools?.length) && (
                <div className="mt-1 flex flex-wrap gap-1 border-t border-gray-100 pt-1">
                  {m.model && (
                    <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-600">
                      {m.model}
                    </span>
                  )}
                  {m.tools?.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-tl-none bg-white px-4 py-2.5 text-sm text-gray-400 shadow-sm">
              typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Composer ── */}
      <div className="flex items-center gap-2 border-t border-gray-200 bg-[#F0F0F0] px-3 py-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message"
          className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#075E54] text-white transition-colors hover:bg-[#0a7d6f] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* ── Footer toggle ── */}
      <label className="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-white py-1.5 text-xs text-gray-400">
        <input
          type="checkbox"
          checked={showDetails}
          onChange={(e) => setShowDetails(e.target.checked)}
          className="h-3 w-3"
        />
        Show AI details (model + tools)
        <Check className="h-3 w-3 opacity-0" />
      </label>
    </div>
  )
}
