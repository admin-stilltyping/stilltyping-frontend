import apiClient from './client'
import type {
  Product,
  ProductPage,
  CreateProductPayload,
  UpdateProductPayload,
  ListProductsParams,
} from '@/types/product'

export const productsApi = {
  list: (slug: string, params?: ListProductsParams) =>
    apiClient.get<ProductPage>(`/admin/${slug}/products`, { params }).then((r) => r.data),

  get: (slug: string, productId: string) =>
    apiClient.get<Product>(`/admin/${slug}/products/${productId}`).then((r) => r.data),

  create: (slug: string, payload: CreateProductPayload) =>
    apiClient.post<Product>(`/admin/${slug}/products`, payload).then((r) => r.data),

  update: (slug: string, productId: string, payload: UpdateProductPayload) =>
    apiClient.patch<Product>(`/admin/${slug}/products/${productId}`, payload).then((r) => r.data),

  archive: (slug: string, productId: string) =>
    apiClient.delete(`/admin/${slug}/products/${productId}`),
}
