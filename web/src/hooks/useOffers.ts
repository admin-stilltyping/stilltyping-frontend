import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offersApi } from '@/api/offers'
import type {
  CreateOfferPayload,
  UpdateOfferPayload,
  ListOffersParams,
} from '@/types/offer'

export function useOffers(slug: string, params?: ListOffersParams) {
  return useQuery({
    queryKey: ['offers', slug, params],
    queryFn: () => offersApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useOffer(slug: string, offerId: string) {
  return useQuery({
    queryKey: ['offers', slug, offerId],
    queryFn: () => offersApi.get(slug, offerId),
    enabled: !!slug && !!offerId,
  })
}

export function useCreateOffer(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOfferPayload) => offersApi.create(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers', slug] }),
  })
}

export function useUpdateOffer(slug: string, offerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateOfferPayload) => offersApi.update(slug, offerId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers', slug] }),
  })
}

export function useArchiveOffer(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => offersApi.archive(slug, offerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers', slug] }),
  })
}
