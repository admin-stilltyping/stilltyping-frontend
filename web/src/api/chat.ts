import apiClient from './client'
import type { ChatRequest, ChatResponse, HistoryMessage, SessionOut } from '@/types/chat'

export const chatApi = {
  send: (payload: ChatRequest) =>
    apiClient.post<ChatResponse>('/web/chat', payload).then((r) => r.data),

  history: (params: { user_id: string; business_slug?: string }) =>
    apiClient
      .get<HistoryMessage[]>('/web/history', { params })
      .then((r) => r.data)
      .catch((): HistoryMessage[] => []),

  sessions: (params: { business_slug?: string }) =>
    apiClient
      .get<SessionOut[]>('/web/sessions', { params })
      .then((r) => r.data)
      .catch((): SessionOut[] => []),
}
