import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useIsMutating, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Button, Input, Modal, Select, Textarea } from '@nivaso/ui'
import { productsApi } from '@/api/products'
import { servicesApi } from '@/api/services'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import type { Product } from '@/types/product'
import { crmApi } from './api'
import { emptyContact, type Recipient } from './types'
import { RecipientFields } from './RecipientFields'
import { card, ErrorNotice, linkClass, Pager, tableClass } from './shared'

function refresh(qc: QueryClient) {
  for (const key of ['customers', 'customer', 'leads', 'lead', 'orders', 'order', 'appointments', 'appointment', 'customer-orders', 'customer-appointments', 'customer-leads', 'recipient-options', 'recipient-detail']) void qc.invalidateQueries({ queryKey: [key] })
}

function useInitialRecipient() {
  const [params] = useSearchParams()
  return params.get('lead_id') ? { lead_id: params.get('lead_id')! } : params.get('customer_id') ? { customer_id: params.get('customer_id')! } : { contact: emptyContact() }
}

function OrderForm({ slug, initial, onDone }: { slug: string; initial: Recipient; onDone: (id: string) => void }) {
  const [requestId] = useState(() => crypto.randomUUID())
  const [recipient, setRecipient] = useState(initial), [search, setSearch] = useState(''), [offset, setOffset] = useState(0)
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>([])
  const query = useQuery({ queryKey: ['order-products', slug, search, offset], queryFn: () => productsApi.list(slug, { search, status: 'active', offset }) })
  const save = useMutation({ mutationKey: ['crm-save', slug], mutationFn: () => crmApi.createOrder(slug, { request_id: requestId, ...recipient, items: items.map(item => ({ product_id: item.product.id, quantity: item.quantity })) }), onSuccess: result => onDone(result.id) })
  return <form onSubmit={e => { e.preventDefault(); save.mutate() }} className="space-y-4"><fieldset className="space-y-4" disabled={save.isPending}>
    <RecipientFields slug={slug} value={recipient} onChange={setRecipient} />
    <section className="space-y-3"><h3 className="font-semibold">Products</h3><Input aria-label="Find products" placeholder="Search products" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} /><ErrorNotice error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <p role="status">Loading products…</p>}
      <div className="max-h-48 overflow-auto rounded border divide-y">{query.data?.items.map(product => <div key={product.id} className="flex items-center justify-between gap-2 p-3 text-sm"><span>{product.name} · {product.currency} {product.price}</span><Button type="button" size="sm" variant="secondary" aria-label={`Add ${product.name}`} onClick={() => setItems(current => current.some(item => item.product.id === product.id) ? current.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(10000, item.quantity + 1) } : item) : [...current, { product, quantity: 1 }])}>Add</Button></div>)}{query.data?.total === 0 && <p className="p-3 text-sm text-gray-500">No active products found.</p>}</div>
      {query.data && <Pager offset={offset} total={query.data.total} onChange={setOffset} />}
      {items.map((item, index) => <div key={item.product.id} className="flex items-end gap-3 rounded border p-3"><div className="flex-1"><p className="text-sm font-medium">{item.product.name}</p><p className="text-xs text-gray-500">{item.product.currency} {item.product.price} each</p></div><div className="w-24"><Input label={`Quantity ${index + 1}`} type="number" required min={1} max={10000} step={1} value={item.quantity} onChange={e => setItems(items.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value) } : row))} /></div><Button type="button" size="sm" variant="secondary" aria-label={`Remove ${item.product.name}`} onClick={() => setItems(items.filter((_, i) => i !== index))}>Remove</Button></div>)}
      <p className="text-xs text-gray-500">Prices and totals are calculated from the saved catalog when you create the order. All products must use one currency.</p>
    </section><ErrorNotice error={save.error} /><Button type="submit" disabled={!items.length} loading={save.isPending}>Create order</Button>
  </fieldset></form>
}

