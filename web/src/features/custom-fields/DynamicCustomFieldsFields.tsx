import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Input, Select } from '@nivaso/ui'
import type { FieldDefinition } from './types'

interface DynamicCustomFieldsFieldsProps<T extends FieldValues> {
  definitions: FieldDefinition[]
  register: UseFormRegister<T>
  errors: FieldErrors<T>
}

/**
 * Renders one form control per admin-defined `FieldDefinition`, registered
 * under the dot-path `custom_fields.${key}` so react-hook-form nests every
 * value into a ready-made `{ custom_fields: {...} }` object on submit — no
 * manual merging required in the parent form's `onSubmit`.
 */
export function DynamicCustomFieldsFields<T extends FieldValues>({
  definitions,
  register,
  errors,
}: DynamicCustomFieldsFieldsProps<T>) {
  const sorted = definitions.filter((field) => !field.archived).sort((a, b) => a.sort_order - b.sort_order)

  if (sorted.length === 0) return null

  const customFieldErrors = (errors?.custom_fields ?? {}) as Record<
    string,
    { message?: string } | undefined
  >

  return (
    <div className="space-y-3">
      {sorted.map((definition) => (
        <CustomFieldControl
          key={definition.id}
          definition={definition}
          register={register}
          errorMessage={customFieldErrors?.[definition.key]?.message}
        />
      ))}
    </div>
  )
}

interface CustomFieldControlProps<T extends FieldValues> {
  definition: FieldDefinition
  register: UseFormRegister<T>
  errorMessage?: string
}

function CustomFieldControl<T extends FieldValues>({ definition, register, errorMessage }: CustomFieldControlProps<T>) {
  const name = `custom_fields.${definition.key}` as Path<T>
  const id = `custom-field-${definition.id}`
  const label = `${definition.label}${definition.required ? ' *' : ''}`
  const rules = definition.required ? { required: `${definition.label} is required` } : {}

  switch (definition.field_type) {
    case 'boolean':
      return (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register(name, {
                validate: (value) => !definition.required || typeof value === 'boolean' || `${definition.label} is required`,
              })}
            />
            {label}
          </label>
          {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
        </div>
      )

    case 'number':
      return (
        <Input
          id={id}
          label={label}
          type="number"
          step="any"
          min={-1e15}
          max={1e15}
          error={errorMessage}
          {...register(name, {
            ...rules,
            setValueAs: (value: string | number | null) => value === '' || value === null ? null : Number(value),
            validate: (value) => value === null || (typeof value === 'number' && Number.isFinite(value)) || 'Enter a valid number',
          })}
        />
      )

    case 'date':
      return (
        <Input id={id} label={label} type="date" error={errorMessage} {...register(name, rules)} />
      )

    case 'select':
      return (
        <Select
          id={id}
          label={label}
          defaultValue=""
          options={[{ value: '', label: 'Select…' }, ...(definition.options ?? [])]}
          error={errorMessage}
          {...register(name, rules)}
        />
      )

    case 'multiselect':
      return (
        <Select
          id={id}
          label={label}
          multiple
          options={(definition.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
          error={errorMessage}
          {...register(name, rules)}
        />
      )

    case 'text':
    default:
      return <Input id={id} label={label} maxLength={4000} error={errorMessage} {...register(name, rules)} />
  }
}
