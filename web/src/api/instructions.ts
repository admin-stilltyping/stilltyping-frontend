import apiClient from './client'

export interface InstructionsResponse {
  tenant_id: string
  instructions: string
}

// context-agent per-tenant business instructions (the always-on business prompt).
export const instructionsApi = {
  get: (slug: string) =>
    apiClient
      .get<InstructionsResponse>(`/api/v1/tenants/${slug}/instructions`)
      .then((r) => r.data),

  set: (slug: string, instructions: string) =>
    apiClient
      .put<{ tenant_id: string; length: number }>(
        `/api/v1/tenants/${slug}/instructions`,
        { instructions },
      )
      .then((r) => r.data),
}
