import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supportApi } from '@/api/support'
import type { UpdateTicketPayload, ListTicketsParams } from '@/types/support'

export function useTickets(slug: string, params?: ListTicketsParams) {
  return useQuery({
    queryKey: ['tickets', slug, params],
    queryFn: () => supportApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useTicket(slug: string, reference: string) {
  return useQuery({
    queryKey: ['tickets', slug, reference],
    queryFn: () => supportApi.get(slug, reference),
    enabled: !!slug && !!reference,
  })
}

export function useUpdateTicket(slug: string, reference: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTicketPayload) => supportApi.update(slug, reference, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets', slug] }),
  })
}
