import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listFieldDefinitions,
  createFieldDefinition,
  updateFieldDefinition,
  deleteFieldDefinition,
} from './api'
import type {
  FieldEntityType,
  CreateFieldDefinitionPayload,
  UpdateFieldDefinitionPayload,
} from './types'

export function useFieldDefinitions(slug: string, entityType: FieldEntityType, includeArchived = false) {
  return useQuery({
    queryKey: ['custom-fields', slug, entityType, includeArchived],
    queryFn: () => listFieldDefinitions(slug, entityType, includeArchived),
    enabled: !!slug,
  })
}

export function useCreateFieldDefinition(slug: string, entityType: FieldEntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFieldDefinitionPayload) =>
      createFieldDefinition(slug, entityType, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', slug, entityType] }),
  })
}

export function useUpdateFieldDefinition(slug: string, entityType: FieldEntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fieldId, payload }: { fieldId: string; payload: UpdateFieldDefinitionPayload }) =>
      updateFieldDefinition(slug, entityType, fieldId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', slug, entityType] }),
  })
}

export function useDeleteFieldDefinition(slug: string, entityType: FieldEntityType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fieldId: string) => deleteFieldDefinition(slug, entityType, fieldId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', slug, entityType] }),
  })
}
