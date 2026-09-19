import apiClient from './client'

export interface GeminiIntegration {
  source: 'business' | 'platform' | 'unconfigured'
  key_last_four: string | null
  updated_at: string | null
  can_update: boolean
}

export const geminiApi = {
  get: (slug: string) => apiClient
    .get<GeminiIntegration>(`/admin/${encodeURIComponent(slug)}/integrations/gemini`)
    .then((response) => response.data),
  save: (slug: string, apiKey: string) => apiClient
    .put<GeminiIntegration>(`/admin/${encodeURIComponent(slug)}/integrations/gemini`, { api_key: apiKey })
    .then((response) => response.data),
}
