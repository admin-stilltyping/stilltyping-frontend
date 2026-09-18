import { PageSkeleton } from '@/components/ui/LoadingState'
import { useState } from 'react'
import { Settings2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Badge, Button, Input, Select, Modal, EmptyState } from '@nivaso/ui'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { cn } from '@/utils/cn'
import { apiError } from '@/utils/apiError'
import { Flag, flagEnabled, type FlagKey } from '@nivaso/types'
import { useEntitlementStore } from '@/store/entitlementStore'
import {
  useFieldDefinitions,
  useCreateFieldDefinition,
  useUpdateFieldDefinition,
  useDeleteFieldDefinition,
} from './useFieldDefinitions'
import type { FieldDefinition, FieldEntityType, FieldType } from './types'

const ENTITY_TABS: { value: FieldEntityType; label: string }[] = [
  { value: 'product', label: 'Products' },
  { value: 'service', label: 'Services' },
]

// Managing an entity type's custom fields also requires that entity type's
// own module to be enabled — Custom Fields being on doesn't by itself unlock
// schema management for a module the business hasn't been granted.
const ENTITY_MODULE_FLAG: Record<FieldEntityType, FlagKey> = {
  product: Flag.MODULE_PRODUCTS,
  service: Flag.MODULE_SERVICES,
  offer: Flag.MODULE_OFFERS,
  coupon: Flag.MODULE_COUPONS,
}

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'date', label: 'Date' },
]

const OPTION_TYPES: FieldType[] = ['select', 'multiselect']

interface FieldFormState {
  key: string
  label: string
  field_type: FieldType
  optionsText: string
  required: boolean
  sort_order: string
}

const EMPTY_FORM: FieldFormState = {
  key: '',
  label: '',
  field_type: 'text',
  optionsText: '',
  required: false,
  sort_order: '',
}

/** `"small:Small\nlarge:Large"` → `[{value:'small',label:'Small'}, ...]` */
function parseOptionsText(text: string) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  return lines.map((line) => {
    const [value, label] = line.split(':')
    return { value: (value ?? '').trim(), label: (label ?? value ?? '').trim() }
  })
}

function optionsToText(options: FieldDefinition['options']) {
  if (!options) return ''
  return options.map((o) => `${o.value}:${o.label}`).join('\n')
}

function formToPayload(form: FieldFormState) {
  return {
    key: form.key.trim(),
    label: form.label.trim(),
    field_type: form.field_type,
    options: OPTION_TYPES.includes(form.field_type) ? parseOptionsText(form.optionsText) : null,
    required: form.required,
    sort_order: form.sort_order.trim() ? Number(form.sort_order) : 0,
  }
}

