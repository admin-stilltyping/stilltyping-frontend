import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/api/customers'
import type { ListCustomersParams } from '@/types/customer'

export function useCustomers(slug: string, params?: ListCustomersParams) {
  return useQuery({
    queryKey: ['customers', slug, params],
    queryFn: () => customersApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useCustomer(slug: string, customerId: string) {
  return useQuery({
    queryKey: ['customers', slug, customerId],
    queryFn: () => customersApi.get(slug, customerId),
    enabled: !!slug && !!customerId,
  })
}
