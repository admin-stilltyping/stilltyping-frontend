import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, BookOpen, Globe, LayoutList, Building2, CheckCircle, XCircle } from 'lucide-react'
import { superAdminApi } from '@/api/superAdmin'
import type { BusinessRule } from '@/types/featureRequest'
import { cn } from '@/utils/cn'

const SCOPE_COLORS = {
  global:   'bg-violet-900 text-violet-300',
  plan:     'bg-blue-900 text-blue-300',
  business: 'bg-amber-900 text-amber-300',
}

const SCOPE_ICONS = {
  global:   Globe,
  plan:     LayoutList,
  business: Building2,
}

const PLANS = ['free', 'starter', 'pro', 'enterprise']

// ── Rule form ─────────────────────────────────────────────────────────────────

interface RuleFormProps {
  initial?: Partial<BusinessRule>
  onSave: (data: Partial<BusinessRule>) => void
  onCancel: () => void
  saving: boolean
}

function RuleForm({ initial, onSave, onCancel, saving }: RuleFormProps) {
  const [scope, setScope] = useState<string>(initial?.scope ?? 'global')
  const [plan, setPlan] = useState<string>(initial?.plan ?? '')
  const [businessId, setBusinessId] = useState<string>(initial?.business_id ?? '')
  const [trigger, setTrigger] = useState(initial?.trigger ?? '')
  const [instruction, setInstruction] = useState(initial?.instruction ?? '')
  const [condition, setCondition] = useState(initial?.feature_condition ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? 50)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      scope: scope as BusinessRule['scope'],
      plan: scope === 'plan' ? plan || null : null,
      business_id: scope === 'business' ? businessId || null : null,
      trigger: trigger.trim(),
      instruction: instruction.trim(),
      feature_condition: condition.trim() || null,
      priority,
      is_active: isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-700 bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-white">{initial?.id ? 'Edit Rule' : 'New Rule'}</h3>

      {/* Scope */}
      <div className="grid grid-cols-3 gap-2">
        {(['global', 'plan', 'business'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={cn(
              'rounded-lg py-1.5 text-xs font-medium capitalize transition-colors border',
              scope === s
                ? 'border-violet-500 bg-violet-900 text-violet-200'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {scope === 'plan' && (
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
        >
          <option value="">Select plan…</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}

      {scope === 'business' && (
        <input
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          placeholder="Business UUID"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-violet-500 focus:outline-none"
        />
      )}

      {/* Trigger */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Trigger label</label>
        <input
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="e.g. orders_disabled, ticket_cancel_requested"
          required
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-violet-500 focus:outline-none"
        />
        <p className="mt-0.5 text-[10px] text-gray-600">Used for deduplication. Business rule overrides plan rule with same trigger.</p>
      </div>

      {/* Instruction */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Instruction (injected into system prompt)</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={4}
          required
          placeholder="When the customer asks to cancel a ticket, use update_support_ticket to note 'Customer requested cancellation'…"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none"
        />
      </div>

      {/* Feature condition */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Feature condition (optional)</label>
        <input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="orders.enabled=false  or  channel.payments=false"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:border-violet-500 focus:outline-none"
        />
        <p className="mt-0.5 text-[10px] text-gray-600">Auto-activates this rule only when the condition matches the business's entitlements.</p>
      </div>

      {/* Priority + active */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-400">Priority (lower = first)</label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            min={1}
            max={999}
            className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-600 text-violet-600 focus:ring-violet-500"
          />
          Active
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Rule'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:border-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SuperAdminPlaybook() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BusinessRule | null>(null)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['super-admin-playbook'],
    queryFn: superAdminApi.listRules,
    staleTime: 15_000,
  })

  const { mutate: createRule, isPending: creating_ } = useMutation({
    mutationFn: (d: Partial<BusinessRule>) => superAdminApi.createRule(d as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-admin-playbook'] }); setCreating(false) },
  })

  const { mutate: updateRule, isPending: updating } = useMutation({
    mutationFn: ({ id, ...d }: Partial<BusinessRule> & { id: string }) =>
      superAdminApi.updateRule(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-admin-playbook'] }); setEditing(null) },
  })

  const { mutate: deleteRule } = useMutation({
    mutationFn: (id: string) => superAdminApi.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin-playbook'] }),
  })

  const { mutate: toggleRule } = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      superAdminApi.updateRule(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin-playbook'] }),
  })

  const grouped = {
    global:   rules.filter((r) => r.scope === 'global'),
    plan:     rules.filter((r) => r.scope === 'plan'),
    business: rules.filter((r) => r.scope === 'business'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-400" />
            <h1 className="text-xl font-bold text-white">AI Playbook</h1>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Business rules injected into every agent's system prompt. Controls AI behaviour across all models without code changes.
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null) }}
          className="flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600"
        >
          <Plus className="h-4 w-4" /> New Rule
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <RuleForm
          onSave={(d) => createRule(d as any)}
          onCancel={() => setCreating(false)}
          saving={creating_}
        />
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-800" />)}
        </div>
      )}

      {/* Rule groups */}
      {(['global', 'plan', 'business'] as const).map((scope) => {
        const scopeRules = grouped[scope]
        const Icon = SCOPE_ICONS[scope]
        return (
          <div key={scope}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 capitalize">
                {scope} rules
              </p>
              <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                {scopeRules.length}
              </span>
            </div>

            {scopeRules.length === 0 ? (
              <p className="text-xs text-gray-700 px-1">No {scope} rules yet.</p>
            ) : (
              <div className="space-y-2">
                {scopeRules.map((rule) => (
                  <div key={rule.id}>
                    {editing?.id === rule.id ? (
                      <RuleForm
                        initial={rule}
                        onSave={(d) => updateRule({ id: rule.id, ...d })}
                        onCancel={() => setEditing(null)}
                        saving={updating}
                      />
                    ) : (
                      <div
                        className={cn(
                          'rounded-xl border p-4 transition-colors',
                          rule.is_active
                            ? 'border-gray-800 bg-gray-900'
                            : 'border-gray-800 bg-gray-900 opacity-50',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', SCOPE_COLORS[rule.scope])}>
                                {rule.scope}
                              </span>
                              {rule.plan && (
                                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">{rule.plan}</span>
                              )}
                              <span className="font-mono text-xs font-semibold text-violet-300">{rule.trigger}</span>
                              <span className="text-[10px] text-gray-600">p:{rule.priority}</span>
                              {rule.feature_condition && (
                                <span className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                                  if {rule.feature_condition}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed">{rule.instruction}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleRule({ id: rule.id, is_active: !rule.is_active })}
                              title={rule.is_active ? 'Deactivate' : 'Activate'}
                              className="text-gray-600 hover:text-gray-300 transition-colors"
                            >
                              {rule.is_active
                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                : <XCircle className="h-4 w-4 text-gray-600" />}
                            </button>
                            <button
                              onClick={() => { setEditing(rule); setCreating(false) }}
                              className="text-gray-600 hover:text-gray-300 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete rule "${rule.trigger}"?`)) deleteRule(rule.id) }}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
