import { crmApi } from '@/features/crm/api'
export const appointmentsApi = { list: crmApi.appointments, get: crmApi.appointment, create: crmApi.createAppointment, update: crmApi.updateAppointment, cancel: (slug: string, id: string) => crmApi.updateAppointment(slug, id, { status: 'cancelled' }) }
