import { InlineLoading } from '@/components/ui/LoadingState'
import { PageSkeleton } from '@/components/ui/LoadingState'
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useProduct, useUpdateProduct, useArchiveProduct } from '@/hooks/useProducts'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Modal } from '@nivaso/ui'
import { PRODUCT_STATUS_COLORS } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatters'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { ProductStatus, UpdateProductPayload } from '@/types/product'
import { apiError } from '@/utils/apiError'

interface ProductEditForm {
  name: string
  price: string
  sku: string
  category: string
  description: string
  status: ProductStatus
  custom_fields: CustomFieldsValue
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'archived', label: 'Archived' },
]

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const slug = useTenantSlug()
  const { data: product, isLoading, error: loadError, refetch } = useProduct(slug, productId ?? '')
  const { mutate: update, isPending: saving, error: saveError, reset: resetSave } = useUpdateProduct(slug, productId ?? '')
  const { mutate: archive, isPending: archiving, error: archiveError, reset: resetArchive } = useArchiveProduct(slug)
  const fields = useFieldDefinitions(slug, 'product', true)
  const fieldDefinitions = fields.data

  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductEditForm>({
    defaultValues: {
      name: '',
      price: '',
      sku: '',
      category: '',
      description: '',
      status: 'active',
      custom_fields: {},
    },
  })

  useEffect(() => {
    if (product && !editing) {
      reset({
        name: product.name,
        price: product.price,
        sku: product.sku ?? '',
        category: product.category ?? '',
        description: product.description ?? '',
        status: product.status,
        custom_fields: product.attributes ?? {},
      })
    }
  }, [product, reset, editing])

  if (isLoading) return <PageSkeleton label="Loading product…" variant="form" />
  if (loadError) return <p role="alert" className="text-red-600">
    {apiError(loadError, 'Could not load product.')}{' '}
    <button className="underline" onClick={() => void refetch()}>Retry</button>
  </p>
  if (!product) return <p className="text-gray-500">Product not found.</p>

  const onSubmit = (data: ProductEditForm) => {
    if (!fieldDefinitions || fields.isError) return
    const payload: UpdateProductPayload = {}
    if (data.name !== product.name) payload.name = data.name
    if (data.price !== product.price) payload.price = data.price
    if ((data.sku || '') !== (product.sku || '')) payload.sku = data.sku
    if ((data.category || '') !== (product.category || '')) payload.category = data.category
    if ((data.description || '') !== (product.description || '')) payload.description = data.description
    if (data.status !== product.status) payload.status = data.status
    // Product's API field is named `attributes`, not `custom_fields` — map it here.
    payload.attributes = data.custom_fields
    update(payload, { onSuccess: () => setEditing(false) })
  }

  const handleArchive = () => {
    archive(product.id, { onSuccess: () => navigate('/products') })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
            {product.sku && <p className="font-mono text-sm text-gray-500">SKU: {product.sku}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge colorClass={PRODUCT_STATUS_COLORS[product.status]}>{product.status}</Badge>
            <Button size="sm" variant="secondary" onClick={() => { resetSave(); setEditing(true) }}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" variant="danger" aria-label="Archive product" onClick={() => { resetArchive(); setConfirmArchive(true) }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {product.description && (
          <p className="mb-4 text-sm text-gray-600">{product.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Price</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(product.price, product.currency)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Category</p>
            <p className="text-gray-900">{product.category ?? '—'}</p>
          </div>
        </div>

        {Object.keys(product.attributes).length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-gray-500">Attributes</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-xs">
              {Object.entries(product.attributes).map(([key, value]) => {
                const def = fieldDefinitions?.find((d) => d.key === key)
                return (
                  <div key={key}>
                    <dt className="font-medium text-gray-500">{def?.label ?? key}{def?.archived ? ' (archived)' : ''}</dt>
                    <dd className="text-gray-800">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Product">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input label="Name *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" min="0" step="0.01" error={errors.price?.message} {...register('price', {
              validate: (v) => (v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0) || 'A non-negative price is required',
            })} />
            <Input label="SKU" {...register('sku')} />
          </div>
          <Input label="Category" {...register('category')} />
          <Textarea label="Description" rows={2} {...register('description')} />
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />

          {fields.isPending && <InlineLoading label="Loading custom fields…" />}
          {fields.isError && <p role="alert" className="text-sm text-red-600">
            {apiError(fields.error, 'Could not load custom fields. Try again before saving.')}{' '}
            <button type="button" className="underline" onClick={() => void fields.refetch()}>Retry</button>
          </p>}
          {fieldDefinitions && fieldDefinitions.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 text-sm font-medium text-gray-700">Custom Fields</p>
              <DynamicCustomFieldsFields
                definitions={fieldDefinitions}
                register={register}
                errors={errors}
              />
            </div>
          )}

          {saveError && <p role="alert" className="text-sm text-red-600">{apiError(saveError, 'Could not save product.')}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!fieldDefinitions || fields.isError}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Archive confirmation */}
      <Modal open={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive Product">
        <p className="mb-4 text-sm text-gray-600">
          Archive <strong>{product.name}</strong>? Its details and custom field values will be kept with an archived status.
        </p>
        {archiveError && <p role="alert" className="mb-3 text-sm text-red-600">{apiError(archiveError, 'Could not archive product.')}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleArchive} loading={archiving}>Archive</Button>
        </div>
      </Modal>
    </div>
  )
}
