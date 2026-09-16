export type CouponStatus = 'active' | 'expired' | 'disabled'
export type CouponDiscountType = 'percentage' | 'fixed_amount'

export interface Coupon {
  id: string
  code: string
  discount_type: CouponDiscountType
  discount_value: string
  max_uses: number | null
  used_count: number
  min_order_amount: string | null
  starts_at: string | null
  ends_at: string | null
  status: CouponStatus
  custom_fields: Record<string, unknown>
}

export interface CreateCouponPayload {
  code: string
  discount_type: CouponDiscountType
  discount_value: string
  max_uses?: number
  min_order_amount?: string
  starts_at?: string | null
  ends_at?: string | null
  status?: CouponStatus
  custom_fields?: Record<string, unknown>
}

export interface UpdateCouponPayload {
  code?: string
  discount_type?: CouponDiscountType
  discount_value?: string
  max_uses?: number
  min_order_amount?: string
  starts_at?: string | null
  ends_at?: string | null
  status?: CouponStatus
  custom_fields?: Record<string, unknown>
}

export interface ListCouponsParams {
  limit?: number
  offset?: number
}
