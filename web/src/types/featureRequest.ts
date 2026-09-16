export type RequestStatus = 'pending' | 'approved' | 'denied'

export interface FeatureRequest {
  id: string
  business_id: string
  business_slug: string
  feature: string
  reason: string | null
  status: RequestStatus
  reviewed_by: string | null
  notes: string | null
  created_at: string
}

export interface FeatureRequestIn {
  feature: string
  reason?: string
}

export interface BusinessRule {
  id: string
  scope: 'global' | 'plan' | 'business'
  plan: string | null
  business_id: string | null
  trigger: string
  instruction: string
  feature_condition: string | null
  priority: number
  is_active: boolean
  updated_by: string
  created_at: string
  updated_at: string
}

export interface SuperAdminBusiness {
  business_id: string
  business_name: string
  business_slug: string
  business_status: string
  business_timezone: string
  plan: string
  overrides: Record<string, unknown>
  resolved: Record<string, unknown>
  granted_by: string | null
}
