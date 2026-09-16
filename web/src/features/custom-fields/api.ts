import apiClient from '@/api/client'
import type {
  FieldDefinition,
  FieldEntityType,
  CreateFieldDefinitionPayload,
  UpdateFieldDefinitionPayload,
} from './types'

export function listFieldDefinitions(slug: string, entityType: FieldEntityType, includeArchived = false) {
  return apiClient
    .get<FieldDefinition[]>(`/admin/${slug}/custom-fields/${entityType}`, {
      params: { include_archived: includeArchived },
    })
    .then((r) => r.data)
}

export function createFieldDefinition(
  slug: string,
  entityType: FieldEntityType,
  payload: CreateFieldDefinitionPayload,
) {
  return apiClient
    .post<FieldDefinition>(`/admin/${slug}/custom-fields/${entityType}`, payload)
    .then((r) => r.data)
}

export function updateFieldDefinition(
  slug: string,
  entityType: FieldEntityType,
  fieldId: string,
  payload: UpdateFieldDefinitionPayload,
) {
  return apiClient
    .patch<FieldDefinition>(`/admin/${slug}/custom-fields/${entityType}/${fieldId}`, payload)
    .then((r) => r.data)
}

export function deleteFieldDefinition(slug: string, entityType: FieldEntityType, fieldId: string) {
  return apiClient.delete(`/admin/${slug}/custom-fields/${entityType}/${fieldId}`)
}
