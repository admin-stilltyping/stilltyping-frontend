import apiClient from './client'
import type { AgentHistory, AgentReply, AgentSend, AgentSessions } from '@/types/agentChat'

export const agentChatApi = {
  sessions: (slug: string, offset = 0) => apiClient
    .get<AgentSessions>(`/admin/${slug}/chat/sessions`, { params: { offset } }).then(r => r.data),
  history: (slug: string, sessionId: string, before: number | null) => apiClient
    .get<AgentHistory>(`/admin/${slug}/chat/sessions/${sessionId}/messages`, { params: { before } }).then(r => r.data),
  send: (slug: string, payload: AgentSend) => apiClient
    .post<AgentReply>(`/admin/${slug}/chat/messages`, payload).then(r => r.data),
}