export function OrderList() {
  const slug = useTenantSlug(), navigate = useNavigate(), qc = useQueryClient(), initial = useInitialRecipient()
  const busy = useIsMutating({ mutationKey: ['crm-save', slug] }) > 0
  const [params, setParams] = useSearchParams(), [creating, setCreating] = useState(!!params.get('lead_id') || !!params.get('customer_id'))
  const [status, setStatus] = useState('all'), [offset, setOffset] = useState(0)
  const query = useQuery({ queryKey: ['orders', slug, status, offset], queryFn: () => crmApi.orders(slug, { status, offset }) })
  return <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Orders</h2><Button onClick={() => setCreating(true)}>New order</Button></div>
    <Select aria-label="Order status" value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }} options={['all', 'confirmed', 'fulfilled', 'cancelled'].map(value => ({ value, label: value }))} />
    <ErrorNotice error={query.error} retry={() => void query.refetch()} />{query.isPending && <p role="status">Loading orders…</p>}
    {query.data && <><div className="overflow-auto rounded-xl border bg-white"><table className={tableClass}><thead className="bg-gray-50"><tr><th>Reference</th><th>Items</th><th>Total</th><th>Status</th><th>Created</th></tr></thead><tbody className="divide-y">{query.data.items.map(order => <tr key={order.id}><td><Link className={`${linkClass} font-mono text-xs`} to={`/orders/${order.id}`}>{order.reference}</Link></td><td>{order.items.map(item => `${item.product_name} × ${item.quantity}`).join(', ')}</td><td className="whitespace-nowrap">{order.currency} {order.total}</td><td>{order.status}</td><td>{new Date(order.created_at).toLocaleString()}</td></tr>)}</tbody></table>{!query.data.total && <p className="p-8 text-center text-gray-500">No orders yet.</p>}</div><Pager offset={offset} total={query.data.total} onChange={setOffset} /></>}
    <Modal title="New order" open={creating} onClose={() => { if (!busy) { setCreating(false); setParams({}) } }}>{creating && <OrderForm slug={slug} initial={initial} onDone={id => { refresh(qc); setCreating(false); navigate(`/orders/${id}`) }} />}</Modal>
  </div>
}

export function OrderDetail() {
  const { orderId = '' } = useParams(), slug = useTenantSlug(), qc = useQueryClient()
  const query = useQuery({ queryKey: ['order', slug, orderId], queryFn: () => crmApi.order(slug, orderId) })
  const update = useMutation({ mutationFn: (status: 'fulfilled' | 'cancelled') => crmApi.updateOrder(slug, orderId, status), onSuccess: () => refresh(qc) })
  const order = query.data
  return <div className="max-w-4xl space-y-5"><Link to="/orders" className={linkClass}>← Orders</Link><ErrorNotice error={query.error} retry={() => void query.refetch()} />{query.isPending && <p role="status">Loading order…</p>}
    {order && <section className={card}><h2 className="break-all font-mono text-lg font-semibold">{order.reference}</h2><p className="mt-3">Status: {order.status}</p><p className="mt-2"><Link className={linkClass} to={`/customers/${order.customer_id}`}>View customer</Link></p>
      <div className="mt-5 overflow-auto"><table className={tableClass}><thead className="bg-gray-50"><tr><th>Product</th><th>Unit price</th><th>Quantity</th><th>Total</th></tr></thead><tbody>{order.items.map(item => <tr key={item.product_id}><td>{item.product_name}</td><td>{order.currency} {item.unit_price}</td><td>{item.quantity}</td><td>{order.currency} {item.total}</td></tr>)}</tbody></table></div><p className="mt-4 text-right text-lg font-semibold">Total: {order.currency} {order.total}</p>
      <ErrorNotice error={update.error} />{order.status === 'confirmed' && <div className="mt-5 flex gap-3"><Button disabled={update.isPending} onClick={() => update.mutate('fulfilled')}>Mark fulfilled</Button><Button variant="secondary" disabled={update.isPending} onClick={() => update.mutate('cancelled')}>Cancel order</Button></div>}
    </section>}
  </div>
}

