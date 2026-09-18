import { PageSkeleton } from '@/components/ui/LoadingState'
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useTicket, useUpdateTicket } from '@/hooks/useSupport'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Select, Textarea } from '@nivaso/ui'
import type { TicketStatus, UpdateTicketPayload } from '@/types/support'
import { ErrorState } from '@/components/ui/ErrorState'

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
]

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
}

function formatDateTime(v: string | null) {
  return v ? new Date(v).toLocaleString() : '—'
}

export function TicketDetail() {
  const { reference } = useParams<{ reference: string }>()
  const slug = useTenantSlug()
  const { data: ticket, isLoading, error, refetch } = useTicket(slug, reference ?? '')
  const { mutate: update, isPending, error: saveError } = useUpdateTicket(slug, reference ?? '')

  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  if (isLoading) return <PageSkeleton label="Loading ticket…" variant="form" />
  if (error) return <ErrorState error={error} title="Unable to load this ticket" onRetry={() => void refetch()} />
  if (!ticket) return <p className="text-gray-500">Ticket not found.</p>

  const handleSave = () => {
    const payload: UpdateTicketPayload = {}
    if (status && status !== ticket.status) payload.status = status
    if (notes.trim()) payload.notes = notes.trim()
    if (!payload.status && !payload.notes) return
    update(payload, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        setStatus('')
        setNotes('')
      },
    })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        to="/support"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Detail card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-gray-500">{ticket.ticket_ref}</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">{ticket.question}</h2>
          </div>
          <Badge colorClass={STATUS_COLORS[ticket.status]}>{ticket.status}</Badge>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Reason</p>
          <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{ticket.reason}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Channel</p>
            <p className="text-gray-900">{ticket.channel ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Customer</p>
            <p className="truncate font-mono text-xs text-gray-900">
              {ticket.external_user_id ?? '—'}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Created</p>
            <p className="text-gray-900">{formatDateTime(ticket.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Resolved</p>
            <p className="text-gray-900">{formatDateTime(ticket.resolved_at)}</p>
          </div>
        </div>

        {ticket.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Notes</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{ticket.notes}</p>
          </div>
        )}
      </div>

      {/* Workflow form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Update Ticket</h3>
        <div className="space-y-4">
          <Select
            label="Status"
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            placeholder={ticket.status}
            options={STATUS_OPTIONS}
          />
          <Textarea
            label="Notes"
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note for staff…"
            rows={3}
          />
          {saveError && <ErrorState error={saveError} title="Changes could not be saved" />}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} loading={isPending}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            {saved && <span className="text-sm font-medium text-green-600">Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
