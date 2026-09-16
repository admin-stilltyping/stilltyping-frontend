import apiClient from './client'
import type {
  Offer,
  CreateOfferPayload,
  UpdateOfferPayload,
  ListOffersParams,
} from '@/types/offer'

export const offersApi = {
  list: (slug: string, params?: ListOffersParams) =>
    apiClient.get<Offer[]>(`/admin/${slug}/offers`, { params }).then((r) => r.data),

  get: (slug: string, offerId: string) =>
    apiClient.get<Offer>(`/admin/${slug}/offers/${offerId}`).then((r) => r.data),

  create: (slug: string, payload: CreateOfferPayload) =>
    apiClient.post<Offer>(`/admin/${slug}/offers`, payload).then((r) => r.data),

  update: (slug: string, offerId: string, payload: UpdateOfferPayload) =>
    apiClient.patch<Offer>(`/admin/${slug}/offers/${offerId}`, payload).then((r) => r.data),

  archive: (slug: string, offerId: string) =>
    apiClient.delete(`/admin/${slug}/offers/${offerId}`),
}
