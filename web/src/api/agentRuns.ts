import apiClient from './client'
import type { AgentRun } from '@/types/agentRun'

export const agentRunsApi = {
  list: (slug: string, params?: { limit?: number; offset?: number; start?: string; end?: string }) =>
    apiClient.get<AgentRun[]>(`/admin/${slug}/agent-runs`, { params }).then((r) => r.data),
}
