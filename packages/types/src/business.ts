export type BusinessStatus = 'active' | 'suspended' | 'inactive'

export interface BusinessRecord {
  _id: string
  slug: string
  name: string
  description: string | null
  timezone: string
  status: BusinessStatus
  plan: 'free' | 'starter' | 'pro' | 'enterprise' | null
  created_at: string
  updated_at: string
}

export interface CreatedBusiness extends BusinessRecord {
  admin_username: string
  admin_password: string
}

export interface BusinessBranding {
  _id: string
  slug: string
  name: string
}

export interface Business {
  id: string
  _id?: string
  slug: string
  name: string
  description: string | null
  timezone: string
  status: BusinessStatus
  settings: Record<string, unknown>
  plan?: BusinessRecord['plan']
  created_at?: string
}

export interface UpdateBusinessPayload {
  name?: string
  description?: string
  timezone?: string
  status?: BusinessStatus
  settings?: Record<string, unknown>
}
