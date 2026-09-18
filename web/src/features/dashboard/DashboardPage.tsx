import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, BarChart3, Check, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import { useBusinessSession } from '@/components/auth/BusinessSession'
import { dashboardApi, dashboardError } from './api'
import type { DashboardResponse, Period, UseCase, WidgetType } from './types'
import { WidgetRenderer } from './WidgetRenderer'

const headings: Record<UseCase, string> = {
  clinic: 'Patient & appointment overview',
  retail: 'Store overview',
  services: 'Service overview',
  support: 'Support overview',
}
const control =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50'

function CustomizeDialog({
  data,
  pending,
  error,
  onClose,
  onSave,
}: {
  data: DashboardResponse
  pending: boolean
  error: string | null
  onClose: () => void
  onSave: (ids: WidgetType[]) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<WidgetType[]>(data.config.widget_ids)
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  return (
    <dialog
      ref={dialog}
      aria-labelledby="customize-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      className="m-auto max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/45"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id="customize-title" className="text-xl font-semibold text-slate-900">
            Choose your widgets
          </h2>
          <p className="mt-1 text-sm text-slate-500">Select 10 from the 16 common widget types.</p>
        </div>
        <button
          disabled={pending}
          aria-label="Close widget selection"
          onClick={onClose}
          className="rounded p-1 text-slate-500 focus-visible:outline focus-visible:outline-blue-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {(['summary', 'chart', 'detail'] as const).map((group) => (
        <fieldset key={group} disabled={pending} className="mb-5">
          <legend className="mb-2 text-sm font-medium text-slate-700">
            {group === 'summary'
              ? 'Key numbers'
              : group === 'chart'
                ? 'Charts & comparisons'
                : 'Activity & detail'}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.catalog
              .filter((widget) => widget.group === group)
              .map((widget) => {
                const checked = selected.includes(widget.id)
                return (
                  <label
                    key={widget.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checked ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && selected.length === 10}
                      onChange={() =>
                        setSelected((current) =>
                          checked
                            ? current.filter((id) => id !== widget.id)
                            : [...current, widget.id],
                        )
                      }
                      className="mt-1 accent-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        {widget.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {widget.type_label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {widget.description}
                      </span>
                    </span>
                  </label>
                )
              })}
          </div>
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="sticky -bottom-6 -mx-6 -mb-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
        <span role="status" className="text-sm text-slate-500">
          {selected.length} / 10 selected
        </span>
        <div className="flex gap-2">
          <button disabled={pending} onClick={onClose} className={control}>
            Cancel
          </button>
          <button
            disabled={pending || selected.length !== 10}
            onClick={() => onSave(selected)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save widgets'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export function DashboardPage() {
  const { business } = useBusinessSession()
  const qc = useQueryClient()
  const [days, setDays] = useState<Period>(30)
  const [draftUseCase, setDraftUseCase] = useState<UseCase | null>(null)
  const [customizing, setCustomizing] = useState(false)
  const [notice, setNotice] = useState('')
  const queryKey = ['dashboard', business._id, days]
  const dashboard = useQuery({ queryKey, queryFn: () => dashboardApi.get(days), staleTime: 30_000 })
  const data = dashboard.data
  const mutation = useMutation({
    mutationFn: (
      action: { kind: 'generate'; useCase: UseCase } | { kind: 'save'; ids: WidgetType[] },
    ) => {
      if (!data) throw new Error('Load the dashboard before changing it.')
      return action.kind === 'generate'
        ? dashboardApi.generate(action.useCase, data.config.revision, days)
        : dashboardApi.save(action.ids, data.config.revision, days)
    },
    onMutate: async () => {
      setNotice('')
      await qc.cancelQueries({ queryKey: ['dashboard', business._id] })
    },
    onSuccess: (response, action) => {
      qc.setQueryData(queryKey, response)
      void qc.invalidateQueries({ queryKey: ['dashboard', business._id], refetchType: 'none' })
      setDraftUseCase(null)
      setCustomizing(false)
      setNotice(
        action.kind === 'generate'
          ? 'A new set of 10 demo widgets is saved.'
          : 'Your widget selection is saved.',
      )
    },
  })
  if (dashboard.isPending)
    return (
      <div role="status" aria-label="Loading dashboard" className="mx-auto max-w-7xl space-y-6">
        <span className="sr-only">Loading dashboard…</span>
        <div aria-hidden="true" className="h-20 motion-safe:animate-pulse rounded-lg bg-slate-200/60" />
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true" className="h-64 motion-safe:animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    )
  if (!data)
    return (
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center"
      >
        <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-600" />
        <h1 className="text-lg font-semibold text-slate-900">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">{dashboardError(dashboard.error)}</p>
        <button onClick={() => void dashboard.refetch()} className={`${control} mt-5`}>
          Try again
        </button>
      </div>
    )
  const useCase = draftUseCase ?? data.config.use_case
  const busy = mutation.isPending || dashboard.isFetching
  const error = mutation.isError ? dashboardError(mutation.error) : null
  const asOf = new Date(`${data.config.as_of}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      {customizing && (
        <CustomizeDialog
          data={data}
          pending={mutation.isPending}
          error={error}
          onClose={() => setCustomizing(false)}
          onSave={(ids) => mutation.mutate({ kind: 'save', ids })}
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {headings[data.config.use_case]}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {data.period} days ending {asOf}. A saved selection of 10 widgets.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
          <BarChart3 className="h-4 w-4" />
          Demo dashboard
        </span>
      </div>
      <div
        role="note"
        className="rounded-lg border-l-4 border-amber-400 bg-amber-50/70 px-4 py-3 text-sm text-amber-900"
      >
        <strong className="font-semibold">Sample values only.</strong> These charts illustrate your
        business use case and do not represent actual business activity.
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1.5 text-xs font-medium text-slate-500">
            <span className="block">Business use case</span>
            <select
              aria-label="Business use case"
              disabled={busy}
              value={useCase}
              onChange={(event) => {
                setDraftUseCase(event.target.value as UseCase)
                setNotice('')
                mutation.reset()
              }}
              className={control}
            >
              {Object.entries(data.use_cases).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-slate-500">
            <span className="block">Sample period</span>
            <select
              aria-label="Sample period"
              disabled={busy}
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value) as Period)
                setNotice('')
              }}
              className={control}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => {
              mutation.reset()
              setCustomizing(true)
            }}
            className={`${control} inline-flex items-center gap-2`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Customize
          </button>
          <button
            disabled={busy}
            onClick={() => mutation.mutate({ kind: 'generate', useCase })}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${mutation.isPending ? 'motion-safe:animate-spin' : ''}`}
            />
            {mutation.isPending
              ? 'Saving…'
              : useCase !== data.config.use_case
                ? 'Generate widgets'
                : 'Regenerate'}
          </button>
        </div>
      </div>
      {useCase !== data.config.use_case && (
        <p role="status" className="text-sm text-blue-700">
          Choose “Generate widgets” to apply the new use case.
        </p>
      )}
      {notice && (
        <p role="status" className="flex items-center gap-2 text-sm text-teal-700">
          <Check className="h-4 w-4" />
          {notice}
        </p>
      )}
      {(error || dashboard.isError) && !customizing && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error ?? dashboardError(dashboard.error)}{' '}
          <button
            disabled={busy}
            onClick={() => {
              mutation.reset()
              void dashboard.refetch()
            }}
            className="font-medium underline"
          >
            Reload dashboard
          </button>
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {data.widgets.map((widget) => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Your selection stays the same when you return. Regenerate changes both the widget mix and
        the sample values.
      </p>
    </div>
  )
}
