import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { superAdminApi } from '@/api/superAdmin'
import { cn } from '@/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

const PLANS = ['free', 'starter', 'pro', 'enterprise'] as const
type Plan = typeof PLANS[number]

interface FlagHint {
  type: 'boolean' | 'number' | 'array'
  description: string
  min?: number
  max?: number
  suggestions?: { value: string; label: string; provider?: string }[]
}

// ── Style maps ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<Plan, string> = {
  free:       'text-gray-400',
  starter:    'text-blue-400',
  pro:        'text-violet-400',
  enterprise: 'text-amber-400',
}

const PLAN_RING: Record<Plan, string> = {
  free:       'ring-gray-500 border-gray-600',
  starter:    'ring-blue-500 border-blue-800',
  pro:        'ring-violet-500 border-violet-800',
  enterprise: 'ring-amber-500 border-amber-800',
}

const PLAN_BADGE: Record<string, string> = {
  free:       'bg-gray-700 text-gray-300',
  starter:    'bg-blue-900 text-blue-300',
  pro:        'bg-violet-900 text-violet-300',
  enterprise: 'bg-amber-900 text-amber-300',
}

// Infer flag type from its current value or key name when hints aren't available.
function inferType(flag: string, value: unknown): 'boolean' | 'number' | 'array' {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'array'
  // value is null — guess from the flag key
  if (flag === 'ai.models' || flag === 'ai.tools') return 'array'
  if (flag.endsWith('_limit') || flag === 'ai.max_iterations') return 'number'
  return 'boolean'
}

// ── Read-only cell ────────────────────────────────────────────────────────────

function ReadCell({ val }: { val: unknown }) {
  if (val === null) return <span className="font-mono text-yellow-400">∞</span>
  if (val === true)  return <span className="text-green-400">✓</span>
  if (val === false) return <span className="text-red-400 opacity-40">✗</span>
  if (Array.isArray(val)) {
    return (
      <div className="space-y-0.5 text-left">
        {(val as string[]).map((v) => (
          <span key={v} className="block font-mono text-xs text-gray-400">{v}</span>
        ))}
      </div>
    )
  }
  return <span className="font-mono text-gray-300">{String(val)}</span>
}

// ── Edit controls ─────────────────────────────────────────────────────────────
// RULE: never nest number inputs or buttons inside a <label> element.
// Clicking an interactive child of a <label> re-fires the label click which
// re-triggers its radio onChange, resetting the value.
// Use htmlFor/id to associate labels with their radios instead.

interface EditControlProps {
  flag: string
  value: unknown
  hint?: FlagHint   // optional — degrades gracefully when hints API is unavailable
  onChange: (v: unknown) => void
}