export function CustomFieldsSettingsPage() {
  const slug = useTenantSlug()
  const [selectedEntity, setEntityType] = useState<FieldEntityType>('product')
  const entitlements = useEntitlementStore((s) => s.entitlements)
  const visibleTabs = ENTITY_TABS.filter((tab) => flagEnabled(entitlements, ENTITY_MODULE_FLAG[tab.value]))
  const entityType = visibleTabs.find((tab) => tab.value === selectedEntity)?.value ?? visibleTabs[0]?.value ?? 'product'

  const { data: definitions, isLoading, error: loadError, refetch } = useFieldDefinitions(slug, entityType)
  const { mutate: createDefinition, isPending: creating } = useCreateFieldDefinition(slug, entityType)
  const { mutate: updateDefinition, isPending: updating } = useUpdateFieldDefinition(slug, entityType)
  const { mutate: deleteDefinition, isPending: deleting } = useDeleteFieldDefinition(slug, entityType)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<FieldFormState>(EMPTY_FORM)
  const [addError, setAddError] = useState('')

  const [editing, setEditing] = useState<FieldDefinition | null>(null)
  const [editForm, setEditForm] = useState<FieldFormState>(EMPTY_FORM)
  const [editError, setEditError] = useState('')

  const [confirmDelete, setConfirmDelete] = useState<FieldDefinition | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const sorted = [...(definitions ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  const openAdd = () => {
    setAddForm(EMPTY_FORM)
    setAddError('')
    setShowAdd(true)
  }

  const handleCreate = () => {
    if (!addForm.key.trim() || !addForm.label.trim()) {
      setAddError('Key and label are required')
      return
    }
    setAddError('')
    createDefinition(formToPayload(addForm), {
      onSuccess: () => setShowAdd(false),
      onError: (err) => setAddError(apiError(err, 'Failed to create field. Check the key, type and options.')),
    })
  }

  const openEdit = (def: FieldDefinition) => {
    setEditing(def)
    setEditForm({
      key: def.key,
      label: def.label,
      field_type: def.field_type,
      optionsText: optionsToText(def.options),
      required: def.required,
      sort_order: String(def.sort_order),
    })
    setEditError('')
  }

  const handleUpdate = () => {
    if (!editing) return
    if (!editForm.label.trim()) {
      setEditError('Label is required')
      return
    }
    setEditError('')
    const values = formToPayload(editForm)
    const payload = {
      label: values.label, field_type: values.field_type, options: values.options,
      required: values.required, sort_order: values.sort_order,
    }
    updateDefinition(
      { fieldId: editing.id, payload },
      {
        onSuccess: () => setEditing(null),
        onError: (err) => setEditError(apiError(err, 'Failed to update field.')),
      },
    )
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    setDeleteError('')
    deleteDefinition(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: (err) => setDeleteError(apiError(err, 'Failed to archive field.')),
    })
  }

  const showOptions = (ft: FieldType) => OPTION_TYPES.includes(ft)

  const currentTabLabel = ENTITY_TABS.find((t) => t.value === entityType)?.label ?? entityType

  return (
    <FeatureGate flag={Flag.MODULE_CUSTOM_FIELDS} label="Custom Fields">
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Custom Fields</h1>
        <p className="text-sm text-gray-500">
          Define extra attributes admins can fill in on products and services.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
        {visibleTabs.map((t) => (
          <button
            key={t.value}
            disabled={creating || updating || deleting}
            onClick={() => { setEntityType(t.value); setShowAdd(false); setEditing(null); setConfirmDelete(null) }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              entityType === t.value
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FeatureGate flag={ENTITY_MODULE_FLAG[entityType]} label={`${currentTabLabel} module`}>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Field
        </Button>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-red-600">
          {apiError(loadError, 'Could not load custom fields.')}{' '}
          <button className="underline" onClick={() => void refetch()}>Retry</button>
        </p>
      ) : isLoading ? (
        <PageSkeleton label="Loading custom fields…" variant="table" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="No custom fields"
          description={`No custom fields defined for ${entityType}s yet.`}
          action={
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Field
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Label</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Required</th>
                <th className="px-5 py-3">Sort</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((def) => (
                <tr key={def.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-gray-700">{def.key}</td>
                  <td className="px-5 py-3 text-gray-900">{def.label}</td>
                  <td className="px-5 py-3">
                    <Badge>{def.field_type}</Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{def.required ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3 text-gray-600">{def.sort_order}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" aria-label={`Edit ${def.label}`} onClick={() => openEdit(def)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="danger" aria-label={`Archive ${def.label}`} onClick={() => { setDeleteError(''); setConfirmDelete(def) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </FeatureGate>

      {/* Add field modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Custom Field">
        <div className="space-y-3">
          <Input
            label="Key *"
            value={addForm.key}
            onChange={(e) => setAddForm((f) => ({ ...f, key: e.target.value }))}
            placeholder="warranty_months"
          />
          <p className="text-xs text-gray-500">Start with a lowercase letter; use lowercase letters, numbers and underscores. Keys stay fixed after creation.</p>
          <Input
            label="Label *"
            value={addForm.label}
            onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Warranty (Months)"
          />
          <Select
            label="Field Type"
            value={addForm.field_type}
            onChange={(e) => setAddForm((f) => ({ ...f, field_type: e.target.value as FieldType }))}
            options={FIELD_TYPE_OPTIONS}
          />
          {showOptions(addForm.field_type) && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Options (one per line, `value:label`)
              </label>
              <textarea
                value={addForm.optionsText}
                onChange={(e) => setAddForm((f) => ({ ...f, optionsText: e.target.value }))}
                rows={3}
                placeholder={'small:Small\nlarge:Large'}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={addForm.required}
                onChange={(e) => setAddForm((f) => ({ ...f, required: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Required
            </label>
            <Input
              label="Sort order"
              type="number"
              value={addForm.sort_order}
              onChange={(e) => setAddForm((f) => ({ ...f, sort_order: e.target.value }))}
              placeholder="0"
            />
          </div>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Add Field
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit field modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Custom Field">
        <div className="space-y-3">
          <Input label="Key" value={editForm.key} disabled />
          <Input
            label="Label *"
            value={editForm.label}
            onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
          />
          <Select
            label="Field Type"
            value={editForm.field_type}
            disabled
            options={FIELD_TYPE_OPTIONS}
          />
          <p className="text-xs text-gray-500">Field types stay fixed to preserve saved values. Existing option values must be kept; their labels can be changed.</p>
          {showOptions(editForm.field_type) && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Options (one per line, `value:label`)
              </label>
              <textarea
                value={editForm.optionsText}
                onChange={(e) => setEditForm((f) => ({ ...f, optionsText: e.target.value }))}
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={editForm.required}
                onChange={(e) => setEditForm((f) => ({ ...f, required: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Required
            </label>
            <Input
              label="Sort order"
              type="number"
              value={editForm.sort_order}
              onChange={(e) => setEditForm((f) => ({ ...f, sort_order: e.target.value }))}
            />
          </div>
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={updating}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Archive Custom Field">
        <p className="mb-4 text-sm text-gray-600">
          Archive <strong>{confirmDelete?.label}</strong>? Existing records keep their stored values,
          but the field will no longer appear in forms.
        </p>
        {deleteError && <p role="alert" className="mb-3 text-sm text-red-600">{deleteError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Archive
          </Button>
        </div>
      </Modal>
    </div>
    </FeatureGate>
  )
}
