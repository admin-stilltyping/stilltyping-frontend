import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Modal, Select, Textarea } from '@nivaso/ui'
import { Flag } from '@nivaso/types'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useEntitlementStore } from '@/store/entitlementStore'
import { crmApi } from './api'
import { contactLabel, emptyContact } from './types'
import { card, ContactFields, ErrorNotice, linkClass, Pager, tableClass } from './shared'

function EnquiryForm({ slug, leadId, onDone }: { slug: string; leadId?: string; onDone: (id: string) => void }) {
  const [requestId] = useState(() => crypto.randomUUID())
  const [contact, setContact] = useState(emptyContact)
  const [message, setMessage] = useState('')
  const save = useMutation({ mutationKey: ['crm-save', slug], mutationFn: () => crmApi.capture(slug, { request_id: requestId, message, contact, channel: 'manual', lead_id: leadId }), onSuccess: result => onDone(result.id) })
  return <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate() }}>
    <fieldset disabled={save.isPending} className="space-y-4">
      {!leadId && <ContactFields value={contact} onChange={setContact} />}
      <Textarea label="Enquiry" required maxLength={60000} rows={4} value={message} onChange={e => setMessage(e.target.value)} />
      <p className="text-sm text-gray-500">This saves an enquiry. A customer is created only when an order or appointment is saved.</p>
      <ErrorNotice error={save.error} />
      <Button type="submit" loading={save.isPending}>Save enquiry</Button>
    </fieldset>
  </form>
}

export function LeadsPage() {
  const slug = useTenantSlug(), navigate = useNavigate()
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [offset, setOffset] = useState(0), [creating, setCreating] = useState(false)
  const busy = useIsMutating({ mutationKey: ['crm-save', slug] }) > 0
  const query = useQuery({ queryKey: ['leads', slug, search, status, offset], queryFn: () => crmApi.leads(slug, { search, status, offset }) })
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Leads</h2><p className="mt-1 text-sm text-gray-500">Capture enquiries. Conversion happens with the first order or appointment.</p></div>
      <Button onClick={() => setCreating(true)}>New enquiry</Button>
    </div>
    <div className="flex gap-3"><Input placeholder="Search phone or social ID" aria-label="Search leads" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} /><Select aria-label="Lead status" value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }} options={['all', 'enquiry', 'converted'].map(value => ({ value, label: value }))} /></div>
    <ErrorNotice error={query.error} retry={() => void query.refetch()} />
    {query.isPending ? <p role="status">Loading leads…</p> : query.data && <>
      <div className="overflow-x-auto rounded-xl border bg-white"><table className={tableClass}><thead className="bg-gray-50"><tr><th>Contact</th><th>Latest enquiry</th><th>Enquiries</th><th>Status</th></tr></thead><tbody className="divide-y">
        {query.data.items.map(lead => <tr key={lead.id}><td><Link className={linkClass} to={`/leads/${lead.id}`}>{contactLabel(lead)}</Link><p className="mt-1 font-mono text-xs text-gray-400">{lead.id}</p></td><td className="max-w-sm"><p className="line-clamp-2 whitespace-pre-wrap">{lead.latest_message}</p></td><td>{lead.enquiry_count}</td><td>{lead.status}</td></tr>)}
      </tbody></table>{!query.data.total && <p className="p-8 text-center text-gray-500">No enquiries yet.</p>}</div>
      <Pager offset={offset} total={query.data.total} onChange={setOffset} />
    </>}
    <Modal title="New enquiry" open={creating} onClose={() => { if (!busy) setCreating(false) }}>{creating && <EnquiryForm slug={slug} onDone={id => { setCreating(false); navigate(`/leads/${id}`) }} />}</Modal>
  </div>
}

export function LeadDetail() {
  const { leadId = '' } = useParams(), slug = useTenantSlug(), qc = useQueryClient()
  const [offset, setOffset] = useState(0), [adding, setAdding] = useState(false)
  const canOrder = useEntitlementStore(s => s.can(Flag.ORDERS_ENABLED)), canBook = useEntitlementStore(s => s.can(Flag.MODULE_APPOINTMENTS)), canCustomer = useEntitlementStore(s => s.can(Flag.MODULE_CUSTOMERS))
  const query = useQuery({ queryKey: ['lead', slug, leadId], queryFn: () => crmApi.lead(slug, leadId) })
  const history = useQuery({ queryKey: ['enquiries', slug, leadId, offset], queryFn: () => crmApi.enquiries(slug, leadId, { offset }) })
  const busy = useIsMutating({ mutationKey: ['crm-save', slug] }) > 0
  const lead = query.data
  return <div className="max-w-4xl space-y-5">
    <Link to="/leads" className={linkClass}>← Leads</Link>
    <ErrorNotice error={query.error} retry={() => void query.refetch()} />
    {query.isPending && <p role="status">Loading lead…</p>}
    {lead && <div className={card}><h2 className="text-xl font-semibold break-words">{contactLabel(lead)}</h2><p className="mt-2 break-all font-mono text-xs text-gray-500">Lead ID: {lead.id}</p>
      <p className="mt-2 text-sm">Status: {lead.status}</p>
      {lead.customer_id && canCustomer && <Link className={linkClass} to={`/customers/${lead.customer_id}`}>View customer</Link>}
      <div className="mt-4 flex flex-wrap gap-4">{canOrder && <Link className={linkClass} to={`/orders?lead_id=${lead.id}`}>Create order</Link>}{canBook && <Link className={linkClass} to={`/appointments?lead_id=${lead.id}`}>Book appointment</Link>}<Button size="sm" variant="secondary" onClick={() => setAdding(true)}>Add enquiry</Button></div>
    </div>}
    <section className={card}><h3 className="mb-4 font-semibold">Enquiry history</h3><ErrorNotice error={history.error} retry={() => void history.refetch()} />
      {history.isPending && <p role="status">Loading enquiries…</p>}
      {history.data?.items.map(item => <article className="border-t py-4 first:border-0" key={item.id}><p className="mb-2 text-xs text-gray-500">{item.channel} · {new Date(item.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap break-words text-sm">{item.message}</p></article>)}
      {history.data && <Pager offset={offset} total={history.data.total} onChange={setOffset} />}
    </section>
    <Modal title="Add enquiry" open={adding} onClose={() => { if (!busy) setAdding(false) }}>{adding && <EnquiryForm slug={slug} leadId={leadId} onDone={() => { setAdding(false); void qc.invalidateQueries({ queryKey: ['lead', slug, leadId] }); void qc.invalidateQueries({ queryKey: ['enquiries', slug, leadId] }) }} />}</Modal>
  </div>
}
