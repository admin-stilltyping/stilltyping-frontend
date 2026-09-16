import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/api/services'
import type {
  CreateServicePayload,
  UpdateServicePayload,
  ListServicesParams,
} from '@/types/service'

export function useServices(slug: string, params?: ListServicesParams) {
  return useQuery({
    queryKey: ['services', slug, params],
    queryFn: () => servicesApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useService(slug: string, serviceId: string) {
  return useQuery({
    queryKey: ['services', slug, serviceId],
    queryFn: () => servicesApi.get(slug, serviceId),
    enabled: !!slug && !!serviceId,
  })
}

export function useCreateService(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateServicePayload) => servicesApi.create(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', slug] }),
  })
}

export function useUpdateService(slug: string, serviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateServicePayload) => servicesApi.update(slug, serviceId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', slug] }),
  })
}

export function useArchiveService(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (serviceId: string) => servicesApi.archive(slug, serviceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', slug] }),
  })
}
