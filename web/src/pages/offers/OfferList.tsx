import { useState, useMemo } from 'react'
import { Tag, Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useOffers, useCreateOffer } from '@/hooks/useOffers'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Modal, EmptyState } from '@nivaso/ui'
import { OFFER_STATUS_COLORS } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { OfferStatus, OfferDiscountType, CreateOfferPayload } from '@/types/offer'

const STATUS_TABS: { value: OfferStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
]

const DISCOUNT_TYPE_OPTIONS: { value: OfferDiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
]

const STATUS_OPTIONS: { value: OfferStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
]

interface CreateOfferFormValues {
  name: string
  discount_type: OfferDiscountType
  discount_value: string
  description: string
  status: OfferStatus
  custom_fields: CustomFieldsValue
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

function formatDiscount(type: OfferDiscountType, value: string) {
  return type === 'percentage' ? `${value}%` : value
}

export function OfferList() {
  const slug = useTenantSlug()
  const { data: offers, isLoading } = useOffers(slug)
  const { mutate: create, isPending: creating } = useCreateOffer(slug)
  const { data: fieldDefinitions } = useFieldDefinitions(slug, 'offer')

  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<OfferStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateOfferFormValues>({
    defaultValues: {
      name: '',
      discount_type: 'percentage',
      discount_value: '',
      description: '',
      status: 'draft',
      custom_fields: {},
    },
  })

  const discountType = watch('discount_type')

  const filtered = useMemo(() => {
    let list = offers ?? []
    if (statusTab !== 'all') list = list.filter((o) => o.status === statusTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) => o.name.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [offers, statusTab, search])

  const onSubmit = (data: CreateOfferFormValues) => {
    const payload: CreateOfferPayload = {
      name: data.name.trim(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      status: data.status || 'draft',
    }
    if (data.description?.trim()) payload.description = data.description.trim()
    payload.custom_fields = data.custom_fields
    create(payload, {
      onSuccess: () => {
        setShowCreate(false)
        reset()
      },
    })
  }

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offers…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Offer
          </Button>
        </div>

        <div className="flex items-center gap-1 border-b border-gray-200">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusTab(t.value)}
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
        </div>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Tag}
          title={search ? 'No results' : 'No offers'}
          description={search ? `No offers match "${search}"` : 'Create discount campaigns for your catalog.'}
          action={
            !search ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> New Offer
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
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Window</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/offers/${o.id}`} className="font-medium text-blue-600 hover:underline">
                          {o.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {formatDiscount(o.discount_type, o.discount_value)}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {o.starts_at ? new Date(o.starts_at).toLocaleDateString() : '—'}
                        {' – '}
                        {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge colorClass={OFFER_STATUS_COLORS[o.status]}>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Offer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            label="Name *"
            placeholder="Season Sale"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" options={DISCOUNT_TYPE_OPTIONS} {...register('discount_type')} />
            <Input
              label="Discount Value *"
              placeholder={discountType === 'percentage' ? '10' : '100.00'}
              type="number"
              min="0"
              step="0.01"
              error={errors.discount_value?.message}
              {...register('discount_value', {
                validate: (v) => (!!v && !isNaN(parseFloat(v))) || 'Valid discount value is required',
              })}
            />
          </div>
          <Textarea label="Description" rows={2} {...register('description')} />
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />

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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Offer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
