import { crmApi } from '@/features/crm/api'
export const ordersApi = { list: crmApi.orders, get: crmApi.order, create: crmApi.createOrder, update: crmApi.updateOrder }
