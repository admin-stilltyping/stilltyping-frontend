import apiClient from './client'

export interface ModuleCatalogEntry {
  key: string
  category: 'module' | 'integration'
  display_name: string
  description: string | null
  sort_order: number
}

export const listModuleCatalog = () =>
  apiClient.get<ModuleCatalogEntry[]>('/module-catalog').then((r) => r.data)
