import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useOffer, useUpdateOffer, useArchiveOffer } from '@/hooks/useOffers'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Spinner, Modal } from '@nivaso/ui'
import { OFFER_STATUS_COLORS } from '@/utils/constants'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { OfferStatus, OfferDiscountType, UpdateOfferPayload } from '@/types/offer'

interface OfferEditForm {
  name: string
  discount_type: OfferDiscountType
  discount_value: string
  description: string
  starts_at: string
  ends_at: string
  status: OfferStatus
  custom_fields: CustomFieldsValue
}

const DISCOUNT_TYPE_OPTIONS: { value: OfferDiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
]

const STATUS_OPTIONS: { value: OfferStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
]

/** ISO datetime → value an `<input type="datetime-local">` accepts. */
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

function formatDiscount(type: OfferDiscountType, value: string) {
  return type === 'percentage' ? `${value}%` : value
}

export function OfferDetail() {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const slug = useTenantSlug()
  const { data: offer, isLoading } = useOffer(slug, offerId ?? '')
  const { mutate: update, isPending: saving } = useUpdateOffer(slug, offerId ?? '')
  const { mutate: archive, isPending: archiving } = useArchiveOffer(slug)
  const { data: fieldDefinitions } = useFieldDefinitions(slug, 'offer')

  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfferEditForm>({
    defaultValues: {
      name: '',
      discount_type: 'percentage',
      discount_value: '',
      description: '',
      starts_at: '',
      ends_at: '',
      status: 'draft',
      custom_fields: {},
    },
  })

  useEffect(() => {
    if (offer) {
      reset({
        name: offer.name,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        description: offer.description ?? '',
        starts_at: toLocalInput(offer.starts_at),
        ends_at: toLocalInput(offer.ends_at),
        status: offer.status,
        custom_fields: offer.custom_fields ?? {},
      })
    }
  }, [offer, reset])

  if (isLoading) return <Spinner />
  if (!offer) return <p className="text-gray-500">Offer not found.</p>

  const onSubmit = (data: OfferEditForm) => {
    const payload: UpdateOfferPayload = {}
    if (data.name !== offer.name) payload.name = data.name
    if (data.discount_type !== offer.discount_type) payload.discount_type = data.discount_type
    if (data.discount_value !== offer.discount_value) payload.discount_value = data.discount_value
    if ((data.description || '') !== (offer.description || '')) payload.description = data.description
    payload.starts_at = fromLocalInput(data.starts_at)
    payload.ends_at = fromLocalInput(data.ends_at)
    if (data.status !== offer.status) payload.status = data.status
    payload.custom_fields = data.custom_fields
    update(payload, { onSuccess: () => setEditing(false) })
  }

  const handleArchive = () => {
    archive(offer.id, { onSuccess: () => navigate('/offers') })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/offers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{offer.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge colorClass={OFFER_STATUS_COLORS[offer.status]}>{offer.status}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmArchive(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {offer.description && <p className="mb-4 text-sm text-gray-600">{offer.description}</p>}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Discount</p>
            <p className="text-xl font-bold text-gray-900">
              {formatDiscount(offer.discount_type, offer.discount_value)}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Active Window</p>
            <p className="text-gray-900">
              {offer.starts_at ? new Date(offer.starts_at).toLocaleString() : '—'}
              {' – '}
              {offer.ends_at ? new Date(offer.ends_at).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {Object.keys(offer.custom_fields).length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-gray-500">Custom Fields</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-xs">
              {Object.entries(offer.custom_fields).map(([key, value]) => {
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
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Offer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input label="Name *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" options={DISCOUNT_TYPE_OPTIONS} {...register('discount_type')} />
            <Input label="Discount Value" type="number" min="0" step="0.01" {...register('discount_value')} />
          </div>
          <Textarea label="Description" rows={2} {...register('description')} />
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

      {/* Archive confirmation */}
      <Modal open={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive Offer">
        <p className="mb-4 text-sm text-gray-600">
          Archive <strong>{offer.name}</strong>? It will no longer apply to new orders.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleArchive} loading={archiving}>Archive</Button>
        </div>
      </Modal>
    </div>
  )
}
