import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input, Select } from '@nivaso/ui'
import { Flag } from '@nivaso/types'
import { useEntitlementStore } from '@/store/entitlementStore'
import { crmApi } from './api'
import { contactLabel, emptyContact, type Recipient } from './types'
import { ContactFields, ErrorNotice, Pager } from './shared'

export function RecipientFields({ slug, value, onChange }: { slug: string; value: Recipient; onChange: (value: Recipient) => void }) {
  const leadsEnabled = useEntitlementStore(s => s.can(Flag.MODULE_LEADS))
  const kind = value.customer_id !== undefined ? 'customer' : value.lead_id !== undefined ? 'lead' : 'contact'
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const selected = kind === 'customer' ? value.customer_id : value.lead_id
  const query = useQuery({ queryKey: ['recipient-options', slug, kind, search, offset],
    queryFn: () => kind === 'customer' ? crmApi.customers(slug, { search, offset }) : crmApi.leads(slug, { search, offset }),
    enabled: kind === 'customer' || (kind === 'lead' && leadsEnabled) })
  const detail = useQuery({ queryKey: ['recipient-detail', slug, kind, selected],
    queryFn: () => kind === 'customer' ? crmApi.customer(slug, selected!) : crmApi.lead(slug, selected!),
    enabled: !!selected && (kind === 'customer' || (kind === 'lead' && leadsEnabled)) })
  const options = [...(query.data?.items ?? [])]
  if (detail.data && !options.some(x => x.id === detail.data.id)) options.unshift(detail.data)
  return <div className="space-y-3 rounded-lg bg-gray-50 p-4">
    <Select label="Who is this for?" value={kind} options={[{ value: 'contact', label: 'New contact' }, { value: 'customer', label: 'Existing customer' }, ...(leadsEnabled ? [{ value: 'lead', label: 'Existing lead' }] : [])]}
      onChange={e => { setSearch(''); setOffset(0); onChange(e.target.value === 'customer' ? { customer_id: '' } : e.target.value === 'lead' ? { lead_id: '' } : { contact: emptyContact() }) }} />
    {kind !== 'contact' && <>
      <Input label={`Search ${kind}s by phone or social ID`} value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} />
      <ErrorNotice error={query.error || detail.error} retry={() => { void query.refetch(); if (selected) void detail.refetch() }} />
      <Select label={kind === 'lead' ? 'Lead' : 'Customer'} required value={selected ?? ''} options={[{ value: '', label: query.isFetching ? 'Loading…' : `Select ${kind}…` }, ...options.map(item => ({ value: item.id, label: `${contactLabel(item)} · ${item.id.slice(0, 8)}` }))]} onChange={e => onChange(kind === 'customer' ? { customer_id: e.target.value } : { lead_id: e.target.value })} />
      <Pager offset={offset} total={query.data?.total ?? 0} onChange={setOffset} />
    </>}
    {kind === 'contact' && <ContactFields value={value.contact ?? emptyContact()} onChange={contact => onChange({ contact })} />}
    {kind === 'lead' && <details open={!!detail.data && !detail.data.phone && !detail.data.social_identities.length}>
      <summary className="cursor-pointer text-sm text-gray-600">Add contact details for this lead</summary>
      <div className="mt-3"><ContactFields value={value.contact ?? emptyContact()} onChange={contact => onChange({ lead_id: value.lead_id, contact })} /></div>
    </details>}
    <p className="text-xs text-gray-500">Saving creates or reuses a customer. Enquiry history is preserved.</p>
  </div>
}
