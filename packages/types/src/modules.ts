export interface ModuleSelection {
  product_orders: boolean
  service_appointments: boolean
  customers: boolean
  leads: boolean
  support_tickets: boolean
}

export interface ModuleSettings {
  business_id: string
  selection: ModuleSelection
  revision: number
  updated_at: string | null
  updated_by: string | null
}
