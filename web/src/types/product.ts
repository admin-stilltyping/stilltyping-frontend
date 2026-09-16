export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'archived'

export interface Product {
  id: string
  business_id: string
  sku: string | null
  name: string
  description: string | null
  price: string
  currency: string
  status: ProductStatus
  category: string | null
  attributes: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProductPage {
  items: Product[]
  total: number
  catalog_total: number
  categories: string[]
}

export interface CreateProductPayload {
  name: string
  price: string
  currency?: string
  description?: string
  sku?: string
  category?: string
  status?: ProductStatus
  attributes?: Record<string, unknown>
}

export interface UpdateProductPayload {
  name?: string
  price?: string
  description?: string
  sku?: string
  category?: string
  status?: ProductStatus
  attributes?: Record<string, unknown>
}

export interface ListProductsParams {
  category?: string
  limit?: number
  offset?: number
  status?: ProductStatus | 'all'
  search?: string
}