function EditControl({ flag, value, hint, onChange }: EditControlProps) {
  const type = hint?.type ?? inferType(flag, value)

  // ── Boolean ───────────────────────────────────────────────────────────────
  if (type === 'boolean') {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
            value === true
              ? 'border-green-600 bg-green-900/40 text-green-400'
              : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-gray-300',
          )}
        >
          ✓ Enabled
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
            value === false
              ? 'border-red-800 bg-red-900/30 text-red-400'
              : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-gray-300',
          )}
        >
          ✗ Disabled
        </button>
      </div>
    )
  }

  // ── Number ────────────────────────────────────────────────────────────────
  if (type === 'number') {
    const isUnlimited = value === null
    const unlimitedId = `${flag}-unlimited`
    const customId    = `${flag}-custom`

    return (
      <div className="flex flex-col gap-3">
        {/* Row 1 — unlimited */}
        <div className="flex items-center gap-3">
          <input
            id={unlimitedId}
            type="radio"
            checked={isUnlimited}
            onChange={() => onChange(null)}
            className="h-4 w-4 accent-yellow-400 cursor-pointer"
          />
          <label
            htmlFor={unlimitedId}
            className={cn('cursor-pointer select-none text-sm', isUnlimited ? 'text-yellow-400' : 'text-gray-400')}
          >
            ∞ Unlimited
          </label>
        </div>

        {/* Row 2 — custom: radio label + number input are siblings, NOT nested */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            id={customId}
            type="radio"
            checked={!isUnlimited}
            onChange={() => onChange(hint?.min ?? 1)}
            className="h-4 w-4 accent-blue-400 cursor-pointer"
          />
          <label
            htmlFor={customId}
            className={cn('cursor-pointer select-none text-sm', !isUnlimited ? 'text-white' : 'text-gray-400')}
          >
            Custom limit:
          </label>
          {/* input is a sibling of label — NOT inside it */}
          <input
            type="number"
            min={hint?.min ?? 0}
            max={hint?.max}
            value={isUnlimited ? '' : String(value as number)}
            disabled={isUnlimited}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              onChange(isNaN(n) ? (hint?.min ?? 1) : n)
            }}
            onClick={() => { if (isUnlimited) onChange(hint?.min ?? 1) }}
            className="w-24 rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-center font-mono text-sm text-white focus:border-gray-400 focus:outline-none disabled:opacity-30"
          />
          {hint?.min !== undefined && hint?.max !== undefined && (
            <span className="text-xs text-gray-500">
              range: {hint.min.toLocaleString()} – {hint.max.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Array ─────────────────────────────────────────────────────────────────
  if (type === 'array') {
    const isUnlimited = value === null
    const selected: string[] = isUnlimited ? [] : (value as string[])
    const unlimitedId = `${flag}-unlimited`
    const specificId  = `${flag}-specific`
    const hasSuggestions = (hint?.suggestions?.length ?? 0) > 0

    const toggle = (v: string) =>
      onChange(
        selected.includes(v)
          ? selected.filter((s) => s !== v)
          : [...selected, v],
      )

    return (
      <div className="flex flex-col gap-3">
        {/* Row 1 — unlimited radio */}
        <div className="flex items-center gap-3">
          <input
            id={unlimitedId}
            type="radio"
            checked={isUnlimited}
            onChange={() => onChange(null)}
            className="h-4 w-4 accent-yellow-400 cursor-pointer"
          />
          <label
            htmlFor={unlimitedId}
            className={cn('cursor-pointer select-none text-sm', isUnlimited ? 'text-yellow-400' : 'text-gray-400')}
          >
            ∞ All (unlimited — no restriction)
          </label>
        </div>

        {/* Row 2 — specific radio. Label text only, NO interactive children. */}
        <div className="flex items-center gap-3">
          <input
            id={specificId}
            type="radio"
            checked={!isUnlimited}
            onChange={() => onChange([])}
            className="h-4 w-4 accent-blue-400 cursor-pointer"
          />
          <label
            htmlFor={specificId}
            className={cn('cursor-pointer select-none text-sm', !isUnlimited ? 'text-white' : 'text-gray-400')}
          >
            Choose specific:
          </label>
          {!isUnlimited && (
            <span className="text-xs text-gray-500">
              {selected.length === 0 ? 'none selected' : `${selected.length} selected`}
            </span>
          )}
        </div>

        {/* Chip grid — sibling of the radios, NOT inside any label */}
        {!isUnlimited && (
          hasSuggestions ? (
            <div className="ml-7 flex flex-wrap gap-2">
              {hint!.suggestions!.map((s) => {
                const active = selected.includes(s.value)
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggle(s.value)}
                    className={cn(
                      'flex flex-col rounded-lg border px-3 py-2 text-left transition-colors',
                      active
                        ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-200',
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={cn('w-3 shrink-0 text-center leading-none', active ? 'text-blue-400' : 'text-gray-600')}>
                        {active ? '✓' : '+'}
                      </span>
                      {s.label}
                    </span>
                    {(s.provider || (s.value !== s.label)) && (
                      <span className="ml-4 mt-0.5 font-mono text-xs text-gray-600">
                        {s.provider ?? s.value}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            /* Textarea fallback when no suggestions */
            <textarea
              className="ml-7 w-full max-w-sm resize-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-300 focus:border-gray-400 focus:outline-none"
              rows={4}
              placeholder="One value per line"
              value={selected.join('\n')}
              onChange={(e) => {
                const raw = e.target.value
                onChange(raw.trim() ? raw.split('\n').map((s) => s.trim()).filter(Boolean) : [])
              }}
            />
          )
        )}
      </div>
    )
  }

  return null
}

// ── Flag row ──────────────────────────────────────────────────────────────────

function FlagEditRow({
  flag, value, hint, onChange,
}: {
  flag: string
  value: unknown
  hint?: FlagHint
  onChange: (v: unknown) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,17rem)_1fr] gap-8 border-b border-gray-800 py-5 last:border-0">
      <div>
        <p className="font-mono text-sm text-gray-200">{flag}</p>
        {hint?.description && (
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{hint.description}</p>
        )}
      </div>
      <div>
        <EditControl flag={flag} value={value} hint={hint} onChange={onChange} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SuperAdminPlanDefaults() {
  const qc = useQueryClient()

  const [planErrors, setPlanErrors] = useState<Record<string, string>>({})
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const editPanelRef = useRef<HTMLDivElement>(null)

  // Scroll into view when edit panel opens
  useEffect(() => {
    if (editingPlan && editPanelRef.current) {
      setTimeout(() => {
        editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [editingPlan])

  const { data: defaults, isLoading: defaultsLoading } = useQuery({
    queryKey: ['plan-defaults'],
    queryFn: superAdminApi.getPlanDefaults,
  })

  // Hints are optional — page renders without them; they just enhance the edit UI.
  const { data: hints } = useQuery({
    queryKey: ['plan-hints'],
    queryFn: superAdminApi.getPlanHints,
    staleTime: Infinity,
    retry: 2,
  })

  const { data: businesses = [], isLoading: bizLoading } = useQuery({
    queryKey: ['super-admin-businesses'],
    queryFn: superAdminApi.listBusinesses,
  })

  const { mutate: setPlan } = useMutation({
    mutationFn: ({ slug, plan }: { slug: string; plan: string }) =>
      superAdminApi.setPlan(slug, plan),
    onMutate: ({ slug }) => {
      setPendingSlug(slug)
      setPlanErrors((e) => { const { [slug]: _, ...rest } = e; return rest })
    },
    onSuccess: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['super-admin-businesses'] })
    },
    onError: (e: any, { slug }) => {
      setPendingSlug(null)
      setPlanErrors((prev) => ({
        ...prev,
        [slug]: e?.response?.data?.error?.message ?? 'Failed to update plan',
      }))
    },
  })

  const { mutate: savePlanDef, isPending: savingPlan } = useMutation({
    mutationFn: () => superAdminApi.updatePlanDefinition(editingPlan!, editDraft),
    onSuccess: () => {
      setSaveError(null)
      setEditingPlan(null)
      qc.invalidateQueries({ queryKey: ['plan-defaults'] })
    },
    onError: (e: any) => {
      setSaveError(e?.response?.data?.error?.message ?? 'Failed to save plan')
    },
  })

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan)
    // Use all known flag keys (from hints or all plans in defaults) so a
    // partially-stored DB plan never silently drops flags in the draft.
    const allFlagKeys = hints
      ? Object.keys(hints)
      : Array.from(
          new Set(
            Object.values(defaults ?? {}).flatMap((planFlags) => Object.keys(planFlags as object))
          )
        )
    const draft = allFlagKeys.reduce<Record<string, unknown>>((acc, f) => {
      // Prefer the plan's own value; fall back to free-tier value as a type reference.
      acc[f] = (defaults?.[plan] as any)?.[f] ?? null
      return acc
    }, {})
    setEditDraft(draft)
    setSaveError(null)
  }

  const cancelEdit = () => {
    setEditingPlan(null)
    setSaveError(null)
  }

  if (defaultsLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-800" />
  }

  // Drive the flag list from hints (which always lists all 16 flags from the
  // backend registries) so a partially-stored DB plan never hides flags.
  // Fall back to whatever the defaults API returns for "free" if hints aren't loaded.
  const flags = hints
    ? Object.keys(hints)
    : Object.keys(defaults?.free ?? {})

  return (
    <div className="space-y-8">

      {/* ── Comparison table (always read-only) ─────────────────────────── */}
      <div>
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">Plan Defaults</h1>
          <p className="text-sm text-gray-400">
            Click <span className="font-medium text-gray-300">Edit</span> on any plan to open its editor below the table.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="w-52 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Feature Flag
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p}
                    className={cn(
                      'px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider',
                      PLAN_COLORS[p],
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="capitalize">{p}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        disabled={editingPlan !== null}
                        className={cn(
                          'rounded border px-3 py-0.5 text-xs font-medium transition-colors',
                          editingPlan === p
                            ? cn(PLAN_BADGE[p], 'border-transparent')
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30',
                        )}
                      >
                        {editingPlan === p ? 'Editing…' : 'Edit'}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {flags.map((flag) => (
                <tr key={flag} className="hover:bg-gray-900/50">
                  <td
                    className="px-4 py-3 font-mono text-xs text-gray-400"
                    title={hints?.[flag]?.description}
                  >
                    {flag}
                  </td>
                  {PLANS.map((p) => (
                    <td key={p} className="px-4 py-3 text-center text-xs">
                      <ReadCell val={defaults?.[p]?.[flag]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit panel — shown whenever editingPlan is set, hints are optional ── */}
      {editingPlan && (
        <div
          ref={editPanelRef}
          className={cn('rounded-xl border ring-1 bg-gray-900', PLAN_RING[editingPlan])}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Editing:{' '}
                <span className={cn('capitalize', PLAN_COLORS[editingPlan])}>
                  {editingPlan}
                </span>{' '}
                plan
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Changes apply to all businesses on this tier (per-business overrides are preserved).
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saveError && <span className="text-xs text-red-400">{saveError}</span>}
              <button
                type="button"
                onClick={cancelEdit}
                disabled={savingPlan}
                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => savePlanDef()}
                disabled={savingPlan}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {savingPlan ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Flag rows */}
          <div className="px-6">
            {flags.map((flag) => (
              <FlagEditRow
                key={flag}
                flag={flag}
                value={editDraft[flag]}
                hint={hints?.[flag]}        // optional — degrades to inferred type
                onChange={(v) => setEditDraft((d) => ({ ...d, [flag]: v }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Business plan assignments ────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Business Plan Assignments</h2>
          <p className="text-sm text-gray-400">
            Change a business's plan tier. Per-business overrides are preserved.
          </p>
        </div>

        {bizLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-800" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <p className="text-sm text-gray-500">No businesses found.</p>
        ) : (
          <div className="space-y-2">
            {businesses.map((biz) => {
              const isPending = pendingSlug === biz.business_slug
              const error = planErrors[biz.business_slug]
              return (
                <div
                  key={biz.business_id}
                  className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{biz.business_name}</p>
                      <p className="font-mono text-xs text-gray-500">{biz.business_slug}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {PLANS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPlan({ slug: biz.business_slug, plan: p })}
                          disabled={isPending || biz.plan === p}
                          className={cn(
                            'rounded-lg border px-3 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                            biz.plan === p
                              ? cn('border-transparent', PLAN_BADGE[p] ?? PLAN_BADGE.free)
                              : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200',
                          )}
                        >
                          {isPending && biz.plan !== p ? '…' : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
