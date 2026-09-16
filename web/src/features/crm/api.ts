import client from '@/api/client'
import type { Appointment, AppointmentInput, Customer, Enquiry, EnquiryInput, Lead, ListParams, Order, OrderInput, Page } from './types'

const base = (slug: string) => `/admin/${slug}`
export const crmApi = {
  customers: (slug: string, params?: ListParams) => client.get<Page<Customer>>(`${base(slug)}/customers`, { params }).then(r => r.data),
  customer: (slug: string, id: string) => client.get<Customer>(`${base(slug)}/customers/${id}`).then(r => r.data),
  customerLeads: (slug: string, id: string) => client.get<Lead[]>(`${base(slug)}/customers/${id}/leads`).then(r => r.data),
  leads: (slug: string, params?: ListParams) => client.get<Page<Lead>>(`${base(slug)}/leads`, { params }).then(r => r.data),
  lead: (slug: string, id: string) => client.get<Lead>(`${base(slug)}/leads/${id}`).then(r => r.data),
  enquiries: (slug: string, id: string, params?: ListParams) => client.get<Page<Enquiry>>(`${base(slug)}/leads/${id}/enquiries`, { params }).then(r => r.data),
  capture: (slug: string, data: EnquiryInput) => client.post<Lead>(`${base(slug)}/leads/enquiries`, data).then(r => r.data),
  orders: (slug: string, params?: ListParams) => client.get<Page<Order>>(`${base(slug)}/orders`, { params }).then(r => r.data),
  order: (slug: string, id: string) => client.get<Order>(`${base(slug)}/orders/${id}`).then(r => r.data),
  createOrder: (slug: string, data: OrderInput) => client.post<Order>(`${base(slug)}/orders`, data).then(r => r.data),
  updateOrder: (slug: string, id: string, status: 'fulfilled' | 'cancelled') => client.patch<Order>(`${base(slug)}/orders/${id}`, { status }).then(r => r.data),
  appointments: (slug: string, params?: ListParams) => client.get<Page<Appointment>>(`${base(slug)}/appointments`, { params }).then(r => r.data),
  appointment: (slug: string, id: string) => client.get<Appointment>(`${base(slug)}/appointments/${id}`).then(r => r.data),
  createAppointment: (slug: string, data: AppointmentInput) => client.post<Appointment>(`${base(slug)}/appointments`, data).then(r => r.data),
  updateAppointment: (slug: string, id: string, data: { status?: string; notes?: string | null; scheduled_at?: string }) => client.patch<Appointment>(`${base(slug)}/appointments/${id}`, data).then(r => r.data),
}
