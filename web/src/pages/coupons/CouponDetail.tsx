import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useCoupon, useUpdateCoupon, useDisableCoupon } from '@/hooks/useCoupons'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Spinner, Modal } from '@nivaso/ui'
import { COUPON_STATUS_COLORS } from '@/utils/constants'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { CouponStatus, CouponDiscountType, UpdateCouponPayload } from '@/types/coupon'

interface CouponEditForm {
  code: string
  discount_type: CouponDiscountType
  discount_value: string
  max_uses: string
  min_order_amount: string
  starts_at: string
  ends_at: string
  status: CouponStatus
  custom_fields: CustomFieldsValue
}

const DISCOUNT_TYPE_OPTIONS: { value: CouponDiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
]

const STATUS_OPTIONS: { value: CouponStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
]

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

function formatDiscount(type: CouponDiscountType, value: string) {
  return type === 'percentage' ? `${value}%` : value
}

export function CouponDetail() {
  const { couponId } = useParams<{ couponId: string }>()
  const navigate = useNavigate()
  const slug = useTenantSlug()
  const { data: coupon, isLoading } = useCoupon(slug, couponId ?? '')
  const { mutate: update, isPending: saving } = useUpdateCoupon(slug, couponId ?? '')
  const { mutate: disable, isPending: disabling } = useDisableCoupon(slug)
  const { data: fieldDefinitions } = useFieldDefinitions(slug, 'coupon')

  const [editing, setEditing] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponEditForm>({
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      max_uses: '',
      min_order_amount: '',
      starts_at: '',
      ends_at: '',
      status: 'active',
      custom_fields: {},
    },
  })

  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_uses: coupon.max_uses != null ? String(coupon.max_uses) : '',
        min_order_amount: coupon.min_order_amount ?? '',
        starts_at: toLocalInput(coupon.starts_at),
        ends_at: toLocalInput(coupon.ends_at),
        status: coupon.status,
        custom_fields: coupon.custom_fields ?? {},
      })
    }
  }, [coupon, reset])

  if (isLoading) return <Spinner />
  if (!coupon) return <p className="text-gray-500">Coupon not found.</p>

  const onSubmit = (data: CouponEditForm) => {
    const payload: UpdateCouponPayload = {}
    if (data.code !== coupon.code) payload.code = data.code
    if (data.discount_type !== coupon.discount_type) payload.discount_type = data.discount_type
    if (data.discount_value !== coupon.discount_value) payload.discount_value = data.discount_value
    const maxUses = data.max_uses.trim() ? Number(data.max_uses) : undefined
    if (maxUses !== (coupon.max_uses ?? undefined)) payload.max_uses = maxUses
    if ((data.min_order_amount || '') !== (coupon.min_order_amount || '')) {
      payload.min_order_amount = data.min_order_amount || undefined
    }
    payload.starts_at = fromLocalInput(data.starts_at)
    payload.ends_at = fromLocalInput(data.ends_at)
    if (data.status !== coupon.status) payload.status = data.status
    payload.custom_fields = data.custom_fields
    update(payload, { onSuccess: () => setEditing(false) })
  }

  const handleDisable = () => {
    disable(coupon.id, { onSuccess: () => navigate('/coupons') })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/coupons" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-mono text-xl font-semibold text-gray-900">{coupon.code}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge colorClass={COUPON_STATUS_COLORS[coupon.status]}>{coupon.status}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmDisable(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Discount</p>
            <p className="text-xl font-bold text-gray-900">
              {formatDiscount(coupon.discount_type, coupon.discount_value)}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Usage</p>
            <p className="text-gray-900">
              {coupon.used_count}{coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' (unlimited)'}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Min Order Amount</p>
            <p className="text-gray-900">{coupon.min_order_amount ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Active Window</p>
            <p className="text-gray-900">
              {coupon.starts_at ? new Date(coupon.starts_at).toLocaleString() : '—'}
              {' – '}
              {coupon.ends_at ? new Date(coupon.ends_at).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {Object.keys(coupon.custom_fields).length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-gray-500">Custom Fields</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-xs">
              {Object.entries(coupon.custom_fields).map(([key, value]) => {
                const def = fieldDefinitions?.find((d) => d.key === key)
                return (
                  <div key={key}>
                    <dt className="font-medium text-gray-500">{def?.label ?? key}</dt>
                    <dd className="text-gray-800">{String(value ?? '—')}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Coupon">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input label="Code *" {...register('code', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" options={DISCOUNT_TYPE_OPTIONS} {...register('discount_type')} />
            <Input label="Discount Value" type="number" min="0" step="0.01" {...register('discount_value')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Uses" type="number" min="0" {...register('max_uses')} />
            <Input label="Min Order Amount" type="number" min="0" step="0.01" {...register('min_order_amount')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts At" type="datetime-local" {...register('starts_at')} />
            <Input label="Ends At" type="datetime-local" {...register('ends_at')} />
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
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Disable confirmation */}
      <Modal open={confirmDisable} onClose={() => setConfirmDisable(false)} title="Disable Coupon">
        <p className="mb-4 text-sm text-gray-600">
          Disable <strong>{coupon.code}</strong>? It will no longer be redeemable.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDisable(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDisable} loading={disabling}>Disable</Button>
        </div>
      </Modal>
    </div>
  )
}
