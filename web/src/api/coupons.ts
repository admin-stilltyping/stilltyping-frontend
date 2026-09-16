import apiClient from './client'
import type {
  Coupon,
  CreateCouponPayload,
  UpdateCouponPayload,
  ListCouponsParams,
} from '@/types/coupon'

export const couponsApi = {
  list: (slug: string, params?: ListCouponsParams) =>
    apiClient.get<Coupon[]>(`/admin/${slug}/coupons`, { params }).then((r) => r.data),

  get: (slug: string, couponId: string) =>
    apiClient.get<Coupon>(`/admin/${slug}/coupons/${couponId}`).then((r) => r.data),

  create: (slug: string, payload: CreateCouponPayload) =>
    apiClient.post<Coupon>(`/admin/${slug}/coupons`, payload).then((r) => r.data),

  update: (slug: string, couponId: string, payload: UpdateCouponPayload) =>
    apiClient.patch<Coupon>(`/admin/${slug}/coupons/${couponId}`, payload).then((r) => r.data),

  disable: (slug: string, couponId: string) =>
    apiClient.delete(`/admin/${slug}/coupons/${couponId}`),
}
