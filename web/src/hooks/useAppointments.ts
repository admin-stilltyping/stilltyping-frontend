import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/api/appointments'
import type {
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  ListAppointmentsParams,
} from '@/types/appointment'

export function useAppointments(slug: string, params?: ListAppointmentsParams) {
  return useQuery({
    queryKey: ['appointments', slug, params],
    queryFn: () => appointmentsApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useAppointment(slug: string, appointmentId: string) {
  return useQuery({
    queryKey: ['appointments', slug, appointmentId],
    queryFn: () => appointmentsApi.get(slug, appointmentId),
    enabled: !!slug && !!appointmentId,
  })
}

export function useCreateAppointment(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentsApi.create(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', slug] }),
  })
}

export function useUpdateAppointment(slug: string, appointmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAppointmentPayload) =>
      appointmentsApi.update(slug, appointmentId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', slug] }),
  })
}

export function useCancelAppointment(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentsApi.cancel(slug, appointmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', slug] }),
  })
}
