import apiClient from './client'
import type { BusinessBranding } from '@nivaso/types'
import type { BusinessSession } from '@/components/auth/BusinessSession'

export interface LoginResponse {
  access_token: string
  token_type: string
  business_slug: string
  business_name: string
  username: string
}

export interface SignupPayload {
  slug: string
  business_name: string
  timezone: string
  admin_username: string
  admin_password: string
  requested_modules?: string[]
}

export interface SignupResponse {
  business_slug: string
  business_name: string
  status: string
  requested_modules: string[]
}

export const authApi = {
  me: () => apiClient.get<BusinessSession>('/auth/me').then((r) => r.data),

  branding: (slug: string) =>
    apiClient
      .get<BusinessBranding>(`/web/businesses/${encodeURIComponent(slug)}`)
      .then((r) => r.data),

  login: (username: string, password: string, businessSlug: string) =>
    apiClient
      .post<LoginResponse>('/auth/login', { username, password, business_slug: businessSlug })
      .then((r) => r.data),

  signup: (payload: SignupPayload) =>
    apiClient.post<SignupResponse>('/auth/signup', payload).then((r) => r.data),
}
