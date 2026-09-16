import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ModuleSelection, ModuleSettings } from '@nivaso/types'
import { businessError } from '@/utils/business'
import { businessModulesApi } from './api'

const OPTIONS: { key: keyof ModuleSelection; label: string; description: string }[] = [
  { key: 'product_orders', label: 'Products + Orders', description: 'Enable both modules together. Customers is required.' },
  { key: 'service_appointments', label: 'Services + Appointments', description: 'Enable both modules together. Customers is required.' },
  { key: 'customers', label: 'Customers', description: 'Manage customer records. Can also be enabled independently.' },
  { key: 'leads', label: 'Leads', description: 'Capture enquiries. Convert to a customer when an order or appointment is saved.' },
  { key: 'support_tickets', label: 'Support Tickets', description: 'Enabled by default. Requesters do not need to be customers.' },
]

export function BusinessModulesSettings({ slug }: { slug: string }) {
  const qc = useQueryClient()
  const queryKey = ['super-admin-modules', slug]
  const query = useQuery({ queryKey, queryFn: () => businessModulesApi.get(slug), staleTime: 0 })
  const [draft, setDraft] = useState<ModuleSettings | null>(null)
  const save = useMutation({
    mutationFn: (value: ModuleSettings) => businessModulesApi.save(slug, value.selection, value.revision),
    onSuccess: (value) => { qc.setQueryData(queryKey, value); setDraft(null) },
  })
  const current = draft ?? query.data
  const reload = () => { setDraft(null); save.reset(); void query.refetch() }
  const toggle = (key: keyof ModuleSelection, enabled: boolean) => {
    if (!current) return
    save.reset()
    const selection = { ...current.selection, [key]: enabled }
    if (selection.product_orders || selection.service_appointments) selection.customers = true
    setDraft({ ...current, selection })
  }
  const customerRequired = current?.selection.product_orders || current?.selection.service_appointments

  return (
    <section className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-6" aria-labelledby="business-modules-title">
      <div>
        <h2 id="business-modules-title" className="font-semibold text-white">Modules</h2>
        <p className="mt-1 text-sm text-gray-400">Choose the modules this business can access. Only super-admins can change these settings.</p>
      </div>
      {query.isPending && <p role="status" className="text-sm text-gray-400">Loading module settings…</p>}
      {query.isError && <p role="alert" className="text-sm text-red-400">
        {businessError(query.error, 'Could not load module settings.')}{' '}
        <button className="underline" onClick={reload}>Retry</button>
      </p>}
      {current && !query.isError && <>
        <div className="divide-y divide-gray-800">
          {OPTIONS.map(({ key, label, description }) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 py-4">
              <input type="checkbox" aria-label={label} checked={current.selection[key]}
                disabled={save.isPending || (key === 'customers' && !!customerRequired)}
                onChange={(event) => toggle(key, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-600 accent-violet-500 disabled:opacity-60" />
              <span>
                <span className="block text-sm font-medium text-gray-100">{label}</span>
                <span className="mt-1 block text-xs text-gray-400">{description}</span>
                {key === 'customers' && customerRequired && <span className="mt-1 block text-xs text-violet-300">Required by an enabled pair.</span>}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400">Disabling a module blocks access and keeps its saved data. Changes appear in the portal on refresh or within 15 seconds.</p>
        {save.isError && <p role="alert" className="text-sm text-red-400">
          {businessError(save.error, 'Could not save module settings.')}{' '}
          <button className="underline" onClick={reload}>Reload settings</button>
        </p>}
        {save.isSuccess && !draft && <p role="status" className="text-sm text-green-400">Module settings saved.</p>}
        <div className="flex justify-end gap-3">
          {draft && <button disabled={save.isPending} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 disabled:opacity-50" onClick={() => { setDraft(null); save.reset() }}>Cancel</button>}
          <button disabled={!draft || save.isPending} onClick={() => draft && save.mutate(draft)} className="rounded-lg bg-violet-700 px-4 py-2 text-sm text-white hover:bg-violet-600 disabled:opacity-50">
            {save.isPending ? 'Saving…' : 'Save modules'}
          </button>
        </div>
      </>}
    </section>
  )
}