function AppointmentForm({ slug, initial, onDone }: { slug: string; initial: Recipient; onDone: (id: string) => void }) {
  const [requestId] = useState(() => crypto.randomUUID())
  const [recipient, setRecipient] = useState(initial), [search, setSearch] = useState(''), [offset, setOffset] = useState(0), [serviceId, setServiceId] = useState(''), [scheduledAt, setScheduledAt] = useState(''), [notes, setNotes] = useState('')
  const query = useQuery({ queryKey: ['booking-services', slug, search, offset], queryFn: () => servicesApi.list(slug, { search, status: 'active', offset }) })
  const detail = useQuery({ queryKey: ['booking-service', slug, serviceId], queryFn: () => servicesApi.get(slug, serviceId), enabled: !!serviceId })
  const services = [...(query.data?.items ?? [])]
  if (detail.data && !services.some(s => s.id === serviceId)) services.unshift(detail.data)
  const save = useMutation({ mutationKey: ['crm-save', slug], mutationFn: () => crmApi.createAppointment(slug, { request_id: requestId, ...recipient, service_id: serviceId, scheduled_at: new Date(scheduledAt).toISOString(), notes: notes || null }), onSuccess: result => onDone(result.id) })
  return <form onSubmit={e => { e.preventDefault(); save.mutate() }} className="space-y-4"><fieldset className="space-y-4" disabled={save.isPending}>
    <RecipientFields slug={slug} value={recipient} onChange={setRecipient} />
    <Input label="Find services" placeholder="Search services" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} />
    <ErrorNotice error={query.error || detail.error} retry={() => { void query.refetch(); if (serviceId) void detail.refetch() }} />
    <Select label="Service" required value={serviceId} onChange={e => setServiceId(e.target.value)} options={[{ value: '', label: 'Select service…' }, ...services.map(s => ({ value: s.id, label: `${s.name} · ${s.duration_minutes} min · ${s.currency} ${s.price}` }))]} />
    {query.data && <Pager offset={offset} total={query.data.total} onChange={setOffset} />}
    <Input label="Appointment time" type="datetime-local" required value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
    <p className="text-xs text-gray-500">Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone} (this device). Duration and price come from the selected service.</p>
    <Textarea label="Notes" rows={3} maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} />
    <ErrorNotice error={save.error} /><Button type="submit" loading={save.isPending}>Book appointment</Button>
  </fieldset></form>
}

export function AppointmentList() {
  const slug = useTenantSlug(), navigate = useNavigate(), qc = useQueryClient(), initial = useInitialRecipient()
  const busy = useIsMutating({ mutationKey: ['crm-save', slug] }) > 0
  const [params, setParams] = useSearchParams(), [creating, setCreating] = useState(!!params.get('lead_id') || !!params.get('customer_id'))
  const [status, setStatus] = useState('all'), [offset, setOffset] = useState(0)
  const query = useQuery({ queryKey: ['appointments', slug, status, offset], queryFn: () => crmApi.appointments(slug, { status, offset }) })
  return <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Appointments</h2><Button onClick={() => setCreating(true)}>New appointment</Button></div>
    <Select aria-label="Appointment status" value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }} options={['all', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].map(value => ({ value, label: value.replace('_', ' ') }))} />
    <ErrorNotice error={query.error} retry={() => void query.refetch()} />{query.isPending && <p role="status">Loading appointments…</p>}
    {query.data && <><div className="overflow-auto rounded-xl border bg-white"><table className={tableClass}><thead className="bg-gray-50"><tr><th>Service</th><th>Time</th><th>Duration</th><th>Status</th><th>Customer</th></tr></thead><tbody className="divide-y">{query.data.items.map(item => <tr key={item.id}><td><Link className={linkClass} to={`/appointments/${item.id}`}>{item.service_name}</Link></td><td>{new Date(item.scheduled_at).toLocaleString()}</td><td>{item.duration_minutes} min</td><td>{item.status.replace('_', ' ')}</td><td><Link className={linkClass} to={`/customers/${item.customer_id}`}>View customer</Link></td></tr>)}</tbody></table>{!query.data.total && <p className="p-8 text-center text-gray-500">No appointments yet.</p>}</div><Pager offset={offset} total={query.data.total} onChange={setOffset} /></>}
    <Modal title="New appointment" open={creating} onClose={() => { if (!busy) { setCreating(false); setParams({}) } }}>{creating && <AppointmentForm slug={slug} initial={initial} onDone={id => { refresh(qc); setCreating(false); navigate(`/appointments/${id}`) }} />}</Modal>
  </div>
}

