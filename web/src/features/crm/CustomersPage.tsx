import { PageSkeleton } from '@/components/ui/LoadingState'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@nivaso/ui'
import { Flag } from '@nivaso/types'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useEntitlementStore } from '@/store/entitlementStore'
import { crmApi } from './api'
import { contactLabel } from './types'
import { card, ErrorNotice, linkClass, Pager, tableClass } from './shared'

export function CustomerList() {
  const slug = useTenantSlug(), [search, setSearch] = useState(''), [offset, setOffset] = useState(0)
  const query = useQuery({ queryKey: ['customers', slug, search, offset], queryFn: () => crmApi.customers(slug, { search, offset }) })
  return <div className="space-y-4"><p className="text-sm text-gray-500">Customers are created after an order or appointment is saved.</p>
    <Input aria-label="Search customers" placeholder="Search phone or social ID" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} />
    <ErrorNotice error={query.error} retry={() => void query.refetch()} />
    {query.isPending ? <PageSkeleton label="Loading customers…" variant="table" /> : query.data && <>
      <div className="overflow-x-auto rounded-xl border bg-white"><table className={tableClass}><thead className="bg-gray-50"><tr><th>Customer ID</th><th>Phone number</th><th>Social identities</th></tr></thead><tbody className="divide-y">
        {query.data.items.map(customer => <tr key={customer.id}><td><Link className={`${linkClass} font-mono text-xs`} to={`/customers/${customer.id}`}>{customer.id}</Link></td><td>{customer.phone ?? '—'}</td><td>{customer.social_identities.map(s => <p key={`${s.platform}:${s.external_id}`} className="break-all">{s.platform}: {s.external_id}</p>)}</td></tr>)}
      </tbody></table>{!query.data.total && <p className="p-8 text-center text-gray-500">No customers yet. Save an order or appointment to create the first customer.</p>}</div>
      <Pager offset={offset} total={query.data.total} onChange={setOffset} />
    </>}
  </div>
}

export function CustomerDetail() {
  const { customerId = '' } = useParams(), slug = useTenantSlug()
  const [orderOffset, setOrderOffset] = useState(0), [appointmentOffset, setAppointmentOffset] = useState(0)
  const canOrder = useEntitlementStore(s => s.can(Flag.ORDERS_ENABLED)), canBook = useEntitlementStore(s => s.can(Flag.MODULE_APPOINTMENTS)), canLead = useEntitlementStore(s => s.can(Flag.MODULE_LEADS))
  const query = useQuery({ queryKey: ['customer', slug, customerId], queryFn: () => crmApi.customer(slug, customerId) })
  const orders = useQuery({ queryKey: ['customer-orders', slug, customerId, orderOffset], queryFn: () => crmApi.orders(slug, { customer_id: customerId, offset: orderOffset }), enabled: canOrder && !!query.data })
  const appointments = useQuery({ queryKey: ['customer-appointments', slug, customerId, appointmentOffset], queryFn: () => crmApi.appointments(slug, { customer_id: customerId, offset: appointmentOffset }), enabled: canBook && !!query.data })
  const leads = useQuery({ queryKey: ['customer-leads', slug, customerId], queryFn: () => crmApi.customerLeads(slug, customerId), enabled: canLead && !!query.data })
  const customer = query.data
  return <div className="max-w-4xl space-y-5"><Link to="/customers" className={linkClass}>← Customers</Link><ErrorNotice error={query.error} retry={() => void query.refetch()} />
    {query.isPending && <PageSkeleton label="Loading customer…" variant="form" />}
    {customer && <>
      <div className={card}><h2 className="text-xl font-semibold">Customer</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-gray-500">Customer ID</dt><dd className="break-all font-mono">{customer.id}</dd></div><div><dt className="text-gray-500">Phone number</dt><dd>{customer.phone ?? '—'}</dd></div><div><dt className="text-gray-500">Social identities</dt><dd>{customer.social_identities.length ? customer.social_identities.map(s => <p className="break-all" key={`${s.platform}:${s.external_id}`}>{s.platform}: {s.external_id}</p>) : '—'}</dd></div></dl></div>
      {canOrder && <section className={card}><div className="flex justify-between"><h3 className="font-semibold">Orders</h3><Link className={linkClass} to={`/orders?customer_id=${customerId}`}>Create order</Link></div><ErrorNotice error={orders.error} retry={() => void orders.refetch()} />{orders.data?.items.map(order => <p className="mt-3 text-sm" key={order.id}><Link className={linkClass} to={`/orders/${order.id}`}>{order.reference}</Link> · {order.status} · {order.currency} {order.total}</p>)}{orders.data && <Pager offset={orderOffset} total={orders.data.total} onChange={setOrderOffset} />}</section>}
      {canBook && <section className={card}><div className="flex justify-between"><h3 className="font-semibold">Appointments</h3><Link className={linkClass} to={`/appointments?customer_id=${customerId}`}>Book appointment</Link></div><ErrorNotice error={appointments.error} retry={() => void appointments.refetch()} />{appointments.data?.items.map(item => <p className="mt-3 text-sm" key={item.id}><Link className={linkClass} to={`/appointments/${item.id}`}>{item.service_name}</Link> · {new Date(item.scheduled_at).toLocaleString()} · {item.status}</p>)}{appointments.data && <Pager offset={appointmentOffset} total={appointments.data.total} onChange={setAppointmentOffset} />}</section>}
      {canLead && <section className={card}><h3 className="font-semibold">Enquiry history</h3><ErrorNotice error={leads.error} retry={() => void leads.refetch()} />{leads.data?.map(lead => <p className="mt-3" key={lead.id}><Link className={linkClass} to={`/leads/${lead.id}`}>{contactLabel(lead)} · {lead.enquiry_count} enquiries</Link></p>)}{leads.data?.length === 0 && <p className="mt-3 text-sm text-gray-500">No linked enquiries.</p>}</section>}
    </>}
  </div>
}
