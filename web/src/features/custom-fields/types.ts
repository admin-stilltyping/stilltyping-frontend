export type FieldEntityType = 'product' | 'service' | 'offer' | 'coupon'

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldDefinition {
  id: string
  entity_type: string
  key: string
  label: string
  field_type: FieldType
  options: FieldOption[] | null
  required: boolean
  sort_order: number
  archived: boolean
}

/** The dynamic bag of values a `FieldDefinition[]` schema describes. */
export type CustomFieldsValue = Record<string, unknown>

export interface CreateFieldDefinitionPayload {
  key: string
  label: string
  field_type: FieldType
  options?: FieldOption[] | null
  required?: boolean
  sort_order?: number
}

export interface UpdateFieldDefinitionPayload {
  label?: string
  field_type?: FieldType
  options?: FieldOption[] | null
  required?: boolean
  sort_order?: number
}
