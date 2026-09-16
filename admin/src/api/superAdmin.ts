import axios from 'axios'
import type { BusinessRecord, CreatedBusiness } from '@nivaso/types'
import type { SuperAdminBusiness, FeatureRequest, BusinessRule } from '@/types/featureRequest'
import { useAuthStore } from '@/store/authStore'

// Super-admin calls use a separate key header and bypass the regular apiClient.
// Exported so other super-admin API modules (e.g. aiUsage.ts) reuse this single
// instance instead of creating their own.
export const superAdminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

superAdminClient.interceptors.request.use((config) => {
  const { token, role } = useAuthStore.getState()
  if (token && role === 'super_admin') {
    config.headers['Authorization'] = `Bearer ${token}`
  } else {
    const key = import.meta.env.VITE_SUPER_ADMIN_KEY
    if (key) config.headers['X-Super-Admin-Key'] = key
  }
  return config
})

// ── Response: on 401, clear auth and redirect to super-admin login ───────────
superAdminClient.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trimStart().startsWith('<')) {
      return Promise.reject(new Error('API returned HTML — check VITE_API_BASE_URL.'))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const { token, clearAuth } = useAuthStore.getState()
      if (token) {
        clearAuth()
        window.location.replace('/login?expired=1')
      }
    }
    return Promise.reject(error)
  },
)

// Keep existing admin screens compatible while the API uses the canonical business record.
function adminBusiness(business: BusinessRecord): SuperAdminBusiness {
  return {
    _id: business._id,
    business_id: business._id,
    business_name: business.name,
    business_slug: business.slug,
    business_status: business.status,
    business_timezone: business.timezone,
    business_description: business.description,
    plan: business.plan,
    overrides: {},
    resolved: {},
    granted_by: null,
    created_at: business.created_at,
  }
}

export const superAdminApi = {
  // Businesses + entitlements
  listBusinesses: () =>
    superAdminClient
      .get<BusinessRecord[]>('/super-admin/businesses')
      .then((r) => r.data.map(adminBusiness)),

  getBusiness: (slug: string) =>
    superAdminClient
      .get<BusinessRecord>(`/super-admin/businesses/${slug}`)
      .then((r) => adminBusiness(r.data)),

  suggestBusinessSlug: (name: string) =>
    superAdminClient
      .get<{ slug: string }>('/super-admin/businesses/suggest-slug', { params: { name } })
      .then((r) => r.data.slug),

  createBusiness: (payload: {
    slug: string
    name: string
    timezone?: string
    plan?: string
    description?: string
  }) =>
    superAdminClient.post<CreatedBusiness>('/super-admin/businesses', payload).then((r) => r.data),

  setPlan: (slug: string, plan: string | null) =>
    superAdminClient
      .patch<BusinessRecord>(`/super-admin/businesses/${slug}/plan`, { plan })
      .then((r) => adminBusiness(r.data)),

  setOverrides: (slug: string, overrides: Record<string, unknown>) =>
    superAdminClient
      .patch<SuperAdminBusiness>(`/super-admin/businesses/${slug}/overrides`, { overrides })
      .then((r) => r.data),

  getPlanDefaults: () =>
    superAdminClient
      .get<Record<string, Record<string, unknown>>>('/super-admin/businesses/plans/defaults')
      .then((r) => r.data),

  setStatus: (slug: string, status: string) =>
    superAdminClient
      .patch<BusinessRecord>(`/super-admin/businesses/${slug}/status`, { status })
      .then((r) => adminBusiness(r.data)),

  listPendingBusinesses: () =>
    superAdminClient
      .get<SuperAdminBusiness[]>('/super-admin/businesses/pending')
      .then((r) => r.data),

  approveBusiness: (slug: string) =>
    superAdminClient
      .patch<SuperAdminBusiness>(`/super-admin/businesses/${slug}/approve`)
      .then((r) => r.data),

  rejectBusiness: (slug: string) =>
    superAdminClient
      .patch<{ status: string; slug: string }>(`/super-admin/businesses/${slug}/reject`)
      .then((r) => r.data),

  // Feature requests (modules, integrations, and "plan:<tier>" plan-upgrade requests)
  listRequests: (status?: string) =>
    superAdminClient
      .get<FeatureRequest[]>('/super-admin/feature-requests', { params: status ? { status } : {} })
      .then((r) => r.data),

  reviewRequest: (id: string, payload: { status: 'approved' | 'denied'; notes?: string }) =>
    superAdminClient
      .patch<FeatureRequest>(`/super-admin/feature-requests/${id}`, payload)
      .then((r) => r.data),

  approveAllForBusiness: (slug: string) =>
    superAdminClient
      .patch<FeatureRequest[]>(`/super-admin/feature-requests/business/${slug}/approve-all`)
      .then((r) => r.data),

  // Audit log
  listAuditLog: (limit = 100) =>
    superAdminClient
      .get<
        {
          id: string
          business_id: string
          business_slug: string
          action: string
          details: Record<string, unknown>
          performed_by: string
          created_at: string
        }[]
      >('/super-admin/audit-log', { params: { limit } })
      .then((r) => r.data),

  // Super-admin AI chat (stateless — client manages history)
  chat: (payload: {
    message: string
    history: { role: string; content: string }[]
    model?: string
  }) =>
    superAdminClient
      .post<{ reply: string; tools_used: string[] }>('/super-admin/chat', payload)
      .then((r) => r.data),

  // AI Playbook — business rules
  listRules: () =>
    superAdminClient.get<BusinessRule[]>('/super-admin/playbook').then((r) => r.data),

  createRule: (payload: Omit<BusinessRule, 'id' | 'updated_by' | 'created_at' | 'updated_at'>) =>
    superAdminClient.post<BusinessRule>('/super-admin/playbook', payload).then((r) => r.data),

  updateRule: (id: string, payload: Partial<BusinessRule>) =>
    superAdminClient
      .patch<BusinessRule>(`/super-admin/playbook/${id}`, payload)
      .then((r) => r.data),

  deleteRule: (id: string) => superAdminClient.delete(`/super-admin/playbook/${id}`),

  // Plan definitions
  getPlanHints: () =>
    superAdminClient
      .get<
        Record<
          string,
          {
            type: 'boolean' | 'number' | 'array'
            description: string
            min?: number
            max?: number
            suggestions?: { value: string; label: string; provider?: string }[]
          }
        >
      >('/super-admin/plans/hints')
      .then((r) => r.data),

  updatePlanDefinition: (planName: string, flags: Record<string, unknown>) =>
    superAdminClient
      .patch<{
        plan_name: string
        flags: Record<string, unknown>
        updated_by: string | null
        updated_at: string
      }>(`/super-admin/plans/${planName}`, { flags })
      .then((r) => r.data),
}
