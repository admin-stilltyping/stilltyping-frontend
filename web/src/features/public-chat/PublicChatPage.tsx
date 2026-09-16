import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowUp, MessageCircle, Plus, RefreshCw } from 'lucide-react'
import { publicChatApi, PublicChatError, savedSession, saveSession } from './api'
import type { ChatConfig, ChatTurn, VisitorSession } from './api'
import './public-chat.css'

export function PublicChatPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  return <Chat key={slug} slug={slug} embedded={params.get('embed') === '1'} />
}

function Chat({ slug, embedded }: { slug: string; embedded: boolean }) {
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const [session, setSession] = useState<VisitorSession | null>(() => savedSession(slug))
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [reload, setReload] = useState(0)
  const bottom = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  const hasPending = turns.some((turn) => turn.status === 'pending')
  const blocked = loading || loadFailed || sending || hasPending || expired || !config

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    setError('')
    async function load() {
      try {
        const result = await publicChatApi.config(slug)
        if (cancelled) return
        setConfig(result)
        document.title = `Chat with ${result.name}`
        const stored = savedSession(slug)
        if (stored) {
          const history = await publicChatApi.history(slug, stored.token)
          if (!cancelled) { setSession(stored); setTurns(history.turns) }
        }
      } catch (failure) {
        if (!cancelled) {
          setLoadFailed(true)
          setError(failure instanceof Error ? failure.message : 'Chat could not connect.')
          if (failure instanceof PublicChatError && failure.status === 401) {
            saveSession(slug, null)
            setExpired(true)
          }
        }
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [slug, reload])

  // Recover a reply after a reload, lost response, or another tab's send.
  useEffect(() => {
    if (!hasPending || sending || !session || expired) return
    let cancelled = false
    const timer = window.setInterval(async () => {
      try {
        const result = await publicChatApi.history(slug, session.token)
        if (!cancelled) { setTurns(result.turns); setError('') }
      } catch (failure) {
        if (!cancelled && failure instanceof PublicChatError && failure.status === 401) {
          setExpired(true)
          setError(failure.message)
        }
      }
    }, 3000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [hasPending, sending, session, slug, expired])

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [turns, sending])

  useEffect(() => {
    if (!embedded) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.parent.postMessage({ type: 'nivaso:close' }, '*')
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [embedded])

  function updateTurn(turn: ChatTurn) {
    setTurns((current) => current.some((item) => item.request_id === turn.request_id)
      ? current.map((item) => item.request_id === turn.request_id ? turn : item)
      : [...current, turn])
  }

  async function send(message: string, previousId?: string) {
    if (busy.current || blocked || !message.trim()) return
    busy.current = true
    setSending(true)
    setError('')
    const turn: ChatTurn = { request_id: previousId || crypto.randomUUID(), message: message.trim(), reply: null, status: 'pending' }
    let active = session
    try {
      if (!active) {
        active = await publicChatApi.session(slug)
        saveSession(slug, active)
        if (!mounted.current) return
        setSession(active)
      }
      updateTurn(turn)
      if (!previousId) setDraft('')
      const result = await publicChatApi.send(slug, active.token, turn)
      if (mounted.current) updateTurn(result)
    } catch (failure) {
      if (!mounted.current) return
      setError(failure instanceof Error ? failure.message : 'Chat could not connect. Please try again.')
      if (failure instanceof PublicChatError && failure.status === 401) {
        setExpired(true)
        saveSession(slug, null)
      }
      // Reconcile an uncertain response before offering a retry with the same message ID.
      if (active) {
        try {
          const history = await publicChatApi.history(slug, active.token)
          const stored = history.turns.find((item) => item.request_id === turn.request_id)
          if (mounted.current) {
            updateTurn(stored || { ...turn, status: 'failed' })
            if (stored?.status === 'complete') setError('')
          }
        } catch { if (mounted.current) updateTurn({ ...turn, status: 'failed' }) }
      }
    } finally {
      busy.current = false
      if (mounted.current) { setSending(false); input.current?.focus() }
    }
  }

  function reset() {
    saveSession(slug, null)
    setSession(null); setTurns([]); setDraft(''); setError(''); setExpired(false); setConfirmReset(false); setLoadFailed(false)
    input.current?.focus()
  }

  return (
    <main className={`public-chat ${embedded ? 'public-chat--embedded' : ''}`}>
      <section className="public-chat__window" aria-label="Customer chat">
        <header className="public-chat__header">
          <span className="public-chat__avatar" aria-hidden="true">{config?.name.charAt(0) || 'N'}</span>
          <div className="public-chat__identity"><h1>{config?.name || 'Customer chat'}</h1><p>AI assistant</p></div>
          <button className="public-chat__icon-button" title="Start a new chat" aria-label="Start a new chat" disabled={sending || loading} onClick={() => setConfirmReset(true)}><Plus size={20} /></button>
        </header>
        {confirmReset && <div className="public-chat__reset"><p>Start a new conversation? This chat stays saved with the business.</p><div><button onClick={reset}>Start new chat</button><button onClick={() => setConfirmReset(false)}>Keep this chat</button></div></div>}
        <div className="public-chat__messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text">
          {loading ? <p className="public-chat__notice">Opening your chat…</p> : !config ? <div className="public-chat__welcome"><MessageCircle size={32} /><h2>Chat is unavailable</h2><p>{error}</p><button className="public-chat__retry" onClick={() => setReload((value) => value + 1)}>Try again</button></div> : turns.length === 0 && !expired ? (
            <div className="public-chat__welcome">
              <MessageCircle size={32} strokeWidth={1.5} />
              <h2>Hello. How can we help?</h2>
              <p>Ask a question about {config.name}. Our AI assistant will help you find an answer.</p>
              <div className="public-chat__suggestions">{['How can you help me?', 'How can I contact your team?'].map((message) => <button key={message} disabled={blocked} onClick={() => void send(message)}>{message}</button>)}</div>
            </div>
          ) : null}
          {turns.map((turn) => <div key={turn.request_id} className="public-chat__turn">
            <div className="public-chat__message public-chat__message--visitor"><span className="sr-only">You: </span>{turn.message}</div>
            {turn.reply && <div className="public-chat__message public-chat__message--assistant"><span className="public-chat__byline">AI assistant</span>{turn.reply}</div>}
            {turn.status === 'pending' && <p className="public-chat__thinking">Preparing your reply…</p>}
            {turn.status === 'failed' && <div className="public-chat__failed"><span>Reply unavailable.</span><button disabled={blocked} onClick={() => void send(turn.message, turn.request_id)}><RefreshCw size={13} /> Retry message</button></div>}
          </div>)}
          <div ref={bottom} />
        </div>
        {error && config && <div className="public-chat__error" role="alert">{error}{expired ? <button onClick={reset}>Start new chat</button> : loadFailed && <button onClick={() => setReload((value) => value + 1)}>Try again</button>}</div>}
        <footer className="public-chat__footer">
          <form className="public-chat__composer" onSubmit={(event) => { event.preventDefault(); void send(draft) }}>
            <label className="sr-only" htmlFor="visitor-message">Your message</label>
            <textarea id="visitor-message" ref={input} value={draft} rows={2} maxLength={config?.max_message_length || 4000} disabled={blocked} onChange={(event) => setDraft(event.target.value)} placeholder="Write your message…" onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(draft) }
            }} />
            <button type="submit" disabled={blocked || !draft.trim()} aria-label="Send message"><ArrowUp size={21} /></button>
          </form>
          <p>AI can make mistakes. Chats are saved with the business.</p>
          <span className="public-chat__powered">Powered by <strong>Nivaso</strong></span>
        </footer>
      </section>
    </main>
  )
}
