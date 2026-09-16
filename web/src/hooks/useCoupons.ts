import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponsApi } from '@/api/coupons'
import type {
  CreateCouponPayload,
  UpdateCouponPayload,
  ListCouponsParams,
} from '@/types/coupon'

export function useCoupons(slug: string, params?: ListCouponsParams) {
  return useQuery({
    queryKey: ['coupons', slug, params],
    queryFn: () => couponsApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useCoupon(slug: string, couponId: string) {
  return useQuery({
    queryKey: ['coupons', slug, couponId],
    queryFn: () => couponsApi.get(slug, couponId),
    enabled: !!slug && !!couponId,
  })
}

export function useCreateCoupon(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => couponsApi.create(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons', slug] }),
  })
}

export function useUpdateCoupon(slug: string, couponId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCouponPayload) => couponsApi.update(slug, couponId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons', slug] }),
  })
}

export function useDisableCoupon(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (couponId: string) => couponsApi.disable(slug, couponId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons', slug] }),
  })
}
