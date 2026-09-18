import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useIsMutating, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Bot, History, MessageSquare, Plus, RefreshCw, Send, User } from 'lucide-react'
import { Button, Modal } from '@nivaso/ui'
import { Flag } from '@nivaso/types'
import { agentChatApi } from '@/api/agentChat'
import { InlineLoading, Skeleton } from '@/components/ui/LoadingState'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useEntitlementStore } from '@/store/entitlementStore'
import type { AgentHistory, AgentReply, AgentSession } from '@/types/agentChat'
import { apiError } from '@/utils/apiError'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/formatters'

const isSessionId = (value: string | null): value is string => Boolean(value && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value))

function ChatLoading({ history = false }: { history?: boolean }) {
  return <div role="status" aria-label={history ? 'Loading conversation' : 'Loading conversations'} className="space-y-4 p-3">
    <span className="sr-only">{history ? 'Loading conversation…' : 'Loading conversations…'}</span>
    {[0, 1, 2].map(i => <div key={i} className={cn('space-y-2', history && i === 1 && 'ml-auto w-3/4')}>
      <Skeleton className={history ? 'h-16 w-5/6' : 'h-4 w-4/5'} />
      <Skeleton className="h-3 w-1/2" />
    </div>)}
  </div>
}

function ChatWorkspace({ slug }: { slug: string }) {
  const [search, setSearch] = useSearchParams()
  const [draftId] = useState(() => crypto.randomUUID())
  const candidate = search.get('session')
  const sessionId = isSessionId(candidate) ? candidate : draftId
  const [historyOpen, setHistoryOpen] = useState(false)
  const busy = useIsMutating({ mutationKey: ['agent-chat-send', slug] }) > 0
  const sessions = useInfiniteQuery({
    queryKey: ['agent-chat-sessions', slug],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => agentChatApi.sessions(slug, pageParam),
    getNextPageParam: page => page.next_offset,
    staleTime: 30_000,
    retry: 1,
  })
  const allSessions = sessions.data?.pages.flatMap(page => page.sessions) ?? []
  const activeSession = allSessions.find(item => item.session_id === sessionId)

  function selectSession(id: string) {
    if (busy) return
    setSearch({ session: id })
    setHistoryOpen(false)
  }

  const sessionList = <>
    <Button variant="secondary" className="mb-4 w-full justify-center" onClick={() => selectSession(crypto.randomUUID())} disabled={busy}>
      <Plus size={16} />New conversation
    </Button>
    {sessions.isPending ? <ChatLoading /> : sessions.isError ? <div role="alert" className="space-y-2 p-2 text-sm text-red-700">
      <p>{apiError(sessions.error, 'Conversations could not be loaded.')}</p>
      <button className="font-medium underline" onClick={() => void sessions.refetch()}>Try again</button>
    </div> : <>
      {!activeSession && <div aria-current="page" className="mb-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm font-medium text-blue-700">New conversation<span className="mt-1 block text-xs font-normal text-blue-600">Saved after your first reply</span></div>}
      {allSessions.length > 0 && <nav aria-label="Saved conversations" className="space-y-1">
        {allSessions.map(item => <button key={item.session_id} disabled={busy}
          aria-current={item.session_id === sessionId ? 'page' : undefined}
          onClick={() => selectSession(item.session_id)}
          className={cn('w-full rounded-lg px-3 py-3 text-left focus-visible:outline-blue-600 disabled:opacity-60', item.session_id === sessionId ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50')}>
          <span className="block truncate text-sm font-medium">{item.title}</span>
          <span className="mt-1 block text-xs text-gray-500">{formatDate(item.updated_at)}</span>
        </button>)}
      </nav>}
      {sessions.hasNextPage && <Button variant="ghost" size="sm" className="mt-2 w-full justify-center" loading={sessions.isFetchingNextPage} disabled={busy} onClick={() => void sessions.fetchNextPage()}>Load more conversations</Button>}
    </>}
  </>

  return <div className="flex h-full min-h-0 min-w-0 gap-4">
    <aside aria-label="Conversation history" className="hidden w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white lg:flex">
      <h2 className="border-b border-gray-100 px-4 py-4 text-sm font-semibold text-gray-800">Conversations</h2>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{sessionList}</div>
    </aside>
    <Conversation key={`${slug}:${sessionId}`} slug={slug} sessionId={sessionId} session={activeSession}
      onOpenHistory={() => setHistoryOpen(true)} onStart={() => setSearch({ session: sessionId }, { replace: true })} />
    <Modal title="Conversations" open={historyOpen} onClose={() => setHistoryOpen(false)}>
      <div className="max-h-[65dvh] overflow-y-auto">{sessionList}</div>
    </Modal>
  </div>
}

function Conversation({ slug, sessionId, session, onOpenHistory, onStart }: {
  slug: string; sessionId: string; session?: AgentSession; onOpenHistory: () => void; onStart: () => void
}) {
  const qc = useQueryClient()
  const historyKey = ['agent-chat-history', slug, sessionId]
  const [input, setInput] = useState('')
  const [attempt, setAttempt] = useState<{ request_id: string; message: string } | null>(null)
  const [lastReply, setLastReply] = useState<AgentReply | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const supportEnabled = useEntitlementStore(s => s.can(Flag.SUPPORT_TICKETS))
  const send = useMutation({
    mutationKey: ['agent-chat-send', slug],
    mutationFn: (value: { request_id: string; message: string }) => agentChatApi.send(slug, { session_id: sessionId, ...value }),
    retry: false,
    onSuccess: reply => {
      const ids = new Set(reply.messages.map(item => item.id))
      qc.setQueryData<InfiniteData<AgentHistory>>(historyKey, previous => {
        const pages = previous?.pages ?? [{ messages: [], next_before: null }]
        return {
          pageParams: previous?.pageParams ?? [null],
          pages: pages.map((page, index) => ({ ...page, messages: [...page.messages.filter(item => !ids.has(item.id)), ...(index === 0 ? reply.messages : [])].sort((a, b) => a.seq - b.seq) })),
        }
      })
      setLastReply(reply)
      setInput('')
      setAttempt(null)
      void qc.invalidateQueries({ queryKey: ['agent-chat-sessions', slug] })
    },
  })
  const history = useInfiniteQuery({
    queryKey: historyKey,
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) => agentChatApi.history(slug, sessionId, pageParam),
    getNextPageParam: page => page.next_before,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const messages = history.data?.pages.slice().reverse().flatMap(page => page.messages) ?? []
  const lastId = messages[messages.length - 1]?.id
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [lastId, send.isPending])
  useEffect(() => {
    if (send.isSuccess || send.isError) composer.current?.focus()
  }, [send.isSuccess, send.isError])

  function submit() {
    const message = input.trim()
    if (!message || send.isPending || history.isPending || history.isError) return
    const next = attempt?.message === message ? attempt : { request_id: crypto.randomUUID(), message }
    setAttempt(next)
    onStart()
    send.mutate(next)
  }

  const refresh = () => {
    void history.refetch()
    void qc.invalidateQueries({ queryKey: ['agent-chat-sessions', slug] })
  }

  return <section aria-label="Agent conversation" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
    <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
      <button aria-label="Show conversations" disabled={send.isPending} onClick={onOpenHistory} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"><History size={19} /></button>
      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-gray-900">{session?.title || 'New conversation'}</h2><p className="mt-0.5 text-xs text-gray-500">Your business knowledge and AI instructions</p></div>
      <button aria-label="Refresh conversation" title="Refresh conversation" disabled={send.isPending || history.isFetching} onClick={refresh} className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"><RefreshCw size={17} className={history.isFetching ? 'motion-safe:animate-spin' : ''} /></button>
    </header>
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
      {history.isPending ? <ChatLoading history /> : history.isError ? <div role="alert" className="space-y-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <p>{apiError(history.error, 'This conversation could not be loaded.')}</p><button onClick={refresh} className="font-medium underline">Try again</button>
      </div> : <>
        {history.hasNextPage && <div className="mb-5 text-center"><Button variant="ghost" size="sm" loading={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>Load earlier messages</Button></div>}
        {messages.length === 0 && !send.isPending && <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center py-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Bot size={23} /></div>
          <h3 className="text-lg font-semibold text-gray-900">Try your business assistant</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">Ask about information in your knowledge base or check how your assistant follows your instructions.</p>
          <div className="mt-5 space-y-2">
            {['What can you help customers with?', 'Explain our services using the information you have.'].map(prompt => <button key={prompt} className="flex w-full items-start gap-2 rounded-lg border border-gray-200 px-3 py-3 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50/50" onClick={() => { setInput(prompt); composer.current?.focus() }}><MessageSquare size={16} className="mt-0.5 shrink-0 text-blue-600" />{prompt}</button>)}
          </div>
          <details className="mt-5 text-xs leading-relaxed text-gray-500"><summary className="cursor-pointer font-medium text-gray-700">What can I do here?</summary><ul className="mt-2 list-disc space-y-1 pl-4"><li>Ask questions using your business knowledge base.</li><li>Check your AI instructions and continue saved conversations.</li>{supportEnabled && <li>Escalate unanswered questions to a real support ticket.</li>}<li>Text messages only. Appointment booking and order creation are not available in this chat.</li></ul></details>
        </div>}
        <div role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions" className="space-y-5">
          {messages.map(message => <MessageBubble key={message.id} role={message.role} content={message.content}>
            {lastReply?.messages[lastReply.messages.length - 1]?.id === message.id && <>
              {lastReply.support_ticket && <p className="mt-2 text-xs text-gray-500">Support ticket created: <a className="font-medium text-blue-600 underline" href={`/support/${encodeURIComponent(lastReply.support_ticket)}`}>{lastReply.support_ticket}</a></p>}
              {lastReply.knowledge_units.length > 0 && <details className="mt-2 text-xs text-gray-500"><summary className="cursor-pointer">Knowledge used ({lastReply.knowledge_units.length})</summary><ul className="mt-1 space-y-1">{lastReply.knowledge_units.map(unit => <li key={unit.id} className="flex items-start gap-1"><BookOpen size={12} className="mt-0.5 shrink-0" />{unit.title}</li>)}</ul></details>}
            </>}
          </MessageBubble>)}
          {send.isPending && attempt && <><MessageBubble role="user" content={attempt.message} /><InlineLoading label="Preparing a reply…" className="pl-2" /></>}
        </div>
      </>}
    </div>
    <form onSubmit={event => { event.preventDefault(); submit() }} className="shrink-0 space-y-2 border-t border-gray-100 bg-white p-3 sm:px-5 sm:py-4">
      {send.isError && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">{apiError(send.error, 'A reply could not be confirmed.')} Your message is kept below. Send it again to retry, or refresh to check the saved reply.</div>}
      <div className="flex items-end gap-2 rounded-xl border border-gray-300 p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <label htmlFor="agent-message" className="sr-only">Message your assistant</label>
        <textarea ref={composer} id="agent-message" rows={2} maxLength={4000} value={input} disabled={send.isPending}
          onChange={event => { setInput(event.target.value); if (send.isError) send.reset() }}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit() } }}
          placeholder="Ask your business assistant…"
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-60" />
        <Button type="submit" aria-label="Send message" loading={send.isPending} disabled={!input.trim() || history.isPending || history.isError} className="shrink-0 justify-center px-3 py-2.5"><Send size={17} /><span className="hidden sm:inline">Send</span></Button>
      </div>
      <p className="text-[11px] leading-relaxed text-gray-500"><span className="hidden sm:inline">Enter to send · Shift+Enter for a new line. </span>{supportEnabled ? 'This chat can create support tickets. ' : ''}Admin messages do not create customer leads.</p>
    </form>
  </section>
}

function MessageBubble({ role, content, children }: { role: 'user' | 'assistant'; content: string; children?: React.ReactNode }) {
  const fromUser = role === 'user'
  return <div className={cn('flex items-start gap-2 sm:gap-3', fromUser && 'flex-row-reverse')}>
    <div aria-hidden="true" className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', fromUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>{fromUser ? <User size={15} /> : <Bot size={16} />}</div>
    <div className="min-w-0 max-w-[85%] sm:max-w-[80%]"><span className="sr-only">{fromUser ? 'You' : 'Assistant'}: </span><div className={cn('whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] sm:px-4', fromUser ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm bg-gray-100 text-gray-800')}>{content}</div>{children}</div>
  </div>
}

export function ChatTest() {
  const slug = useTenantSlug()
  return slug ? <ChatWorkspace key={slug} slug={slug} /> : null
}
