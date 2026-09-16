import { useState, useMemo } from 'react'
import { Ticket, Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useCoupons, useCreateCoupon } from '@/hooks/useCoupons'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Modal, EmptyState } from '@nivaso/ui'
import { COUPON_STATUS_COLORS } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { CouponStatus, CouponDiscountType, CreateCouponPayload } from '@/types/coupon'

const STATUS_TABS: { value: CouponStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
]

const DISCOUNT_TYPE_OPTIONS: { value: CouponDiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
]

const STATUS_OPTIONS: { value: CouponStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
]

interface CreateCouponFormValues {
  code: string
  discount_type: CouponDiscountType
  discount_value: string
  max_uses: string
  min_order_amount: string
  status: CouponStatus
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

function formatDiscount(type: CouponDiscountType, value: string) {
  return type === 'percentage' ? `${value}%` : value
}

export function CouponList() {
  const slug = useTenantSlug()
  const { data: coupons, isLoading } = useCoupons(slug)
  const { mutate: create, isPending: creating } = useCreateCoupon(slug)
  const { data: fieldDefinitions } = useFieldDefinitions(slug, 'coupon')

  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<CouponStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateCouponFormValues>({
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      max_uses: '',
      min_order_amount: '',
      status: 'active',
      custom_fields: {},
    },
  })

  const discountType = watch('discount_type')

  const filtered = useMemo(() => {
    let list = coupons ?? []
    if (statusTab !== 'all') list = list.filter((c) => c.status === statusTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.code.toLowerCase().includes(q))
    }
    return list
  }, [coupons, statusTab, search])

  const onSubmit = (data: CreateCouponFormValues) => {
    const payload: CreateCouponPayload = {
      code: data.code.trim().toUpperCase(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      status: data.status || 'active',
    }
    if (data.max_uses.trim()) payload.max_uses = Number(data.max_uses)
    if (data.min_order_amount.trim()) payload.min_order_amount = data.min_order_amount
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
              placeholder="Search coupon codes…"
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
            New Coupon
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
          icon={Ticket}
          title={search ? 'No results' : 'No coupons'}
          description={search ? `No coupons match "${search}"` : 'Create discount codes for your customers.'}
          action={
            !search ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> New Coupon
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/coupons/${c.id}`} className="font-mono font-medium text-blue-600 hover:underline">
                          {c.code}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {formatDiscount(c.discount_type, c.discount_value)}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ''}
                      </td>
                      <td className="px-5 py-3">
                        <Badge colorClass={COUPON_STATUS_COLORS[c.status]}>{c.status}</Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Coupon">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            label="Code *"
            placeholder="WELCOME10"
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Uses" type="number" min="0" {...register('max_uses')} />
            <Input label="Min Order Amount" type="number" min="0" step="0.01" {...register('min_order_amount')} />
          </div>
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
            <Button type="submit" loading={creating}>Create Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
