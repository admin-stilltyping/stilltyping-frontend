import { crmApi } from '@/features/crm/api'
export const customersApi = { list: crmApi.customers, get: crmApi.customer }
