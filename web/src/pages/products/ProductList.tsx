import { useState } from 'react'
import { Package, Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useProducts, useCreateProduct } from '@/hooks/useProducts'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Modal, EmptyState } from '@nivaso/ui'
import { PRODUCT_STATUS_COLORS } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { ProductStatus, CreateProductPayload } from '@/types/product'
import { useEntitlementStore } from '@/store/entitlementStore'
import { flagLimit, Flag } from '@nivaso/types'
import { apiError } from '@/utils/apiError'

const STATUS_TABS: { value: ProductStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR ₹' },
  { value: 'USD', label: 'USD $' },
]

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

interface CreateProductFormValues {
  name: string
  price: string
  currency: string
  sku: string
  category: string
  description: string
  status: ProductStatus
  custom_fields: CustomFieldsValue
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

export function ProductList() {
  const slug = useTenantSlug()
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<ProductStatus | 'all'>('all')
  const [catFilter, setCatFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 25
  const { data: page, isLoading, error: listError, refetch } = useProducts(slug, {
    search, status: statusTab, category: catFilter || undefined, limit, offset,
  })
  const { mutate: create, isPending: creating, error: createError, reset: resetCreate } = useCreateProduct(slug)
  const fields = useFieldDefinitions(slug, 'product')
  const fieldDefinitions = fields.data
  const filtered = page?.items ?? []
  const categories = page?.categories ?? []
  const entitlements = useEntitlementStore((s) => s.entitlements)
  const productLimit = flagLimit(entitlements, Flag.PRODUCTS_LIMIT)
  const atLimit = productLimit !== null && (page?.catalog_total ?? 0) >= productLimit
  const openCreate = () => { resetCreate(); setShowCreate(true) }

  // Create form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    defaultValues: {
      name: '',
      price: '',
      currency: 'INR',
      sku: '',
      category: '',
      description: '',
      status: 'active',
      custom_fields: {},
    },
  })

  const onSubmit = (data: CreateProductFormValues) => {
    if (!fieldDefinitions || fields.isError) return
    const payload: CreateProductPayload = {
      name: data.name.trim(),
      price: data.price,
      currency: data.currency || 'INR',
      status: data.status || 'active',
    }
    if (data.sku?.trim()) payload.sku = data.sku.trim()
    if (data.category?.trim()) payload.category = data.category.trim()
    if (data.description?.trim()) payload.description = data.description.trim()
    // Product's API field is named `attributes`, not `custom_fields` — map it here.
    payload.attributes = data.custom_fields
    create(payload, {
      onSuccess: () => {
        setShowCreate(false)
        setOffset(0)
        reset()
      },
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
              placeholder="Search products…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setOffset(0) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {productLimit !== null && (
              <span className="text-xs text-gray-400">
                {page?.catalog_total ?? 0} / {productLimit}
              </span>
            )}
            <Button size="sm" onClick={openCreate} disabled={atLimit}>
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatusTab(t.value); setOffset(0) }}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                statusTab === t.value
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => { setCatFilter(''); setOffset(0) }}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  !catFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCatFilter(c === catFilter ? '' : c); setOffset(0) }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    catFilter === c
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {listError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {apiError(listError, 'Could not load products.')}{' '}
          <button className="underline" onClick={() => void refetch()}>Retry</button>
        </div>
      ) : filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Package}
          title={search ? 'No results' : 'No products'}
          description={search ? `No products match "${search}"` : 'Add products to your catalog.'}
          action={
            !search && !atLimit ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New Product
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/products/${p.id}`} className="font-medium text-blue-600 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-500">{p.sku ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{p.category ?? '—'}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {formatCurrency(p.price, p.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge colorClass={PRODUCT_STATUS_COLORS[p.status]}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {page && !listError && page.total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>{offset + 1}–{Math.min(offset + limit, page.total)} of {page.total}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
            <Button variant="secondary" disabled={offset + limit >= page.total} onClick={() => setOffset(offset + limit)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Product">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            label="Name *"
            placeholder="Wireless Mouse"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price *"
              placeholder="229.00"
              type="number"
              min="0"
              step="0.01"
              error={errors.price?.message}
              {...register('price', {
                validate: (v) => (v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0) || 'A non-negative price is required',
              })}
            />
            <Select label="Currency" options={CURRENCY_OPTIONS} {...register('currency')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" placeholder="SKU-00123" {...register('sku')} />
            <Input label="Category" placeholder="Electronics" {...register('category')} />
          </div>
          <Textarea label="Description" placeholder="Brief product description…" rows={2} {...register('description')} />
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />

          {fields.isPending && <p role="status" className="text-sm text-gray-500">Loading custom fields…</p>}
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

          {createError && <p role="alert" className="text-sm text-red-600">{apiError(createError, 'Could not create product.')}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating} disabled={!fieldDefinitions || fields.isError}>Create Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
