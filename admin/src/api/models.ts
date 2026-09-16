import apiClient from './client'
import type { ModelInfo } from '@/types/models'

export const modelsApi = {
  list: () => apiClient.get<ModelInfo[]>('/admin/models').then((r) => r.data),
}