function AppointmentEdit({ slug, id, scheduled, notes: initialNotes, onDone }: { slug: string; id: string; scheduled: string; notes: string | null; onDone: () => void }) {
  const localTime = (value: string) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
  const [time, setTime] = useState(localTime(scheduled)), [notes, setNotes] = useState(initialNotes ?? '')
  const save = useMutation({ mutationKey: ['crm-save', slug], mutationFn: () => crmApi.updateAppointment(slug, id, { ...(time !== localTime(scheduled) ? { scheduled_at: new Date(time).toISOString() } : {}), notes: notes || null }), onSuccess: onDone })
  return <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate() }}><fieldset disabled={save.isPending} className="space-y-4"><Input label="Appointment time" type="datetime-local" required value={time} onChange={e => setTime(e.target.value)} /><p className="text-xs text-gray-500">Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p><Textarea label="Notes" maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} /><ErrorNotice error={save.error} /><Button type="submit" loading={save.isPending}>Save appointment</Button></fieldset></form>
}

export function AppointmentDetail() {
  const { appointmentId = '' } = useParams(), slug = useTenantSlug(), qc = useQueryClient(), [editing, setEditing] = useState(false)
  const query = useQuery({ queryKey: ['appointment', slug, appointmentId], queryFn: () => crmApi.appointment(slug, appointmentId) })
  const update = useMutation({ mutationFn: (status: string) => crmApi.updateAppointment(slug, appointmentId, { status }), onSuccess: () => refresh(qc) })
  const busy = useIsMutating({ mutationKey: ['crm-save', slug] }) > 0
  const item = query.data, active = item && ['scheduled', 'confirmed'].includes(item.status)
  return <div className="max-w-3xl space-y-5"><Link to="/appointments" className={linkClass}>← Appointments</Link><ErrorNotice error={query.error} retry={() => void query.refetch()} />{query.isPending && <p role="status">Loading appointment…</p>}
    {item && <section className={card}><h2 className="text-xl font-semibold">{item.service_name}</h2><p className="mt-3">{new Date(item.scheduled_at).toLocaleString()} · {item.duration_minutes} min</p><p className="mt-2">{item.currency} {item.price} · {item.status.replace('_', ' ')}</p><p className="mt-3"><Link className={linkClass} to={`/customers/${item.customer_id}`}>View customer</Link></p>{item.notes && <p className="mt-4 whitespace-pre-wrap break-words text-sm">{item.notes}</p>}
      <ErrorNotice error={update.error} />{active && <div className="mt-5 flex flex-wrap gap-3"><Button variant="secondary" disabled={update.isPending} onClick={() => setEditing(true)}>Edit appointment</Button>{item.status === 'scheduled' && <Button disabled={update.isPending} onClick={() => update.mutate('confirmed')}>Confirm</Button>}<Button disabled={update.isPending} onClick={() => update.mutate('completed')}>Complete</Button><Button variant="secondary" disabled={update.isPending} onClick={() => update.mutate('no_show')}>No show</Button><Button variant="secondary" disabled={update.isPending} onClick={() => update.mutate('cancelled')}>Cancel appointment</Button></div>}
    </section>}
    <Modal title="Edit appointment" open={editing} onClose={() => { if (!busy) setEditing(false) }}>{editing && item && <AppointmentEdit slug={slug} id={item.id} scheduled={item.scheduled_at} notes={item.notes} onDone={() => { setEditing(false); refresh(qc) }} />}</Modal>
  </div>
}
