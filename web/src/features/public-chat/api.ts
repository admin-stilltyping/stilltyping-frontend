export interface ChatConfig { name: string; slug: string; max_message_length: number }
export interface ChatTurn {
  request_id: string
  message: string
  reply: string | null
  status: 'pending' | 'complete' | 'failed'
}
export interface VisitorSession { token: string; expires_at: string }

export class PublicChatError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

async function request<T>(slug: string, path: string, token?: string, body?: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/web/businesses/${encodeURIComponent(slug)}${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'omit', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data) throw new PublicChatError(data?.error?.message || 'Chat could not connect. Please try again.', response.status)
  return data as T
}

export const publicChatApi = {
  config: (slug: string) => request<ChatConfig>(slug, '/config'),
  session: (slug: string) => request<VisitorSession>(slug, '/sessions', undefined, {}),
  history: (slug: string, token: string) => request<{ turns: ChatTurn[] }>(slug, '/messages', token),
  send: (slug: string, token: string, turn: Pick<ChatTurn, 'request_id' | 'message'>) =>
    request<ChatTurn>(slug, '/messages', token, { request_id: turn.request_id, message: turn.message }),
}

const memory = new Map<string, VisitorSession>()
const key = (slug: string) => `nivaso-visitor-v1:${slug}`

export function savedSession(slug: string): VisitorSession | null {
  let value = memory.get(slug) || null
  try { value = JSON.parse(localStorage.getItem(key(slug)) || 'null') || value }
  catch { /* Blocked third-party storage: use the in-memory session. */ }
  return value && typeof value.token === 'string' && Date.parse(value.expires_at) > Date.now() ? value : null
}

export function saveSession(slug: string, value: VisitorSession | null) {
  if (value) memory.set(slug, value)
  else memory.delete(slug)
  try {
    if (value) localStorage.setItem(key(slug), JSON.stringify(value))
    else localStorage.removeItem(key(slug))
  } catch { /* Some browsers disable third-party storage. */ }
}
