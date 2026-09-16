export type ServiceStatus = 'active' | 'inactive' | 'archived'

export interface Service {
  id: string
  name: string
  description: string | null
  price: string
  currency: string
  duration_minutes: number | null
  category: string | null
  status: ServiceStatus
  custom_fields: Record<string, unknown>
}

export interface CreateServicePayload {
  name: string
  price: string
  currency?: string
  description?: string
  duration_minutes?: number
  category?: string
  status?: ServiceStatus
  custom_fields?: Record<string, unknown>
}

export interface UpdateServicePayload {
  name?: string
  price?: string
  description?: string
  currency?: string
  duration_minutes?: number
  category?: string
  status?: ServiceStatus
  custom_fields?: Record<string, unknown>
}

export interface ListServicesParams {
  search?: string
  status?: ServiceStatus | 'all'
  limit?: number
  offset?: number
}
