import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessesApi } from '@/api/businesses'
import type { UpdateBusinessPayload } from '@nivaso/types'

export function useBusinesses(enabled = true) {
  return useQuery({ queryKey: ['businesses'], queryFn: businessesApi.list, enabled })
}

export function useBusiness(slug: string) {
  return useQuery({
    queryKey: ['businesses', slug],
    queryFn: () => businessesApi.get(slug),
    enabled: !!slug,
  })
}

export function useUpdateBusiness(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBusinessPayload) => businessesApi.update(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  })
}
