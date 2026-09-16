export interface Page<T> { items: T[]; total: number }
export type Platform = 'whatsapp' | 'instagram' | 'telegram' | 'facebook'
export interface SocialIdentity { platform: Platform; external_id: string }
export interface Contact { phone: string | null; social_identities: SocialIdentity[] }
export interface Customer extends Contact { id: string; business_id: string; created_at: string }
export interface Lead extends Contact {
  id: string; business_id: string; customer_id: string | null; status: 'enquiry' | 'converted'
  converted_at: string | null; created_at: string; enquiry_count: number
  latest_message: string | null; last_enquiry_at: string | null
}
export interface Enquiry { id: string; message: string; channel: string; created_at: string }
export interface EnquiryInput { request_id: string; message: string; channel: string; contact: Contact; lead_id?: string }
export interface Recipient { customer_id?: string; lead_id?: string; contact?: Contact }
export interface OrderItem { product_id: string; product_name: string; product_sku: string | null; unit_price: string; quantity: number; total: string }
export interface Order {
  id: string; customer_id: string; lead_id: string | null; reference: string
  status: 'confirmed' | 'fulfilled' | 'cancelled'; currency: string; total: string
  items: OrderItem[]; created_at: string
}
export interface OrderInput extends Recipient { request_id: string; items: { product_id: string; quantity: number }[] }
export interface Appointment {
  id: string; customer_id: string; lead_id: string | null; service_id: string; service_name: string
  price: string; currency: string; duration_minutes: number; scheduled_at: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'; notes: string | null
}
export interface AppointmentInput extends Recipient { request_id: string; service_id: string; scheduled_at: string; notes: string | null }
export type ListParams = { search?: string; status?: string; limit?: number; offset?: number; customer_id?: string }
export const emptyContact = (): Contact => ({ phone: null, social_identities: [] })
export const contactLabel = (contact: Contact) => contact.phone || contact.social_identities.map((s) => `${s.platform}: ${s.external_id}`).join(', ') || 'Anonymous enquiry'
