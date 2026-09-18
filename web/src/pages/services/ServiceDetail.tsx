import { PageSkeleton } from '@/components/ui/LoadingState'
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useService, useUpdateService, useArchiveService } from '@/hooks/useServices'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Modal } from '@nivaso/ui'
import { SERVICE_STATUS_COLORS } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatters'
import { ErrorNotice } from '@/features/crm/shared'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { ServiceStatus, UpdateServicePayload } from '@/types/service'

interface ServiceEditForm {
  name: string
  price: string
  duration_minutes: string
  category: string
  description: string
  status: ServiceStatus
  custom_fields: CustomFieldsValue
}

const STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

export function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate = useNavigate()
  const slug = useTenantSlug()
  const { data: service, isLoading, error: loadError, refetch } = useService(slug, serviceId ?? '')
  const { mutate: update, isPending: saving, error: saveError } = useUpdateService(slug, serviceId ?? '')
  const { mutate: archive, isPending: archiving, error: archiveError } = useArchiveService(slug)
  const { data: fieldDefinitions, isPending: fieldsLoading, error: fieldsError, refetch: refetchFields } = useFieldDefinitions(slug, 'service', true)

  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceEditForm>({
    defaultValues: {
      name: '',
      price: '',
      duration_minutes: '30',
      category: '',
      description: '',
      status: 'active',
      custom_fields: {},
    },
  })

  useEffect(() => {
    if (service && !editing) {
      reset({
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes != null ? String(service.duration_minutes) : '',
        category: service.category ?? '',
        description: service.description ?? '',
        status: service.status,
        custom_fields: service.custom_fields ?? {},
      })
    }
  }, [service, reset, editing])

  if (isLoading) return <PageSkeleton label="Loading service…" variant="form" />
  if (loadError) return <ErrorNotice error={loadError} retry={() => void refetch()} />
  if (!service) return <p className="text-gray-500">Service not found.</p>

  const onSubmit = (data: ServiceEditForm) => {
    const payload: UpdateServicePayload = {}
    if (data.name !== service.name) payload.name = data.name
    if (data.price !== service.price) payload.price = data.price
    const durationMinutes = data.duration_minutes.trim() ? Number(data.duration_minutes) : undefined
    if (durationMinutes !== (service.duration_minutes ?? undefined)) payload.duration_minutes = durationMinutes
    if ((data.category || '') !== (service.category || '')) payload.category = data.category
    if ((data.description || '') !== (service.description || '')) payload.description = data.description
    if (data.status !== service.status) payload.status = data.status
    payload.custom_fields = data.custom_fields
    update(payload, { onSuccess: () => setEditing(false) })
  }

  const handleArchive = () => {
    archive(service.id, { onSuccess: () => navigate('/services') })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/services" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
            {service.category && <p className="text-sm text-gray-500">{service.category}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge colorClass={SERVICE_STATUS_COLORS[service.status]}>{service.status}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button aria-label="Archive service" size="sm" variant="danger" onClick={() => setConfirmArchive(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {service.description && (
          <p className="mb-4 text-sm text-gray-600">{service.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Price</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(service.price, service.currency)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Duration</p>
            <p className="text-gray-900">
              {service.duration_minutes != null ? `${service.duration_minutes} min` : '—'}
            </p>
          </div>
        </div>

        {Object.keys(service.custom_fields).length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-gray-500">Custom Fields</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-xs">
              {Object.entries(service.custom_fields).map(([key, value]) => {
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
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Service">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input label="Name *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" min="0" step="0.01" {...register('price')} />
            <Input label="Duration (minutes)" type="number" min="1" max="1440" required {...register('duration_minutes')} />
          </div>
          <Input label="Category" {...register('category')} />
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

          <ErrorNotice error={fieldsError} retry={() => void refetchFields()} />
          <ErrorNotice error={saveError} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={fieldsLoading || !!fieldsError} loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Archive confirmation */}
      <Modal open={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive Service">
        <p className="mb-4 text-sm text-gray-600">
          Archive <strong>{service.name}</strong>? It will no longer be available for new appointments. Existing bookings keep their saved details.
        </p>
        <ErrorNotice error={archiveError} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleArchive} loading={archiving}>Archive</Button>
        </div>
      </Modal>
    </div>
  )
}
