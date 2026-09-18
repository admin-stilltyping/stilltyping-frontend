import { useState } from 'react'
import { Wrench, Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useServices, useCreateService } from '@/hooks/useServices'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Modal, EmptyState } from '@nivaso/ui'
import { SERVICE_STATUS_COLORS } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ErrorNotice, Pager } from '@/features/crm/shared'
import { DynamicCustomFieldsFields } from '@/features/custom-fields/DynamicCustomFieldsFields'
import { useFieldDefinitions } from '@/features/custom-fields/useFieldDefinitions'
import type { CustomFieldsValue } from '@/features/custom-fields/types'
import type { ServiceStatus, CreateServicePayload } from '@/types/service'

const STATUS_TABS: { value: ServiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR ₹' },
  { value: 'USD', label: 'USD $' },
]

const STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

interface CreateServiceFormValues {
  name: string
  price: string
  currency: string
  duration_minutes: string
  category: string
  description: string
  status: ServiceStatus
  custom_fields: CustomFieldsValue
}

function SkeletonRow() {
  return (
    <tr aria-hidden="true" className="motion-safe:animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

export function ServiceList() {
  const slug = useTenantSlug()
  const { mutate: create, isPending: creating, error: createError } = useCreateService(slug)
  const { data: fieldDefinitions, isPending: fieldsLoading, error: fieldsError, refetch: refetchFields } = useFieldDefinitions(slug, 'service')

  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<ServiceStatus | 'all'>('all')
  const [offset, setOffset] = useState(0)
  const { data: page, isLoading, error: listError, refetch } = useServices(slug, { search, status: statusTab, offset })
  const filtered = page?.items ?? []
  const [showCreate, setShowCreate] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceFormValues>({
    defaultValues: {
      name: '',
      price: '',
      currency: 'INR',
      duration_minutes: '30',
      category: '',
      description: '',
      status: 'active',
      custom_fields: {},
    },
  })

  const onSubmit = (data: CreateServiceFormValues) => {
    const payload: CreateServicePayload = {
      name: data.name.trim(),
      price: data.price,
      currency: data.currency || 'INR',
      status: data.status || 'active',
    }
    if (data.duration_minutes.trim()) payload.duration_minutes = Number(data.duration_minutes)
    if (data.category?.trim()) payload.category = data.category.trim()
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
              onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
              placeholder="Search services…"
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
            New Service
          </Button>
        </div>

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


        </div>
      </div>

      <ErrorNotice error={listError} retry={() => void refetch()} />
      {filtered.length === 0 && !isLoading && !listError ? (
        <EmptyState
          icon={Wrench}
          title={search ? 'No results' : 'No services'}
          description={search ? `No services match "${search}"` : 'Add services to your catalog.'}
          action={
            !search ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> New Service
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table aria-busy={isLoading} aria-label="Services" className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/services/${s.id}`} className="font-medium text-blue-600 hover:underline">
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{s.category ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {s.duration_minutes != null ? `${s.duration_minutes} min` : '—'}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {formatCurrency(s.price, s.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge colorClass={SERVICE_STATUS_COLORS[s.status]}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {page && <Pager offset={offset} total={page.total} onChange={setOffset} />}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Service">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            label="Name *"
            placeholder="Haircut & Styling"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price *"
              placeholder="499.00"
              type="number"
              min="0"
              step="0.01"
              error={errors.price?.message}
              {...register('price', {
                validate: (v) => (!!v && !isNaN(parseFloat(v))) || 'Valid price is required',
              })}
            />
            <Select label="Currency" options={CURRENCY_OPTIONS} {...register('currency')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (minutes)" type="number" min="1" max="1440" required {...register('duration_minutes')} />
            <Input label="Category" placeholder="Salon" {...register('category')} />
          </div>
          <Textarea label="Description" placeholder="Brief service description…" rows={2} {...register('description')} />
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
          <ErrorNotice error={createError} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={fieldsLoading || !!fieldsError} loading={creating}>Create Service</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
