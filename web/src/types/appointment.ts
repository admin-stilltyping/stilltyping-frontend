import type { Appointment } from '@/features/crm/types'
export type { Appointment, AppointmentInput as CreateAppointmentPayload, ListParams as ListAppointmentsParams } from '@/features/crm/types'
export type AppointmentStatus = Appointment['status']
export interface UpdateAppointmentPayload { status?: Exclude<AppointmentStatus, 'scheduled'>; scheduled_at?: string; notes?: string | null }
