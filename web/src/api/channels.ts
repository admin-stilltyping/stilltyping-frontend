import apiClient from './client'
import type {
  BusinessChannel,
  TelegramChannelPayload,
  WhatsAppChannelPayload,
  RazorpayChannelPayload,
} from '@/types/channel'

export const channelsApi = {
  list: (slug: string) =>
    apiClient.get<BusinessChannel[]>(`/admin/${slug}/channels`).then((r) => r.data),

  configureTelegram: (slug: string, payload: TelegramChannelPayload) =>
    apiClient
      .put<BusinessChannel>(`/admin/${slug}/channels/telegram`, payload)
      .then((r) => r.data),

  configureWhatsApp: (slug: string, payload: WhatsAppChannelPayload) =>
    apiClient
      .put<BusinessChannel>(`/admin/${slug}/channels/whatsapp`, payload)
      .then((r) => r.data),

  configureRazorpay: (slug: string, payload: RazorpayChannelPayload) =>
    apiClient
      .put<BusinessChannel>(`/admin/${slug}/channels/razorpay`, payload)
      .then((r) => r.data),

  remove: (slug: string, channelType: string) =>
    apiClient.delete(`/admin/${slug}/channels/${channelType}`),
}
