export type OfferStatus = 'draft' | 'active' | 'expired' | 'archived'
export type OfferDiscountType = 'percentage' | 'fixed_amount'

export interface Offer {
  id: string
  name: string
  description: string | null
  discount_type: OfferDiscountType
  discount_value: string
  applies_to: Record<string, unknown>
  starts_at: string | null
  ends_at: string | null
  status: OfferStatus
  custom_fields: Record<string, unknown>
}

export interface CreateOfferPayload {
  name: string
  discount_type: OfferDiscountType
  discount_value: string
  description?: string
  applies_to?: Record<string, unknown>
  starts_at?: string | null
  ends_at?: string | null
  status?: OfferStatus
  custom_fields?: Record<string, unknown>
}

export interface UpdateOfferPayload {
  name?: string
  discount_type?: OfferDiscountType
  discount_value?: string
  description?: string
  applies_to?: Record<string, unknown>
  starts_at?: string | null
  ends_at?: string | null
  status?: OfferStatus
  custom_fields?: Record<string, unknown>
}

export interface ListOffersParams {
  limit?: number
  offset?: number
}
