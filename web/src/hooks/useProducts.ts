import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import type {
  CreateProductPayload,
  UpdateProductPayload,
  ListProductsParams,
} from '@/types/product'

export function useProducts(slug: string, params?: ListProductsParams) {
  return useQuery({
    queryKey: ['products', slug, params],
    queryFn: () => productsApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useProduct(slug: string, productId: string) {
  return useQuery({
    queryKey: ['products', slug, productId],
    queryFn: () => productsApi.get(slug, productId),
    enabled: !!slug && !!productId,
  })
}

export function useCreateProduct(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productsApi.create(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', slug] }),
  })
}

export function useUpdateProduct(slug: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => productsApi.update(slug, productId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', slug] }),
  })
}

export function useArchiveProduct(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => productsApi.archive(slug, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', slug] }),
  })
}
